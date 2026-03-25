# K-Bio Pipeline Tracker — 셋업 가이드

## 배포 구조

```
GitHub (main branch)
    ↓ push
Vercel (자동 빌드+배포)
    → https://bioinsight-nine.vercel.app
```

GitHub에 push하면 Vercel이 자동으로 감지하여 빌드 및 배포합니다.

## GitHub Secrets 설정

GitHub Actions 자동 데이터 업데이트를 위해 아래 Secrets를 등록하세요.

**등록 경로:** GitHub 저장소 → Settings → Secrets and variables → Actions → New repository secret

| Secret 이름 | 설명 | 발급처 |
|---|---|---|
| `DART_API_KEY` | DART OpenAPI 키 | https://opendart.fss.or.kr → 인증키 신청/관리 |
| `ANTHROPIC_API_KEY` | Claude API 키 | https://console.anthropic.com |

## Vercel 연동

1. https://vercel.com/bioinsight/bioinsight/settings 에서 Git Repository 연결
2. GitHub 계정의 `kbio-pipeline-tracker` 저장소 선택
3. 이후 `main` 브랜치에 push하면 자동 배포

환경변수는 Vercel Dashboard → Settings → Environment Variables에서도 설정 가능합니다.

## GitHub Actions 워크플로우

`.github/workflows/daily-update.yml` — 매일 KST 09:00에 자동 실행:

1. DART 최근 7일 공시 수집
2. ClinicalTrials.gov 임상시험 현황 수집
3. Claude API로 관련 이벤트 파싱 → `src/data/changelog.json` 업데이트
4. 변경사항 있으면 `main` 브랜치에 커밋+push → Vercel 자동 배포

수동 실행: GitHub → Actions → Daily Data Update → Run workflow

## 수동 데이터 업데이트 실행

```bash
# 의존성 설치
pip install -r scripts/requirements.txt

# 환경변수 설정
export DART_API_KEY=your_key
export ANTHROPIC_API_KEY=your_key

# 스크립트 실행
python scripts/update_dart.py
python scripts/update_clinicaltrials.py
python scripts/process_updates.py
```

## 로컬 개발

```bash
npm install
npm run dev
```
