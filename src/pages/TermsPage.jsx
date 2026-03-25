export default function TermsPage() {
  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '20px 0 60px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', marginBottom: 8 }}>이용약관</h1>
      <p style={{ fontSize: 12, color: '#64748b', marginBottom: 32 }}>최종 수정일: 2026년 3월 25일</p>

      {[
        {
          title: '1. 서비스 소개',
          body: `K-Bio Pipeline Tracker(이하 "서비스")는 국내 바이오텍 기업의 임상 파이프라인 정보를 정리·제공하는 정보 서비스입니다.

본 서비스를 이용함으로써 이 약관에 동의하는 것으로 간주합니다.`,
        },
        {
          title: '2. 면책조항 (투자 조언 아님)',
          body: `⚠️ 본 서비스는 투자 조언을 제공하지 않습니다.

• 본 서비스의 모든 정보는 공개된 학회 발표, 공시(DART), IR 자료, 임상시험 데이터베이스(ClinicalTrials.gov) 등을 기반으로 정리한 참고 자료입니다.
• 게임체인저·경쟁력 분석은 공개 데이터에 기반한 편집자의 의견이며, 임상 결과는 후속 연구에서 변동될 수 있습니다.
• 모든 투자 판단은 본인의 책임 하에 이루어져야 하며, 서비스 제공자는 투자 손실에 대한 책임을 지지 않습니다.
• 본 서비스의 정보는 금융투자업규정상 투자 자문 또는 투자 중개에 해당하지 않습니다.`,
        },
        {
          title: '3. 데이터 출처 및 정확성',
          body: `본 서비스에서 제공하는 임상 데이터는 다음 출처를 기반으로 합니다:
• 금융감독원 전자공시시스템 (DART)
• ClinicalTrials.gov (미국 국립의학도서관)
• 각 기업 IR 자료 및 학회 발표 자료
• 공개된 학술 논문 및 보도 자료

정보의 정확성을 위해 노력하나, 오류가 있을 수 있습니다. 중요한 의사결정 전 반드시 원본 출처를 확인하시기 바랍니다.`,
        },
        {
          title: '4. 지식재산권',
          body: `본 서비스의 독자적인 편집·분석 콘텐츠(게임체인저 분석, 경쟁약 비교 등)에 대한 저작권은 서비스 제공자에게 있습니다.

각 기업의 기업명, 약물명, 임상 데이터 등은 해당 기업의 자산이며, 본 서비스는 공개된 정보를 인용·정리하는 방식으로 제공합니다.`,
        },
        {
          title: '5. 서비스 변경 및 중단',
          body: `서비스 제공자는 사전 고지 없이 서비스의 일부 또는 전체를 변경, 중단할 수 있습니다. 서비스 중단으로 인한 손해에 대해 책임을 지지 않습니다.`,
        },
        {
          title: '6. 약관 변경',
          body: `본 약관은 서비스 개선, 법령 변경 등의 사유로 변경될 수 있습니다. 변경 시 서비스 내 공지 또는 GitHub를 통해 안내합니다.`,
        },
        {
          title: '7. 문의',
          body: `서비스 관련 문의는 GitHub Issues를 통해 접수해 주세요.
GitHub: https://github.com/kimjaeseung/kbio-pipeline-tracker`,
        },
      ].map(({ title, body }) => (
        <section key={title} style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', marginBottom: 10 }}>{title}</h2>
          <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.8, whiteSpace: 'pre-line', margin: 0 }}>{body}</p>
        </section>
      ))}
    </div>
  );
}
