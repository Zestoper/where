import re
import time
import requests
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from app.core.config import settings
from app.core.database import SessionLocal
from app.models.location import Location

SEOUL_URL = f"http://openapi.seoul.go.kr:8088/{settings.SEOUL_API_KEY}/xml/smkFclt/1/200/"
GEOCODE_URL = "https://maps.apigw.ntruss.com/map-geocode/v2/geocode"
GEOCODE_HEADERS = {
    "x-ncp-apigw-api-key-id": settings.NAVER_CLIENT_ID,
    "x-ncp-apigw-api-key": settings.NAVER_CLIENT_SECRET,
    "Accept": "application/json",
}

PAREN_RE = re.compile(r"\(([^)]+)\)")


def geocode(query: str):
    response = requests.get(GEOCODE_URL, headers=GEOCODE_HEADERS, params={"query": query})
    data = response.json()
    addresses = data.get("addresses") or []
    if not addresses:
        return None
    best = addresses[0]
    return float(best["y"]), float(best["x"]), best.get("roadAddress") or best.get("jibunAddress")


response = requests.get(SEOUL_URL)
root = ET.fromstring(response.text)
total_count = int(root.find("list_total_count").text)
rows = root.findall("row")
print(f"총 {total_count}건, {len(rows)}건 조회됨")

# 중구/서초구/양천구/영등포구는 seed_seoul_smoking_gu.py의 개별 구 데이터가 더 정확하고
# 최신이라 여기서는 제외하고, 나머지 구만 이 통합 API로 채운다.
SKIP_GU = {"중구", "서초구", "양천구", "영등포구"}

db = SessionLocal()
saved = 0
failed = []

for row in rows:
    cgg_nm = row.find("CGG_NM").text.strip()
    instl_pstn = row.find("INSTL_PSTN").text.strip()

    if cgg_nm in SKIP_GU:
        continue

    paren_match = PAREN_RE.search(instl_pstn)
    query = f"서울 {cgg_nm} {paren_match.group(1)}" if paren_match else f"서울 {cgg_nm} {instl_pstn}"

    geocoded = geocode(query)
    if geocoded is None:
        failed.append((cgg_nm, instl_pstn))
        continue

    lat, lng, road_addr = geocoded
    name = PAREN_RE.sub("", instl_pstn).strip() or instl_pstn

    location = Location(
        category="smoking",
        lname=name,
        addr=road_addr or f"{cgg_nm} {instl_pstn}",
        postgis=f"SRID=4326;POINT({lng} {lat})",
        apifrom="seoul_opendata_smkFclt",
        cr_clock=datetime.now(timezone.utc),
        up_clock=datetime.now(timezone.utc),
    )
    db.add(location)
    saved += 1
    time.sleep(0.05)

db.commit()
db.close()

print(f"저장 완료: {saved}건")
if failed:
    print(f"지오코딩 실패: {len(failed)}건 (수동 확인 필요)")
    for cgg_nm, instl_pstn in failed:
        print(f"  - {cgg_nm} {instl_pstn}")
