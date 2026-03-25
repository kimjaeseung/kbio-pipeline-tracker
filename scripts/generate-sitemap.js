import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fs = { readFileSync, writeFileSync };
const path = { join };

const companies = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../src/data/companies.json'), 'utf-8')
);

const BASE_URL = 'https://bioinsight-nine.vercel.app';

function drugToSlug(drug) {
  return drug
    .toLowerCase()
    .replace(/[()]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9가-힣\-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

const urls = [
  { loc: '/', priority: '1.0', changefreq: 'daily' },
  { loc: '/calendar', priority: '0.8', changefreq: 'weekly' },
];

companies.forEach(company => {
  urls.push({
    loc: `/company/${company.id}`,
    priority: '0.8',
    changefreq: 'weekly',
  });

  company.pipelines.forEach(pipeline => {
    urls.push({
      loc: `/pipeline/${drugToSlug(pipeline.drug)}`,
      priority: '0.6',
      changefreq: 'weekly',
    });
  });
});

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    u => `  <url>
    <loc>${BASE_URL}${u.loc}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

fs.writeFileSync(path.join(__dirname, '../public/sitemap.xml'), sitemap);
console.log(`✅ Sitemap generated: ${urls.length} URLs → public/sitemap.xml`);
