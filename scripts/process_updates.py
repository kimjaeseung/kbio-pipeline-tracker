"""
수집된 raw 데이터를 Claude API로 구조화하여 changelog.json 업데이트
"""
import anthropic
import json
import os
import sys
from datetime import datetime

# scripts/ 디렉토리에서 실행 시 상위 경로 추가
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from config import COMPANIES

client = anthropic.Anthropic()
TODAY = datetime.now().strftime("%Y-%m-%d")


def parse_dart_disclosure(company_name, disclosure):
    """DART 공시 제목 → 구조화된 이벤트 (Claude Haiku)"""
    prompt = f"""다음은 {company_name}의 DART 공시 제목입니다.
임상 파이프라인과 관련이 있으면 JSON으로 추출해줘. 관련 없으면 null.

공시 제목: {disclosure['title']}
공시 날짜: {disclosure['date']}

JSON만 반환 (다른 텍스트 없이):
{{
  "relevant": true/false,
  "event_type": "clinical_result" | "ind_approval" | "license_out" | "partnership" | "regulatory" | "other",
  "drug_name": "약물명 또는 null",
  "summary": "한줄 요약 (한국어, 30자 이내)",
  "importance": "high" | "medium" | "low"
}}"""

    try:
        response = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=300,
            messages=[{"role": "user", "content": prompt}],
        )
        text = response.content[0].text.strip().replace("```json", "").replace("```", "").strip()
        return json.loads(text)
    except Exception as e:
        print(f"  [Claude] 파싱 실패: {e}")
        return None


def parse_ct_update(company_name, company_id, trial):
    """ClinicalTrials 업데이트가 주목할 만한지 판단"""
    # lastUpdate가 최근 7일 이내인 것만 처리
    if not trial.get("lastUpdate"):
        return None

    try:
        update_date = datetime.strptime(trial["lastUpdate"], "%Y-%m-%d")
        days_ago = (datetime.now() - update_date).days
        if days_ago > 7:
            return None
    except Exception:
        return None

    # RECRUITING → COMPLETED 같은 상태 변화가 주목할 만함
    notable_statuses = ["완료", "모집 중", "조기 종료"]
    if trial["status"] not in notable_statuses:
        return None

    return {
        "date": trial["lastUpdate"],
        "company": company_name,
        "companyId": company_id,
        "type": "ct_update",
        "summary": f"{trial['title'][:50]} — {trial['status']}",
        "source": "ClinicalTrials.gov",
        "url": trial.get("url"),
    }


def update_changelog(new_entries):
    """changelog.json에 새 항목 추가 (최근 100개 유지)"""
    changelog_path = os.path.join(
        os.path.dirname(os.path.abspath(__file__)), "..", "src", "data", "changelog.json"
    )

    existing = []
    if os.path.exists(changelog_path):
        with open(changelog_path, "r", encoding="utf-8") as f:
            existing = json.load(f)

    # 중복 제거 (같은 날짜 + company + summary)
    existing_keys = {(e.get("date"), e.get("company"), e.get("summary")) for e in existing}
    deduped = [e for e in new_entries if (e.get("date"), e.get("company"), e.get("summary")) not in existing_keys]

    merged = deduped + existing
    merged = merged[:100]

    with open(changelog_path, "w", encoding="utf-8") as f:
        json.dump(merged, f, ensure_ascii=False, indent=2)

    print(f"[changelog] {len(deduped)}건 추가, 총 {len(merged)}건")


def main():
    updates = []

    # 1. DART 공시 처리
    dart_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "raw_data", "dart", "latest.json")
    if os.path.exists(dart_path):
        with open(dart_path, "r", encoding="utf-8") as f:
            dart_data = json.load(f)

        for company_id, disclosures in dart_data.items():
            company_name = COMPANIES.get(company_id, {}).get("name", company_id)
            for disc in disclosures:
                result = parse_dart_disclosure(company_name, disc)
                if result and result.get("relevant"):
                    updates.append({
                        "id": f"dart-{disc['rcept_no']}",
                        "date": f"{disc['date'][:4]}-{disc['date'][4:6]}-{disc['date'][6:]}",
                        "company": company_name,
                        "companyId": company_id,
                        "type": result.get("event_type", "other"),
                        "summary": result.get("summary", disc["title"][:50]),
                        "importance": result.get("importance", "medium"),
                        "source": "DART",
                        "url": disc.get("url"),
                    })
                    print(f"[DART] {company_name}: {result.get('summary')}")

    # 2. ClinicalTrials 업데이트 처리
    ct_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "raw_data", "ct", "latest.json")
    if os.path.exists(ct_path):
        with open(ct_path, "r", encoding="utf-8") as f:
            ct_data = json.load(f)

        for company_id, trials in ct_data.items():
            company_name = COMPANIES.get(company_id, {}).get("name", company_id)
            for trial in trials:
                entry = parse_ct_update(company_name, company_id, trial)
                if entry:
                    updates.append(entry)
                    print(f"[CT.gov] {company_name}: {entry['summary'][:60]}")

    if updates:
        update_changelog(updates)
        print(f"\n총 {len(updates)}건 처리 완료")
    else:
        print("새 업데이트 없음")


if __name__ == "__main__":
    main()
