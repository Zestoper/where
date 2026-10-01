import re
from fastapi import APIRouter, Query
import requests
from app.core.config import settings

router = APIRouter()

GEOCODE_URL = "https://maps.apigw.ntruss.com/map-geocode/v2/geocode"
LOCAL_SEARCH_URL = "https://naverapihub.apigw.ntruss.com/search/v1/local"
TAG_RE = re.compile(r"</?b>")


def geocode(query: str):
    response = requests.get(
        GEOCODE_URL,
        headers={
            "x-ncp-apigw-api-key-id": settings.NAVER_CLIENT_ID,
            "x-ncp-apigw-api-key": settings.NAVER_CLIENT_SECRET,
            "Accept": "application/json",
        },
        params={"query": query, "count": 5},
    )
    data = response.json()
    return [
        {
            "lat": float(addr["y"]),
            "lng": float(addr["x"]),
            "address": addr.get("roadAddress") or addr.get("jibunAddress"),
        }
        for addr in data.get("addresses", [])
    ]


def local_search(query: str):
    response = requests.get(
        LOCAL_SEARCH_URL,
        headers={
            "X-NCP-APIGW-API-KEY-ID": settings.NAVER_SEARCH_CLIENT_ID,
            "X-NCP-APIGW-API-KEY": settings.NAVER_SEARCH_CLIENT_SECRET,
        },
        params={"query": query, "display": 5},
    )
    data = response.json()
    return [
        {
            "lat": int(item["mapy"]) / 1e7,
            "lng": int(item["mapx"]) / 1e7,
            "address": TAG_RE.sub("", item["title"]) + " · " + (item.get("roadAddress") or item.get("address") or ""),
        }
        for item in data.get("items", [])
    ]


@router.get("/")
def search_location(query: str = Query(..., min_length=1)):
    results = geocode(query)
    if results:
        return results
    return local_search(query)
