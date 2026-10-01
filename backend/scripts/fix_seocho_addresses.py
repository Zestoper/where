import time
import requests
import uuid
from datetime import datetime, timezone
from app.core.config import settings
from app.core.database import SessionLocal
from app.models.location import Location

GEOCODE_URL = "https://maps.apigw.ntruss.com/map-geocode/v2/geocode"
GEOCODE_HEADERS = {
    "x-ncp-apigw-api-key-id": settings.NAVER_CLIENT_ID,
    "x-ncp-apigw-api-key": settings.NAVER_CLIENT_SECRET,
    "Accept": "application/json",
}
SEARCH_URL = "https://naverapihub.apigw.ntruss.com/search/v1/local"
SEARCH_HEADERS = {
    "X-NCP-APIGW-API-KEY-ID": settings.NAVER_SEARCH_CLIENT_ID,
    "X-NCP-APIGW-API-KEY": settings.NAVER_SEARCH_CLIENT_SECRET,
}


def geocode(query: str):
    response = requests.get(GEOCODE_URL, headers=GEOCODE_HEADERS, params={"query": query})
    addresses = (response.json().get("addresses")) or []
    if not addresses:
        return None
    best = addresses[0]
    return float(best["y"]), float(best["x"]), best.get("roadAddress") or best.get("jibunAddress")


def local_search(query: str, expected_gu: str):
    response = requests.get(SEARCH_URL, headers=SEARCH_HEADERS, params={"query": query, "display": 5})
    for item in response.json().get("items", []):
        addr = item.get("roadAddress") or item.get("address") or ""
        if expected_gu in addr:
            return int(item["mapy"]) / 1e7, int(item["mapx"]) / 1e7, addr
    return None


# (삭제할 기존 row id, 새 lname, 지오코딩할 정확한 주소)
GEOCODE_FIXES = [
    ("dd4b6c9c-0dd2-41ee-9ef1-a44606c97190", "강남역 7,8번출구 사이 보도 (서초구보건소)", "서울 서초구 서초동 1319-5"),
    ("df864082-959a-45c0-9119-f3483ed9c585", "방배역 3번출구 먹자골목 입구 (서초구보건소)", "서울 서초구 방배동 910-9"),
    ("3ebe9379-ba01-4057-8404-1571fd9cb572", "서울시공공자전거 수리센터 앞 (서초구보건소)", "서울 서초구 방배동 438-38"),
    ("3b3e0efb-af1e-4611-a2e2-ff05eea4fd9e", "방배경찰서 앞 (서초구보건소)", "서울 서초구 방배동 455-10"),
    ("e2dcd4db-5adb-484c-837e-ca91d8c6dd89", "카센터 옆 영동교회 맞은편 (서초구보건소)", "서울 서초구 강남대로30길 7"),
    ("ce7b08d7-a94b-43eb-8cf8-c4787b7d18c5", "남부순환로 2636 오선채 좌측골목 (서초구보건소)", "서울 서초구 남부순환로 2636"),
    ("0e74be93-ac76-4b25-a695-fdd3dd0896e7", "반포효성빌딩 페라리 매장 앞 (서초구보건소)", "서울 서초구 반포동 63-7"),
]

# 새로 지번을 찾아 처음부터 살리는 항목 (기존에 완전히 실패했던 것)
NEW_GEOCODE_ITEMS = [
    ("그린골프장 앞 (서초구보건소)", "서울 서초구 방배동 452-1"),
]

# local search 쿼리를 더 구체적으로 바꿔서 다시 찾는 항목
SEARCH_FIXES = [
    ("f533c381-6d22-4968-b071-ff9840c88565", "사당역 1,2번출구 사이 보도 (서초구보건소)", "사당역", "서초구"),
]

db = SessionLocal()
fixed = 0
failed = []

for old_id, lname, query in GEOCODE_FIXES:
    result = geocode(query)
    if result is None:
        failed.append((lname, query))
        continue
    lat, lng, addr = result
    db.query(Location).filter(Location.id == uuid.UUID(old_id)).delete()
    db.add(Location(
        category="smoking",
        lname=lname[:50],
        addr=(addr or query)[:50],
        postgis=f"SRID=4326;POINT({lng} {lat})",
        apifrom="seoul_seocho_fix",
        cr_clock=datetime.now(timezone.utc),
        up_clock=datetime.now(timezone.utc),
    ))
    fixed += 1
    time.sleep(0.05)

for lname, query in NEW_GEOCODE_ITEMS:
    result = geocode(query)
    if result is None:
        failed.append((lname, query))
        continue
    lat, lng, addr = result
    db.add(Location(
        category="smoking",
        lname=lname[:50],
        addr=(addr or query)[:50],
        postgis=f"SRID=4326;POINT({lng} {lat})",
        apifrom="seoul_seocho_fix",
        cr_clock=datetime.now(timezone.utc),
        up_clock=datetime.now(timezone.utc),
    ))
    fixed += 1
    time.sleep(0.05)

for old_id, lname, query, gu in SEARCH_FIXES:
    result = local_search(query, gu)
    if result is None:
        failed.append((lname, query))
        continue
    lat, lng, addr = result
    db.query(Location).filter(Location.id == uuid.UUID(old_id)).delete()
    db.add(Location(
        category="smoking",
        lname=lname[:50],
        addr=addr[:50],
        postgis=f"SRID=4326;POINT({lng} {lat})",
        apifrom="seoul_seocho_fix",
        cr_clock=datetime.now(timezone.utc),
        up_clock=datetime.now(timezone.utc),
    ))
    fixed += 1

db.commit()
db.close()

print(f"수정 완료: {fixed}건")
if failed:
    print(f"실패: {len(failed)}건")
    for lname, query in failed:
        print(f"  - {lname} (검색어: {query})")
