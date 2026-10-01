import time
import requests
from datetime import datetime, timezone
from app.core.config import settings
from app.core.database import SessionLocal
from app.models.location import Location

SEARCH_URL = "https://naverapihub.apigw.ntruss.com/search/v1/local"
SEARCH_HEADERS = {
    "X-NCP-APIGW-API-KEY-ID": settings.NAVER_SEARCH_CLIENT_ID,
    "X-NCP-APIGW-API-KEY": settings.NAVER_SEARCH_CLIENT_SECRET,
}

# (구, 원본 위치 설명, 검색 쿼리)
# 지오코딩(주소 매칭)으로 못 찾은 랜드마크/건물명 위주 항목들을 장소 검색으로 보완한다.
ITEMS = [
    # --- 서초구 ---
    ("서초구", "서울가정법원 청사 출입계단 밑", "서초구 서울가정법원"),
    ("서초구", "센트럴시티 호남선 출입구 옆", "서초구 센트럴시티"),
    ("서초구", "센트럴시티 경부선 하차장 옆", "서초구 센트럴시티"),
    ("서초구", "센트럴시티 경부선 건물 남쪽 외부 공간", "서초구 센트럴시티"),
    ("서초구", "고속버스터미널역 3번출구 앞 센트럴시티", "서초구 센트럴시티"),
    ("서초구", "서초구청 주차장 자판기 옆", "서초구 서초구청"),
    ("서초구", "강남역 7번 출구와 8번출구 사이 보도 (서초구보건소)", "서초구 서초구보건소"),
    ("서초구", "방배역 3번출구 먹자골목 입구 (서초구보건소)", "서초구 서초구보건소"),
    ("서초구", "서울시공공자전거 수리센터 앞 (서초구보건소)", "서초구 서초구보건소"),
    ("서초구", "방배경찰서 앞 (서초구보건소)", "서초구 방배경찰서"),
    ("서초구", "그린골프장 앞 (서초구보건소)", "서초구 그린골프장"),
    ("서초구", "카센터 옆 영동교회 맞은편 (서초구보건소)", "서초구 영동교회"),
    ("서초구", "남부순환로 2636 오선채 좌측골목 (서초구보건소)", "서초구 오선채"),
    ("서초구", "사당역 1번 출구와 2번 출구 사이 보도 (서초구보건소)", "서초구 사당역"),
    ("서초구", "반포효성빌딩 페라리 매장 앞 (서초구보건소)", "서초구 반포효성빌딩"),
    # --- 양천구 ---
    ("양천구", "양천구청 부지", "양천구 양천구청"),
    ("양천구", "해누리타운 4층 옥외정원", "양천구 해누리타운"),
    ("양천구", "양천경찰서 부지", "양천구 양천경찰서"),
    ("양천구", "남부지방법원 후문 옆", "양천구 남부지방법원"),
    ("양천구", "양천세무서 부지 우측", "양천구 양천세무서"),
    ("양천구", "서울시 출입국관리사무소 부지", "양천구 서울출입국관리사무소"),
    ("양천구", "법무복지공단 부지", "양천구 법무복지공단"),
    ("양천구", "이대목동병원 부지", "양천구 이대목동병원"),
    ("양천구", "홍익병원 옥상", "양천구 홍익병원"),
    ("양천구", "서남병원 부지", "양천구 서울특별시서남병원"),
    ("양천구", "현대백화점 4층", "양천구 현대백화점 목동점"),
    ("양천구", "방송회관 7층", "양천구 방송회관"),
    ("양천구", "상운맘모스빌딩 옥상", "양천구 상운맘모스빌딩"),
    ("양천구", "양천벤처타운 부지", "양천구 양천벤처타운"),
    ("양천구", "현대41타워 부지", "양천구 현대41타워"),
    ("양천구", "SBS 부지", "양천구 SBS"),
    ("양천구", "KT 목동타워 부지", "양천구 KT목동타워"),
    ("양천구", "KT 정보센터 부지", "양천구 KT정보센터"),
    ("양천구", "목동아이스링크 부지", "양천구 목동아이스링크"),
    ("양천구", "메디컬센터 옥상", "양천구 메디컬센터"),
    ("양천구", "양천차고지 1층", "양천구 양천차고지"),
    ("양천구", "현대드림타워 후문 부지", "양천구 현대드림타워"),
    ("양천구", "부영그린타운 3차 부지", "양천구 부영그린타운"),
    # --- 서울시 통합(smkFclt) 실패분 ---
    ("동대문구", "청량리역 선상광장", "동대문구 청량리역"),
    ("강서구", "마곡레포츠센터", "강서구 마곡레포츠센터"),
    ("강남구", "테헤란로 124 삼원타워 일대", "강남구 삼원타워"),
    ("강남구", "테헤란로 124 삼원타워 일대", "강남구 삼원타워"),
    ("강남구", "테헤란로 428 DB금융센터 일대", "강남구 DB금융센터"),
]


def search(query: str, expected_gu: str):
    response = requests.get(SEARCH_URL, headers=SEARCH_HEADERS, params={"query": query, "display": 5})
    data = response.json()
    for item in data.get("items", []):
        addr = item.get("roadAddress") or item.get("address") or ""
        if expected_gu in addr:
            lat = int(item["mapy"]) / 1e7
            lng = int(item["mapx"]) / 1e7
            title = item["title"].replace("<b>", "").replace("</b>", "")
            return lat, lng, addr, title
    return None


db = SessionLocal()
saved = 0
failed = []

for gu, description, query in ITEMS:
    result = search(query, gu)
    if result is None:
        failed.append((gu, description, query))
        continue

    lat, lng, addr, title = result
    lname = f"{title} ({description})"[:50]
    location = Location(
        category="smoking",
        lname=lname,
        addr=addr[:50],
        postgis=f"SRID=4326;POINT({lng} {lat})",
        apifrom="seoul_local_search",
        cr_clock=datetime.now(timezone.utc),
        up_clock=datetime.now(timezone.utc),
    )
    db.add(location)
    saved += 1
    time.sleep(0.05)

db.commit()
db.close()

print(f"저장 완료: {saved}/{len(ITEMS)}건")
if failed:
    print(f"여전히 실패: {len(failed)}건")
    for gu, description, query in failed:
        print(f"  - [{gu}] {description} (검색어: {query})")
