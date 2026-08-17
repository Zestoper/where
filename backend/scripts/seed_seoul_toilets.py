import requests
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from app.core.config import settings
from app.core.database import SessionLocal
from app.models.location import Location

BASE_URL = f"http://openapi.seoul.go.kr:8088/{settings.SEOUL_API_KEY}/xml/mgisToiletPoi"
BATCH_SIZE = 1000

first_response = requests.get(f"{BASE_URL}/1/1/")
first_root = ET.fromstring(first_response.text)
total_count = int(first_root.find("list_total_count").text)
print(f"총 {total_count}건")

db = SessionLocal()

for start in range(1, total_count + 1, BATCH_SIZE):
    end = min(start + BATCH_SIZE - 1, total_count)
    response = requests.get(f"{BASE_URL}/{start}/{end}/")
    root = ET.fromstring(response.text)
    rows = root.findall("row")

    for row in rows:
        addr_new = row.find("ADDR_NEW").text.strip()
        addr_old = row.find("ADDR_OLD").text.strip()
        addr = addr_new if addr_new else addr_old
        lng = float(row.find("COORD_X").text)
        lat = float(row.find("COORD_Y").text)
        name = row.find("CONTS_NAME").text

        location = Location(
            category="toilet",
            lname=name,
            addr=addr,
            postgis=f"SRID=4326;POINT({lng} {lat})",
            apifrom="seoul_opendata",
            cr_clock=datetime.now(timezone.utc),
            up_clock=datetime.now(timezone.utc),
        )
        db.add(location)

    print(f"{start}~{end} 처리 완료")

db.commit()
db.close()
print("전체 완료")
