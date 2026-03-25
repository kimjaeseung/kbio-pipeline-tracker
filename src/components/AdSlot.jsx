/**
 * 에드센스 광고 슬롯 컴포넌트
 * 승인 전: 투명 플레이스홀더
 * 승인 후: isAdSenseApproved = true로 변경 + data-ad-client/slot 교체
 */

const isAdSenseApproved = false;

const SIZES = {
  horizontal: { width: '100%', maxWidth: 728, height: 90, margin: '20px auto' },
  'in-feed': { width: '100%', minHeight: 80, margin: '16px 0' },
  rectangle: { width: 300, height: 250, margin: '20px auto' },
};

export default function AdSlot({ format = 'horizontal' }) {
  const sizeStyle = SIZES[format] || SIZES.horizontal;

  if (isAdSenseApproved) {
    return (
      <div style={{ ...sizeStyle, display: 'block' }}>
        <ins
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
          data-ad-slot="XXXXXXXXXX"
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    );
  }

  // 미승인 상태: 빈 공간 (눈에 띄지 않게)
  return <div style={{ ...sizeStyle, minHeight: 16 }} />;
}
