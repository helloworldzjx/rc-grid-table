const fs = require('fs');
const path = require('path');

const siteUrl = 'https://helloworldzjx.github.io/rc-grid-table';

function escapeXml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function normalizeRoutePath(routePath) {
  const normalized = routePath.startsWith('/') ? routePath : `/${routePath}`;

  if (normalized === '/' || normalized === '/rc-grid-table') {
    return '/';
  }

  return normalized.endsWith('/') ? normalized.slice(0, -1) : normalized;
}

function shouldIndexRoute(route) {
  const routePath = normalizeRoutePath(route.path || '');

  return (
    routePath &&
    !route.isLayout &&
    routePath !== '/404' &&
    !routePath.includes(':') &&
    !routePath.includes('*') &&
    !routePath.startsWith('/~demos')
  );
}

module.exports = (api) => {
  api.onBuildComplete(({ err }) => {
    if (err) {
      return;
    }

    const urls = Array.from(
      new Set(
        Object.values(api.appData.routes)
          .filter(shouldIndexRoute)
          .map((route) => `${siteUrl}${normalizeRoutePath(route.path)}`),
      ),
    ).sort();

    const sitemap = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...urls.map((url) => `  <url><loc>${escapeXml(url)}</loc></url>`),
      '</urlset>',
      '',
    ].join('\n');

    fs.writeFileSync(
      path.join(api.paths.absOutputPath, 'sitemap.xml'),
      sitemap,
      'utf-8',
    );

    fs.writeFileSync(
      path.join(api.paths.absOutputPath, 'robots.txt'),
      [
        'User-agent: *',
        'Allow: /rc-grid-table/',
        `Sitemap: ${siteUrl}/sitemap.xml`,
        '',
      ].join('\n'),
      'utf-8',
    );
  });
};
