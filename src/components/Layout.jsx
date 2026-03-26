import { Link, useNavigate, useLocation } from 'react-router-dom';
import companies from '../data/companies.json';
import { getWatchlist } from '../utils/watchlist';

const totalPipelines = companies.reduce((s, c) => s + c.pipelines.length, 0);

export default function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const watchlistCount = getWatchlist().length;

  const navStyle = (path) => ({
    color: location.pathname === path ? '#f1f5f9' : '#94a3b8',
    textDecoration: 'none',
    fontSize: 13,
    padding: '6px 12px',
    borderRadius: 6,
    background: location.pathname === path ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.04)',
    border: `1px solid ${location.pathname === path ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.08)'}`,
    fontWeight: location.pathname === path ? 600 : 400,
  });

  return (
    <div style={{ background: '#0a0e1a', minHeight: '100vh', color: '#e2e8f0', fontFamily: "'Pretendard Variable', 'Pretendard', 'Apple SD Gothic Neo', -apple-system, sans-serif" }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '16px 24px', background: 'rgba(255,255,255,0.02)', position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(12px)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, letterSpacing: -0.5 }}>
              <span style={{ color: '#3b82f6' }}>K-Bio</span>
              <span style={{ color: '#f1f5f9' }}> Pipeline</span>
              <span style={{ color: '#64748b', fontWeight: 400, fontSize: 13, marginLeft: 8 }}>Tracker</span>
            </h1>
            <p style={{ margin: '2px 0 0', fontSize: 11, color: '#64748b' }}>
              국내 바이오텍 임상 파이프라인 대시보드 · {companies.length}개 기업 · {totalPipelines}개 파이프라인
            </p>
          </div>
          <nav style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Link to="/" style={navStyle('/')}>
              기업 목록
            </Link>
            <Link to="/calendar" style={navStyle('/calendar')}>
              📅 촉매 캘린더
            </Link>
            <Link to="/glossary" style={navStyle('/glossary')}>
              📖 바이오 사전
            </Link>
            <Link to="/" onClick={(e) => { e.preventDefault(); navigate('/?tab=watchlist'); }} style={{
              color: watchlistCount > 0 ? '#f59e0b' : '#94a3b8',
              textDecoration: 'none',
              fontSize: 13,
              padding: '6px 12px',
              borderRadius: 6,
              background: watchlistCount > 0 ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${watchlistCount > 0 ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.08)'}`,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}>
              ★ {watchlistCount > 0 && <span style={{ fontSize: 11, background: '#f59e0b22', color: '#f59e0b', padding: '0px 5px', borderRadius: 10 }}>{watchlistCount}</span>}
            </Link>
          </nav>
        </div>
      </div>

      {/* Body */}
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 24px 80px' }}>
        {children}
      </main>

      {/* Footer */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '20px 24px', background: 'rgba(255,255,255,0.01)', marginTop: 40 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <p style={{ fontSize: 11, color: '#64748b', lineHeight: 1.7, margin: '0 0 10px' }}>
            ⚠️ 본 서비스는 공개된 학회 발표, 공시, IR 자료를 기반으로 정리한 정보이며, 투자 조언이 아닙니다.
            게임체인저·경쟁력 분석은 공개 데이터 기반의 참고 의견이며, 임상 결과는 후속 연구에서 변동될 수 있습니다.
            투자 판단은 본인의 책임 하에 이루어져야 합니다.
          </p>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <Link to="/privacy" style={{ fontSize: 11, color: '#475569', textDecoration: 'none' }}>개인정보처리방침</Link>
            <Link to="/terms" style={{ fontSize: 11, color: '#475569', textDecoration: 'none' }}>이용약관</Link>
            <a href="https://github.com/kimjaeseung/kbio-pipeline-tracker" target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: '#475569', textDecoration: 'none' }}>GitHub</a>
          </div>
        </div>
      </div>
    </div>
  );
}
