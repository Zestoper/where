import csv
import io
import re
import time
import requests
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
PAREN_RE = re.compile(r"\(([^)]+)\)")

failed = []


def geocode(query: str):
    response = requests.get(GEOCODE_URL, headers=GEOCODE_HEADERS, params={"query": query})
    data = response.json()
    addresses = data.get("addresses") or []
    if not addresses:
        return None
    best = addresses[0]
    return float(best["y"]), float(best["x"]), best.get("roadAddress") or best.get("jibunAddress")


def download_csv(atch_file_id: str):
    url = f"https://www.data.go.kr/cmm/cmm/fileDownload.do?atchFileId={atch_file_id}&fileDetailSn=1&insertDataPrcus=N"
    response = requests.get(url)
    text = response.content.decode("cp949")
    return list(csv.DictReader(io.StringIO(text)))


def make_location(lname, addr, lat, lng, apifrom):
    return Location(
        category="smoking",
        lname=lname,
        addr=addr,
        postgis=f"SRID=4326;POINT({lng} {lat})",
        apifrom=apifrom,
        cr_clock=datetime.now(timezone.utc),
        up_clock=datetime.now(timezone.utc),
    )


def seed_junggu(db):
    rows = download_csv("FILE_000000002708981")
    saved = 0
    for row in rows:
        road_addr = row["설치도로명주소"].strip()
        name = row["설치위치"].strip()
        geocoded = geocode(road_addr)
        if geocoded is None:
            failed.append(("중구", name, road_addr))
            continue
        lat, lng, resolved_addr = geocoded
        db.add(make_location(name, resolved_addr or road_addr, lat, lng, "seoul_junggu_opendata"))
        saved += 1
        time.sleep(0.05)
    print(f"중구: {saved}/{len(rows)}건 저장")


def seed_seocho(db):
    rows = download_csv("FILE_000000003612454")
    saved = 0
    for row in rows:
        location_text = row["설치위치"].strip()
        installer = row["설치주체"].strip()
        paren_match = PAREN_RE.search(location_text)
        query = f"서울 서초구 {paren_match.group(1)}" if paren_match else f"서울 서초구 {location_text}"
        geocoded = geocode(query)
        if geocoded is None:
            failed.append(("서초구", installer, location_text))
            continue
        lat, lng, resolved_addr = geocoded
        name = installer or PAREN_RE.sub("", location_text).strip()
        db.add(make_location(name, resolved_addr or f"서초구 {location_text}", lat, lng, "seoul_seocho_opendata"))
        saved += 1
        time.sleep(0.05)
    print(f"서초구: {saved}/{len(rows)}건 저장")


def seed_yangcheon(db):
    rows = download_csv("FILE_000000003229193")
    saved = 0
    for row in rows:
        location_text = row["설치 위치"].strip()
        query = f"서울 양천구 {location_text}"
        geocoded = geocode(query)
        if geocoded is None:
            failed.append(("양천구", location_text, location_text))
            continue
        lat, lng, resolved_addr = geocoded
        db.add(make_location(location_text, resolved_addr or f"양천구 {location_text}", lat, lng, "seoul_yangcheon_opendata"))
        saved += 1
        time.sleep(0.05)
    print(f"양천구: {saved}/{len(rows)}건 저장")


def seed_yeongdeungpo(db):
    rows = download_csv("FILE_000000002855924")
    saved = 0
    for row in rows:
        name = row["시설 구분"].strip()
        lat = float(row["위도"])
        lng = float(row["경도"])
        addr = f"서울 영등포구 {name}"
        db.add(make_location(name, addr, lat, lng, "seoul_ydp_opendata"))
        saved += 1
    print(f"영등포구: {saved}/{len(rows)}건 저장 (좌표 데이터 포함, 지오코딩 불필요)")


db = SessionLocal()
seed_junggu(db)
seed_seocho(db)
seed_yangcheon(db)
seed_yeongdeungpo(db)
db.commit()
db.close()

if failed:
    print(f"\n지오코딩 실패: {len(failed)}건 (수동 확인 필요)")
    for gu, name, text in failed:
        print(f"  - [{gu}] {name} ({text})")
