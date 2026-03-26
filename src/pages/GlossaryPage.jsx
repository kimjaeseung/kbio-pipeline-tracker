import { useState } from 'react';
import { Helmet } from 'react-helmet-async';

const GLOSSARY = [
  {
    category: '임상 단계',
    color: '#3b82f6',
    items: [
      { term: 'IND (임상시험계획승인)', en: 'Investigational New Drug', desc: '인체 임상시험을 시작하기 전 FDA/식약처에 제출하는 승인 신청. IND 승인 = 임상 1상 시작 가능 상태.' },
      { term: 'Phase 1 (임상 1상)', en: 'Phase 1 Clinical Trial', desc: '소수(20~80명)의 건강한 지원자 또는 환자 대상. 주목적은 안전성·용량·약동학 확인. 효능보다 안전성 우선.' },
      { term: 'Phase 2 (임상 2상)', en: 'Phase 2 Clinical Trial', desc: '수백 명 환자 대상. 효능 초기 증거 및 최적 용량 탐색. Phase 2a(탐색적)와 Phase 2b(확증적)로 나뉘기도 함.' },
      { term: 'Phase 3 (임상 3상)', en: 'Phase 3 Clinical Trial', desc: '수백~수천 명 대상 대규모 무작위배정 임상. 허가를 위한 핵심 데이터 수집. 허가 신청 전 마지막 관문.' },
      { term: 'BLA / NDA', en: 'Biologics/New Drug Application', desc: 'FDA에 제출하는 허가 신청서. BLA = 바이오의약품, NDA = 합성의약품. 제출 후 FDA 심사 기간 약 10~12개월.' },
      { term: 'FDA 승인', en: 'FDA Approval', desc: '미국 식품의약국(FDA)의 신약 판매 허가. 글로벌 시장 진입의 최고 관문. 승인 즉시 전 세계 의사들의 처방 가능.' },
      { term: '패스트트랙', en: 'Fast Track Designation', desc: 'FDA가 중증·미충족 수요 질환 치료제에 부여하는 우선 검토 자격. 심사 기간 단축 및 FDA와 소통 빈도 증가.' },
      { term: '희귀의약품 지정', en: 'Orphan Drug Designation', desc: '환자 수 20만 명 이하 희귀질환 대상 치료제에 부여. 세금 공제·시장 독점권 7년·우선 심사 혜택.' },
    ],
  },
  {
    category: '약물 유형',
    color: '#8b5cf6',
    items: [
      { term: 'ADC', en: 'Antibody-Drug Conjugate', desc: '항체(Antibody)에 독소(Drug)를 링커(Conjugate)로 연결한 약. 항체가 암세포를 찾아가 독소를 터뜨리는 "항체 미사일". 엔허투(T-DXd)가 대표작.' },
      { term: '바이오시밀러', en: 'Biosimilar', desc: '특허 만료된 바이오의약품(오리지널)과 동등한 효능·안전성을 가진 복제약. 가격이 30~60% 저렴. 셀트리온 람시마, 삼성바이오에피스 제품이 대표적.' },
      { term: '이중항체', en: 'Bispecific Antibody', desc: '두 가지 다른 표적을 동시에 인식하는 항체. 암세포 표적 + T세포 활성화를 한 분자로 수행. ABL바이오 Grabody, 얀센 Teclistamab 등.' },
      { term: 'CAR-T', en: 'Chimeric Antigen Receptor T-cell', desc: '환자 본인의 T세포를 추출해 암세포 인식 수용체(CAR)를 장착 후 다시 주입하는 세포치료제. 혈액암에서 놀라운 효능. 고형암은 아직 도전 중.' },
      { term: 'siRNA', en: 'Small Interfering RNA', desc: '특정 유전자의 RNA를 분해해 단백질 생성을 차단. 올릭스 asiRNA처럼 기존 약으로 표적화 어려운 유전자를 끌 수 있음.' },
      { term: 'GLP-1 수용체 작용제', en: 'GLP-1 Receptor Agonist', desc: '혈당 조절·식욕 억제 호르몬 GLP-1의 작용을 모방한 약. 오젬픽·위고비(세마글루타이드)가 대표. 비만·당뇨 치료의 패러다임 전환.' },
      { term: '방사성의약품 (테라노스틱스)', en: 'Radiopharmaceuticals / Theranostics', desc: '방사성 동위원소를 표적 리간드에 붙여 진단(스캔)과 치료를 동시에. 노바티스 플루비크토가 연 1조원+ 매출. 퓨처켐 FC303이 국내 도전자.' },
      { term: 'SC 제형 전환', en: 'Subcutaneous Formulation', desc: '정맥주사(IV)를 피하주사(SC)로 전환. 병원 방문 없이 자가 주사 가능 → 환자 편의성 극대화. 알테오젠 Hybrozyme 기술이 이 전환을 가능하게 함.' },
    ],
  },
  {
    category: '임상 지표',
    color: '#10b981',
    items: [
      { term: 'ORR', en: 'Objective Response Rate', desc: '전체 반응률. 종양이 일정 수준 이상 줄어든 환자의 비율. 50% ORR = 환자 절반에서 종양 감소 확인. 초기 임상의 핵심 지표.' },
      { term: 'OS', en: 'Overall Survival', desc: '전체 생존기간. 치료 시작 후 사망까지의 기간 중앙값. 항암제 허가의 궁극적 지표. OS 22개월 vs 10개월이면 게임체인저 수준.' },
      { term: 'PFS', en: 'Progression-Free Survival', desc: '무진행 생존기간. 치료 시작 후 암이 악화되거나 사망할 때까지의 기간. OS보다 빨리 데이터 확보 가능해 중간 지표로 활용.' },
      { term: 'DCR', en: 'Disease Control Rate', desc: '질병 통제율. ORR + 안정 병변(SD) 포함. 종양이 줄지는 않아도 커지지 않은 환자까지 포함한 지표.' },
      { term: 'DoR', en: 'Duration of Response', desc: '반응 지속기간. 종양이 줄어든 상태가 얼마나 오래 유지되는지. ORR 높아도 DoR 짧으면 효과가 일시적임을 의미.' },
      { term: 'mITT / ITT', en: 'Modified Intention-to-Treat', desc: '임상시험 분석 집단 기준. ITT = 무작위 배정된 모든 환자, mITT = 최소 1회 치료받은 환자. 결과 해석 시 어떤 기준인지 중요.' },
    ],
  },
  {
    category: '비즈니스 / 거래',
    color: '#f59e0b',
    items: [
      { term: '기술이전 (LO)', en: 'License Out', desc: '개발 중인 약물 또는 플랫폼 기술을 외부 기업에 라이선스하는 계약. 선급금(Upfront) + 마일스톤 + 로열티 구조. 한국 바이오 투자의 핵심 모멘텀.' },
      { term: '선급금', en: 'Upfront Payment', desc: '기술이전 계약 체결 즉시 수령하는 현금. 계약 성사의 직접적 증거. 규모가 클수록 기술력 인정 수준이 높음.' },
      { term: '마일스톤', en: 'Milestone Payment', desc: '임상 개시, 허가 신청, 허가 완료 등 단계별 성과 달성 시 수령하는 조건부 금액. 계약 총액의 대부분을 차지하지만 실제 수령은 단계적으로 이뤄짐.' },
      { term: '로열티', en: 'Royalty', desc: '허가 후 상업 판매 매출에 연동한 지속적 수익. 보통 순매출의 3~15%. 약이 팔릴수록 계속 들어오는 구조로 장기 현금흐름 확보의 핵심.' },
      { term: 'TAM', en: 'Total Addressable Market', desc: '전체 잠재 시장 규모. 해당 적응증 환자 수 × 연간 치료비. 시장 파이가 크다 = 점유율 1%만 잡아도 매출이 크다는 뜻.' },
      { term: '기술수출 총계약', en: 'Total Deal Value', desc: '선급금 + 마일스톤 + 로열티를 합산한 계약 최대 규모. 실제 수령액과 차이가 있으므로 세부 구조 확인 필요.' },
      { term: 'CMO / CDMO', en: 'Contract Manufacturing/Development', desc: '바이오의약품 위탁 생산(CMO) 또는 개발+생산(CDMO) 서비스. 삼성바이오로직스가 세계 1위 CMO. 고마진 반복 수익 구조.' },
    ],
  },
  {
    category: '딱지 (태그) 기준',
    color: '#ef4444',
    items: [
      { term: '게임체인저', en: 'Game Changer', desc: '기존 치료 패러다임을 바꿀 잠재력. ORR 2배↑, OS 2배↑, 또는 미충족 수요 환자의 유일한 치료제. 본 사이트 최고 등급 태그.' },
      { term: 'First-in-Class', en: 'First-in-Class', desc: '해당 기전(MoA)으로 세계 최초로 개발 중인 약물. 시장이 없으므로 검증 부담은 있으나 성공 시 특허 독점 10~20년.' },
      { term: 'Best-in-Class', en: 'Best-in-Class', desc: '이미 검증된 기전에서 기존 약보다 우월한 효능/안전성을 보이는 약물. 타그리소 대비 PFS 개선처럼 데이터로 우위 입증.' },
      { term: '빅파마 검증', en: 'Big Pharma Validated', desc: 'MSD·BMS·아스트라제네카·얀센 등 글로벌 톱 10 제약사가 기술이전·공동개발로 참여. "큰 형이 돈 냈다" = 데이터가 진짜라는 신호.' },
      { term: '미충족 수요', en: 'Unmet Medical Need', desc: '현재 표준치료가 없거나 불충분한 질환 영역. MSS 대장암, 재발 AML, 폰탄순환 등. 경쟁이 적어 허가 가능성 높고 가격 협상력 강함.' },
      { term: '플랫폼 확장', en: 'Platform Expansion', desc: '핵심 기술 플랫폼을 여러 적응증·약물에 반복 적용 가능. 알테오젠 Hybrozyme, 리가켐 ConjuALL처럼 파이프라인이 "자동 생성"되는 구조.' },
    ],
  },
  {
    category: '표적 / 기전',
    color: '#06b6d4',
    items: [
      { term: 'PD-1 / PD-L1', en: 'Programmed Death-1', desc: '면역세포(T세포)의 브레이크 역할. 암세포가 이 브레이크를 활용해 면역을 회피. 키트루다·옵디보가 이 브레이크를 해제하는 면역항암제.' },
      { term: 'EGFR', en: 'Epidermal Growth Factor Receptor', desc: '세포 증식을 촉진하는 수용체. 돌연변이 시 암세포 무한 증식. 비소세포폐암 30~40%에서 돌연변이 발생. 타그리소·렉라자 등 TKI가 표적.' },
      { term: 'HER2', en: 'Human Epidermal Growth Factor Receptor 2', desc: '유방암·위암에서 과발현되는 수용체. 허셉틴·엔허투 등 표적치료제 개발의 역사적 성공 사례. HER2+ = HER2 과발현 환자군.' },
      { term: 'TGF-β', en: 'Transforming Growth Factor Beta', desc: '종양 미세환경(TME)에서 면역항암제의 효능을 차단하는 단백질. 메드팩토 백토서팁이 이를 억제해 MSS 대장암에서 면역항암제 효능 복원을 목표.' },
      { term: 'FcRn', en: 'Neonatal Fc Receptor', desc: 'IgG 항체를 분해로부터 보호하는 수용체. 차단하면 병인성 IgG 항체(자가면역 원인)를 빠르게 제거. 한올바이오파마 바토클리맙, 아젠X 비블가르트가 이 기전.' },
      { term: 'BBB 셔틀', en: 'Blood-Brain Barrier Shuttle', desc: '뇌혈관장벽(BBB)을 통과시켜 약물을 뇌에 전달하는 기술. 파킨슨·알츠하이머 등 뇌질환 치료의 핵심 난제. ABL바이오 ABL301이 이 기전으로 사노피 파트너십.' },
    ],
  },
];

export default function GlossaryPage() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('전체');

  const allCategories = ['전체', ...GLOSSARY.map(g => g.category)];

  const filtered = GLOSSARY.map(group => ({
    ...group,
    items: group.items.filter(item =>
      (activeCategory === '전체' || activeCategory === group.category) &&
      (search === '' ||
        item.term.toLowerCase().includes(search.toLowerCase()) ||
        item.en.toLowerCase().includes(search.toLowerCase()) ||
        item.desc.toLowerCase().includes(search.toLowerCase()))
    ),
  })).filter(g => g.items.length > 0);

  const totalTerms = GLOSSARY.reduce((s, g) => s + g.items.length, 0);

  return (
    <div className="animate-fade-in">
      <Helmet>
        <title>바이오 사전 | K-Bio Pipeline Tracker</title>
        <meta name="description" content="K-바이오 투자에 꼭 필요한 임상·약물·비즈니스 용어 사전. ORR, PFS, ADC, 기술이전, 게임체인저 등 핵심 용어를 쉽게 설명합니다." />
      </Helmet>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: '0 0 6px', fontSize: 26, fontWeight: 800, color: '#f1f5f9' }}>
          📖 바이오 사전
        </h1>
        <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
          K-바이오 투자에 필요한 {totalTerms}개 핵심 용어 · 임상 지표 · 딱지 기준 설명
        </p>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="용어 검색 (예: ADC, ORR, 기술이전...)"
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{
          width: '100%', boxSizing: 'border-box',
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 8, padding: '10px 16px', color: '#e2e8f0', fontSize: 14,
          marginBottom: 16, outline: 'none',
        }}
      />

      {/* Category Pills */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28 }}>
        {allCategories.map(cat => {
          const group = GLOSSARY.find(g => g.category === cat);
          const color = group?.color || '#64748b';
          const active = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                background: active ? color + '22' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${active ? color + '66' : 'rgba(255,255,255,0.08)'}`,
                color: active ? color : '#94a3b8',
                borderRadius: 20, padding: '5px 14px', fontSize: 12,
                cursor: 'pointer', fontWeight: active ? 700 : 400,
              }}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Glossary Groups */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#475569', padding: 60, fontSize: 14 }}>
          검색 결과가 없습니다
        </div>
      ) : (
        filtered.map(group => (
          <section key={group.category} style={{ marginBottom: 36 }}>
            <h2 style={{
              fontSize: 13, fontWeight: 700, color: group.color,
              textTransform: 'uppercase', letterSpacing: 1.5,
              marginBottom: 12, paddingBottom: 8,
              borderBottom: `1px solid ${group.color}22`,
            }}>
              {group.category}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {group.items.map(item => (
                <div
                  key={item.term}
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: 8, padding: '14px 18px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>{item.term}</span>
                    <span style={{ fontSize: 11, color: '#475569', fontFamily: 'monospace' }}>{item.en}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 13, color: '#94a3b8', lineHeight: 1.75 }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
