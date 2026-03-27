/**
 * fetch-stock-data.js
 *
 * 42개 기업 1년치 주가 데이터를 pre-fetch해서 public/stock-data.json에 저장.
 * 빌드 전에 실행하거나, 주기적으로 수동 실행.
 *
 * 데이터 소스 우선순위:
 *   1. 금융위원회 공공데이터 API  ← GOVT_STOCK_API_KEY 환경변수가 있을 때
 *   2. Yahoo Finance (Node.js server-side, CORS 없음)  ← 키 없을 때 자동 폴백
 *
 * 사용법:
 *   npm run fetch-stocks
 *   GOVT_STOCK_API_KEY=xxx npm run fetch-stocks
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const companies = JSON.parse(readFileSync(join(ROOT, 'src/data/companies.json'), 'utf-8'));

const GOVT_API_KEY = process.env.GOVT_STOCK_API_KEY;
const GOVT_BASE = 'https://apis.data.go.kr/1160100/service/GetStockSecuritiesInfoService/getStockPriceInfo';

// ─── helpers ────────────────────────────────────────────────────────────────

function dateStr(d) {
  return d.toISOString().slice(0, 10).replace(/-/g, '');
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ─── 금융위원회 API ─────────────────────────────────────────────────────────

async function fetchGovt(company) {
  const today = new Date();
  const yearAgo = new Date(today);
  yearAgo.setFullYear(yearAgo.getFullYear() - 1);

  // 주의: srtnCd 필터는 이 API에서 동작하지 않음 → itmsNm(한국어 회사명) 사용
  const params = new URLSearchParams({
    numOfRows: '300',    // 1년 거래일 ~250일 + 여유
    pageNo: '1',
    resultType: 'json',
    itmsNm: company.name,
    beginBasDt: dateStr(yearAgo),
    endBasDt: dateStr(today),
  });

  const url = `${GOVT_BASE}?serviceKey=${GOVT_API_KEY}&${params}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const json = await res.json();
  let items = json?.response?.body?.items?.item;
  if (items && !Array.isArray(items)) items = [items];
  if (!items || items.length < 10) {
    throw new Error('insufficient data');
  }

  // 날짜 오름차순 정렬, 주봉으로 다운샘플 (매주 금요일 또는 마지막 거래일)
  const sorted = items
    .map(item => ({
      date: new Date(
        parseInt(item.basDt.slice(0, 4)),
        parseInt(item.basDt.slice(4, 6)) - 1,
        parseInt(item.basDt.slice(6, 8)),
      ).getTime(),
      price: parseFloat(item.clpr),
    }))
    .filter(d => d.price > 0)
    .sort((a, b) => a.date - b.date);

  // 주 단위 다운샘플: 각 ISO 주차의 마지막 거래일
  const weekMap = new Map();
  for (const point of sorted) {
    const d = new Date(point.date);
    const week = getISOWeek(d);
    weekMap.set(week, point); // 같은 주 내 나중 날짜로 덮어쓰기
  }

  return [...weekMap.values()].sort((a, b) => a.date - b.date);
}

function getISOWeek(d) {
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const weekNum = Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

// ─── Yahoo Finance (서버사이드 - CORS 없음) ──────────────────────────────────

function getYahooTicker(company) {
  if (company.market === 'KOSPI') return `${company.ticker}.KS`;
  if (company.market === 'KOSDAQ') return `${company.ticker}.KQ`;
  return company.ticker; // NASDAQ 등
}

async function fetchYahoo(company) {
  const ticker = getYahooTicker(company);
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?range=1y&interval=1wk`;

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; stock-fetcher/1.0)',
      Accept: 'application/json',
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const data = await res.json();
  const result = data?.chart?.result?.[0];
  if (!result) throw new Error('no chart result');

  const timestamps = result.timestamp || [];
  const closes = result.indicators?.quote?.[0]?.close || [];

  return timestamps
    .map((ts, i) => ({ date: ts * 1000, price: closes[i] }))
    .filter(d => d.price != null && !isNaN(d.price));
}

// ─── main ────────────────────────────────────────────────────────────────────

async function fetchCompany(company) {
  // NASDAQ 비상장 또는 ticker 없는 경우 skip
  if (!company.ticker || company.market?.includes('상장사 아님')) return null;

  // 금융위원회 API: 한국 주식만 지원, 키가 있으면 우선 시도
  const isKorean = company.market === 'KOSPI' || company.market === 'KOSDAQ';

  if (GOVT_API_KEY && isKorean) {
    try {
      const data = await fetchGovt(company);
      return data;
    } catch (e) {
      // 키 미활성화(401), 데이터 부족, 기타 오류 → Yahoo Finance 폴백
      return await fetchYahoo(company);
    }
  }
  return await fetchYahoo(company);
}

async function main() {
  const source = GOVT_API_KEY ? '금융위원회 API' : 'Yahoo Finance (server-side)';
  console.log(`\n📈 주가 데이터 수집 시작 — 소스: ${source}`);
  console.log(`   대상: ${companies.length}개 기업\n`);

  const result = {};
  let success = 0;
  let failed = 0;

  for (const company of companies) {
    try {
      const data = await fetchCompany(company);
      if (!data || data.length === 0) {
        console.log(`  ⏭  ${company.name.padEnd(12)} 스킵 (ticker 없음 또는 비상장)`);
        continue;
      }
      result[company.id] = data;
      console.log(`  ✅ ${company.name.padEnd(12)} ${data.length}개 데이터 포인트`);
      success++;
    } catch (e) {
      console.log(`  ❌ ${company.name.padEnd(12)} 실패: ${e.message}`);
      failed++;
    }

    await sleep(300); // API rate limit 배려
  }

  const output = {
    fetchedAt: new Date().toISOString(),
    source,
    data: result,
  };

  const outPath = join(ROOT, 'public/stock-data.json');
  writeFileSync(outPath, JSON.stringify(output));

  console.log(`\n✅ 완료 — 성공 ${success}개 / 실패 ${failed}개`);
  console.log(`   저장: public/stock-data.json (${(JSON.stringify(output).length / 1024).toFixed(0)} KB)\n`);
}

main().catch(e => {
  console.error('Fatal:', e);
  process.exit(1);
});
