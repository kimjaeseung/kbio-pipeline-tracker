"""
ClinicalTrials.gov API v2에서 임상시험 상태 수집
API: https://clinicaltrials.gov/api/v2/studies
"""
import requests
import json
import os
from config import COMPANIES

CT_BASE = "https://clinicaltrials.gov/api/v2/studies"

PHASE_MAP = {
    "PHASE1": "Phase 1",
    "PHASE2": "Phase 2",
    "PHASE3": "Phase 3",
    "PHASE1_PHASE2": "Phase 1/2",
    "PHASE2_PHASE3": "Phase 2/3",
    "EARLY_PHASE1": "Phase 1a",
    "NA": "N/A",
}

STATUS_MAP = {
    "RECRUITING": "모집 중",
    "ACTIVE_NOT_RECRUITING": "진행 중 (모집 종료)",
    "COMPLETED": "완료",
    "NOT_YET_RECRUITING": "모집 예정",
    "TERMINATED": "조기 종료",
    "SUSPENDED": "일시 중단",
    "WITHDRAWN": "철회",
}


def search_trials(search_terms):
    """기업/약물명으로 임상시험 검색 (중복 제거)"""
    seen = set()
    results = []

    for term in search_terms:
        params = {
            "query.term": term,
            "pageSize": 20,
            "fields": (
                "NCTId,BriefTitle,OverallStatus,Phase,StartDate,"
                "PrimaryCompletionDate,EnrollmentCount,Condition,"
                "InterventionName,LastUpdatePostDate,OrgStudyId"
            ),
        }
        try:
            response = requests.get(CT_BASE, params=params, timeout=10)
            if response.status_code != 200:
                continue
            data = response.json()
        except Exception as e:
            print(f"  [CT.gov] 요청 실패 ({term}): {e}")
            continue

        for study in data.get("studies", []):
            info = study.get("protocolSection", {})
            ident = info.get("identificationModule", {})
            status_mod = info.get("statusModule", {})
            design = info.get("designModule", {})
            cond = info.get("conditionsModule", {})
            interv = info.get("armsInterventionsModule", {})

            nct_id = ident.get("nctId")
            if not nct_id or nct_id in seen:
                continue
            seen.add(nct_id)

            raw_phases = design.get("phases", [])
            phase_str = "/".join(PHASE_MAP.get(p, p) for p in raw_phases) if raw_phases else "N/A"
            raw_status = status_mod.get("overallStatus", "")

            results.append({
                "nctId": nct_id,
                "title": ident.get("briefTitle", ""),
                "status": STATUS_MAP.get(raw_status, raw_status),
                "phase": phase_str,
                "conditions": cond.get("conditions", [])[:3],
                "enrollment": design.get("enrollmentInfo", {}).get("count"),
                "startDate": status_mod.get("startDateStruct", {}).get("date"),
                "primaryCompletion": status_mod.get("primaryCompletionDateStruct", {}).get("date"),
                "lastUpdate": status_mod.get("lastUpdatePostDateStruct", {}).get("date"),
                "url": f"https://clinicaltrials.gov/study/{nct_id}",
            })

    return results


def main():
    all_trials = {}
    for company_id, info in COMPANIES.items():
        terms = info.get("ct_search_terms", [])
        if not terms:
            continue
        print(f"[CT.gov] {info['name']} 검색 중...")
        trials = search_trials(terms)
        if trials:
            all_trials[company_id] = trials
            print(f"  → {len(trials)}건 수집")

    os.makedirs("raw_data/ct", exist_ok=True)
    with open("raw_data/ct/latest.json", "w", encoding="utf-8") as f:
        json.dump(all_trials, f, ensure_ascii=False, indent=2)
    print(f"\n[CT.gov] 저장 완료: raw_data/ct/latest.json")


if __name__ == "__main__":
    main()
