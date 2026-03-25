export default function PrivacyPage() {
  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '20px 0 60px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', marginBottom: 8 }}>개인정보처리방침</h1>
      <p style={{ fontSize: 12, color: '#64748b', marginBottom: 32 }}>최종 수정일: 2026년 3월 25일</p>

      {[
        {
          title: '1. 수집하는 개인정보',
          body: `본 서비스(K-Bio Pipeline Tracker, 이하 "서비스")는 별도의 회원가입 없이 이용할 수 있으며, 개인정보를 직접 수집하지 않습니다.

다만 서비스 이용 과정에서 아래 정보가 자동으로 생성·수집될 수 있습니다:
• 브라우저 종류, OS, 화면 해상도 등 기기 정보
• 서비스 이용 시간, 접속 URL, 페이지 방문 기록
• 쿠키 및 로컬스토리지 데이터 (관심 기업 목록 등 사용자 설정)`,
        },
        {
          title: '2. 쿠키 사용',
          body: `서비스는 사용자 경험 개선을 위해 쿠키 및 유사 기술을 사용합니다.

• 기능 쿠키: 관심 기업 목록(로컬스토리지 kbio-watchlist-v1) — 이 데이터는 서버로 전송되지 않으며 사용자의 브라우저에만 저장됩니다.
• 분석 쿠키: 서비스 이용 통계 분석을 위해 Google Analytics를 사용할 수 있습니다.
• 광고 쿠키: 향후 Google AdSense를 통한 광고 게재 시 Google의 개인화 광고 쿠키가 사용될 수 있습니다.

브라우저 설정을 통해 쿠키를 거부할 수 있으나, 일부 기능이 제한될 수 있습니다.`,
        },
        {
          title: '3. Google AdSense',
          body: `서비스는 Google AdSense를 통해 광고를 게재할 수 있습니다. Google은 사용자의 관심사에 맞는 광고를 표시하기 위해 쿠키를 사용합니다.

Google의 개인정보처리방침: https://policies.google.com/privacy
Google 광고 설정 관리: https://adssettings.google.com

사용자는 Google 광고 설정에서 개인화 광고를 비활성화할 수 있습니다.`,
        },
        {
          title: '4. 제3자 링크',
          body: `서비스는 DART(금융감독원 전자공시), ClinicalTrials.gov, 학술지 등 제3자 웹사이트로의 링크를 포함할 수 있습니다. 이러한 외부 사이트의 개인정보처리방침은 해당 사이트의 정책을 따릅니다.`,
        },
        {
          title: '5. 데이터 보관',
          body: `서비스 내 사용자 데이터(관심 기업 목록 등)는 사용자의 브라우저 로컬스토리지에만 저장되며, 서버에 전송·보관되지 않습니다. 브라우저 데이터 삭제 시 자동으로 제거됩니다.`,
        },
        {
          title: '6. 개인정보 문의',
          body: `개인정보 관련 문의사항이 있으시면 GitHub Issues를 통해 연락해 주세요.
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
