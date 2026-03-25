"""
DART OpenAPI에서 최근 공시 수집
API: https://opendart.fss.or.kr/api/list.json
"""
import requests
import json
import os
import zipfile
import io
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta
from config import COMPANIES

DART_API_KEY = os.environ.get("DART_API_KEY")
BASE_URL = "https://opendart.fss.or.kr/api"

KEYWORDS = [
    "임상", "기술이전", "라이선스", "계약", "FDA", "승인",
    "IND", "허가", "학회", "파이프라인", "신약", "특허",
    "NDA", "BLA", "Phase", "임상시험", "기술수출"
]


def fetch_corp_codes():
    """DART에서 전체 기업코드 XML 다운로드 후 ticker→corp_code 매핑 생성"""
    url = f"{BASE_URL}/corpCode.xml?crtfc_key={DART_API_KEY}"
    resp = requests.get(url)
    if resp.status_code != 200:
        print(f"[DART] corp_code XML 다운로드 실패: {resp.status_code}")
        return {}

    with zipfile.ZipFile(io.BytesIO(resp.content)) as z:
        with z.open("CORPCODE.xml") as f:
            tree = ET.parse(f)
    root = tree.getroot()

    ticker_map = {}
    for item in root.findall("list"):
        stock_code = item.findtext("stock_code", "").strip()
        corp_code = item.findtext("corp_code", "").strip()
        if stock_code:
            ticker_map[stock_code] = corp_code
    return ticker_map


def fetch_recent_disclosures(corp_code, days=7):
    """최근 N일간 공시 조회"""
    end_date = datetime.now().strftime("%Y%m%d")
    start_date = (datetime.now() - timedelta(days=days)).strftime("%Y%m%d")

    params = {
        "crtfc_key": DART_API_KEY,
        "corp_code": corp_code,
        "bgn_de": start_date,
        "end_de": end_date,
        "page_count": 100,
    }

    response = requests.get(f"{BASE_URL}/list.json", params=params)
    data = response.json()

    if data.get("status") != "000":
        return []

    relevant = []
    for item in data.get("list", []):
        title = item.get("report_nm", "")
        if any(kw in title for kw in KEYWORDS):
            relevant.append({
                "date": item["rcept_dt"],
                "title": title,
                "rcept_no": item["rcept_no"],
                "url": f"https://dart.fss.or.kr/dsaf001/main.do?rcpNo={item['rcept_no']}",
            })

    return relevant


def main():
    if not DART_API_KEY:
        print("[DART] DART_API_KEY 환경변수가 설정되지 않았습니다.")
        return

    # corp_code 자동 갱신 (ticker → corp_code 매핑)
    print("[DART] corp_code XML 조회 중...")
    ticker_map = fetch_corp_codes()

    # config의 dart_corp_code가 비어있으면 ticker_map에서 보완
    for company_id, info in COMPANIES.items():
        if not info.get("dart_corp_code") and info.get("ticker") in ticker_map:
            info["dart_corp_code"] = ticker_map[info["ticker"]]
            print(f"[DART] {info['name']} corp_code 자동 조회: {info['dart_corp_code']}")

    all_disclosures = {}
    for company_id, info in COMPANIES.items():
        corp_code = info.get("dart_corp_code")
        if not corp_code:
            print(f"[DART] {info['name']}: corp_code 없음, 건너뜀")
            continue
        disclosures = fetch_recent_disclosures(corp_code)
        if disclosures:
            all_disclosures[company_id] = disclosures
            print(f"[DART] {info['name']}: {len(disclosures)}건 수집")

    os.makedirs("raw_data/dart", exist_ok=True)
    with open("raw_data/dart/latest.json", "w", encoding="utf-8") as f:
        json.dump(all_disclosures, f, ensure_ascii=False, indent=2)
    print(f"[DART] 저장 완료: raw_data/dart/latest.json")


if __name__ == "__main__":
    main()
