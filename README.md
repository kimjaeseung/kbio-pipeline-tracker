# K-Bio Pipeline Tracker

> 국내 바이오텍 임상 파이프라인 분석 대시보드

**[🔗 바로가기 → kbio-pipeline.pages.dev](https://kbio-pipeline.pages.dev)**

국내 42개 바이오·제약 기업의 임상 파이프라인, 기술이전(L/O) 현황, 촉매 이벤트를 한눈에 볼 수 있는 무료 트래커입니다.
증권사 리포트를 일일이 찾아보지 않아도 주요 이벤트와 경쟁 현황을 빠르게 파악할 수 있도록 만들었습니다.

---

## 주요 기능

### 📊 기업 대시보드
- 42개 기업 파이프라인 한눈에 비교
- 카테고리(ADC, 이중항체, GLP-1, 바이오시밀러, 의료AI 등) / 시장(KOSPI·KOSDAQ) 필터
- 기술이전 규모·파트너사 기반 정렬
- 관심 기업 워치리스트 (로컬 저장)

### 🏢 기업 상세 페이지
- 전체 파이프라인 로드맵 (임상 단계별 시각화)
- **L/O 마일스톤 워터폴 차트** — 선급금(확정) vs 마일스톤(조건부) 구분
- **형이 알려주는 미친 포인트** — 7섹션 투자 인사이트
  - 핵심 메트릭 / 게임체인저 논리 / TAM
  - 리스크 + 현금/번레이트 분석
  - 시장 갈등 포인트 / 마일스톤 체크포인트
  - 낙관·비관 확률 시나리오 / 선반영 여부 분석

### 💊 파이프라인 상세 페이지
- 임상 단계별 히스토리 타임라인
- **효능 vs 안전성 Goldilocks Zone 버블 차트** — 경쟁약 대비 ORR/Grade3+ AE 포지셔닝
- 경쟁약 비교 테이블
- 학회 발표 데이터 출처 명시

### 📅 촉매 캘린더
- 42개 기업 77개 이벤트 전체 타임라인
- 임상 결과 / 허가 / 기술이전 / 학회 발표 타입별 분류
- 완료·예정 상태 구분

---

## 커버리지

| 항목 | 현황 |
|------|------|
| 트래킹 기업 | **42개** (KOSPI 12 / KOSDAQ 28 / NASDAQ 2) |
| 촉매 이벤트 | **77개** |
| 누적 기술이전 규모 | **약 14.6조원** (트래킹 기업 합산) |
| 데이터 기준일 | 2026년 3월 |

**포함 기업 카테고리**

`ADC` `이중항체` `GLP-1/비만` `바이오시밀러` `올리고뉴클레오타이드 CDMO`
`의료AI` `RNA치료제` `방사성의약품` `보툴리눔` `심혈관 신약` `P-CAB` 등

**주요 기업**

알테오젠 · 리가켐바이오 · 에이비엘바이오 · 유한양행 · HLB · 셀트리온 · 삼성바이오로직스
한미약품 · 에스티팜 · HK이노엔 · 휴젤 · 종근당 · SK바이오팜 · 루닛 외 28개

---

## 기술 스택

| 영역 | 사용 기술 |
|------|----------|
| 프레임워크 | React 19 + Vite 8 |
| 스타일링 | Tailwind CSS v4 |
| 라우팅 | React Router v7 |
| 차트 | Recharts 3 |
| SEO | react-helmet-async |
| 배포 | Cloudflare Pages |

---

## 로컬 실행

```bash
# 의존성 설치
npm install

# 개발 서버
npm run dev

# 프로덕션 빌드
npm run build
```

---

## 프로젝트 구조

```
src/
├── pages/
│   ├── HomePage.jsx              # 기업 목록 + 필터
│   ├── CompanyPage.jsx           # 기업 상세 (파이프라인 + 인사이트)
│   ├── PipelinePage.jsx          # 파이프라인 상세 (버블차트 + 경쟁약)
│   └── CalendarPage.jsx          # 촉매 캘린더
├── components/
│   ├── CompanyMadInsight.jsx     # 7섹션 투자 인사이트
│   ├── LOMilestoneWaterfall.jsx  # L/O 마일스톤 워터폴 차트
│   ├── EfficiencySafetyBubble.jsx # Goldilocks Zone 버블 차트
│   ├── PipelineRoadmap.jsx       # 임상 단계 로드맵
│   └── CatalystCalendar.jsx      # 촉매 캘린더 뷰
└── data/
    ├── companies.json            # 42개 기업 데이터
    ├── company-mad-insights.json # 기업별 투자 인사이트
    ├── catalysts.json            # 77개 촉매 이벤트
    ├── clinical-evidence.json    # 임상 근거 데이터
    └── tags.json                 # 파이프라인 태그
```

---

## 데이터 출처

- 각 기업 IR 자료 및 공시
- 식품의약품안전처 임상정보시스템
- ClinicalTrials.gov
- ESMO / ASCO / ASH / ADA 등 주요 학회 발표
- 증권사 투자 리포트 (신한투자증권, 삼성증권 등)

> ⚠️ 본 서비스는 투자 참고용 정보 제공을 목적으로 합니다.
> 투자 결정의 책임은 투자자 본인에게 있습니다.

---

## 라이선스

MIT License
