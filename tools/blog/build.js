const fs = require('fs'), path = require('path');
// Builds /blog/ pages from the article bodies in tools/blog/articles/.
// Run from the repo root:  node tools/blog/build.js
const site = path.resolve(__dirname, '..', '..'), S = path.join(__dirname, 'articles');
const home = fs.readFileSync(path.join(site, 'index.html'), 'utf8').replace(/\r\n/g, '\n');
const gtm = home.match(/<!-- Google Tag Manager \(delayed[\s\S]*?<!-- End Google Tag Manager -->/)[0];
const gtmNoscript = home.match(/<!-- Google Tag Manager \(noscript\) -->[\s\S]*?<!-- End Google Tag Manager \(noscript\) -->/)[0];
const footer = home.match(/<footer>[\s\S]*?<\/footer>/)[0]
  .replace('<p style="margin-top:6px">Follow the journey</p>',
    '<p style="margin-top:6px">Follow the journey</p>\n    <p class="footlinks"><a href="/">Home</a> · <a href="/blog/">Blog</a> · <a href="/#get-the-program">Get the program</a></p>')
  .replace('<span id="yr">2026</span>', '2026');
const icon = home.match(/<link rel="icon"[^>]*>/)[0];
const BASE = 'https://bouncemethod.net';

const css = `
  @font-face{font-family:Anton;src:url(/fonts/anton.woff2) format("woff2");font-weight:400;font-style:normal;font-display:swap}
  @font-face{font-family:Inter;src:url(/fonts/inter.woff2) format("woff2");font-weight:400 800;font-style:normal;font-display:optional}
  @font-face{font-family:"Anton Fallback";src:local("Arial Bold"),local("Arial-BoldMT"),local("Liberation Sans Bold"),local("Roboto Bold"),local("Roboto-Bold");size-adjust:69.92%;ascent-override:168.24%;descent-override:47.07%;line-gap-override:0%}
  @font-face{font-family:"Inter Fallback";src:local("Arial"),local("ArialMT"),local("Liberation Sans"),local("Roboto"),local("Roboto-Regular");size-adjust:106.76%;ascent-override:90.74%;descent-override:22.59%;line-gap-override:0%}
  :root{--bg:#0b0b0c;--panel:#151517;--panel-2:#1c1c1f;--line:#2a2a2e;--text:#f4f4f5;--muted:#a1a1aa;--orange:#ff4d1a;--pink:#ff4fa3;--btn:#d93a0b;--btn-hover:#bf3209;--radius:14px}
  *{box-sizing:border-box;margin:0;padding:0}
  html{scroll-behavior:smooth}
  body{background:var(--bg);color:var(--text);font-family:Inter,"Inter Fallback",system-ui,-apple-system,Segoe UI,Roboto,sans-serif;line-height:1.6;-webkit-font-smoothing:antialiased}
  a{color:inherit}
  [hidden]{display:none!important}
  .wrap{width:min(1100px,100% - 32px);margin-inline:auto}
  .narrow{width:min(720px,100% - 32px);margin-inline:auto}
  .display{font-family:Anton,"Anton Fallback",Impact,sans-serif;text-transform:uppercase;font-weight:400;letter-spacing:.01em;line-height:1}
  .eyebrow{font-weight:800;font-size:.78rem;letter-spacing:.2em;text-transform:uppercase;color:var(--orange)}
  .bar{position:sticky;top:0;z-index:20;background:rgba(11,11,12,.92);border-bottom:1px solid var(--line)}
  .bar .wrap{display:flex;align-items:center;justify-content:space-between;gap:12px;height:60px}
  .logo{white-space:nowrap;font-family:Anton,"Anton Fallback",Impact,sans-serif;font-size:1.5rem;text-transform:uppercase;text-decoration:none;letter-spacing:.02em}
  .logo span{color:var(--orange)}
  .bar nav{display:flex;align-items:center;gap:18px}
  .navlink{font-weight:700;font-size:.85rem;letter-spacing:.06em;text-transform:uppercase;text-decoration:none;color:var(--muted)}
  .navlink:hover,.navlink[aria-current]{color:var(--text)}
  @media(max-width:420px){.navlink{display:none}}
  .btn{display:inline-flex;align-items:center;justify-content:center;gap:.5rem;min-height:48px;padding:0 1.5rem;border:0;border-radius:10px;background:var(--btn);color:#fff;font:800 .95rem Inter,"Inter Fallback",sans-serif;letter-spacing:.06em;text-transform:uppercase;text-decoration:none;cursor:pointer;transition:transform .15s,background .15s}
  .btn:hover{background:var(--btn-hover);transform:translateY(-2px)}
  .btn.small{min-height:40px;padding:0 1.1rem;font-size:.8rem;white-space:nowrap}
  a:focus-visible,.btn:focus-visible{outline:3px solid var(--pink);outline-offset:2px}
  .page-head{padding:48px 0 28px;background:radial-gradient(700px 360px at 85% 0%,rgba(255,77,26,.22),transparent 60%)}
  .crumbs{font-size:.8rem;color:var(--muted);margin-bottom:18px}
  .crumbs a{color:var(--muted)}
  .page-head h1{font-size:clamp(2.4rem,8vw,4rem);margin:10px 0 14px}
  .meta{color:var(--muted);font-size:.88rem}
  article{padding:8px 0 40px}
  article p,article li{color:#d4d4d8;font-size:1.06rem}
  article p{margin:0 0 18px}
  article .lede{font-size:1.2rem;color:var(--text)}
  article h2{font-family:Anton,"Anton Fallback",Impact,sans-serif;text-transform:uppercase;font-weight:400;font-size:clamp(1.8rem,5vw,2.4rem);line-height:1.05;margin:44px 0 14px;scroll-margin-top:80px}
  article h3{font-size:1.2rem;font-weight:800;margin:28px 0 10px;color:var(--text)}
  article ul,article ol{margin:0 0 20px 1.3rem;display:grid;gap:8px}
  article strong{color:var(--text)}
  article a{color:var(--orange);text-underline-offset:3px}
  .toc{background:var(--panel);border:1px solid var(--line);border-radius:var(--radius);padding:18px 22px;margin:26px 0 8px}
  .toc-title{font-weight:800;font-size:.78rem;letter-spacing:.2em;text-transform:uppercase;color:var(--orange);margin-bottom:8px!important}
  .toc ol{margin-bottom:0;gap:4px}
  .toc a{color:var(--text);text-decoration:none}
  .toc a:hover{color:var(--orange)}
  .callout{border:1px solid var(--orange);background:rgba(255,77,26,.08);border-radius:var(--radius);padding:18px 22px;margin:28px 0}
  .callout p{margin:0;color:var(--text)}
  .table-wrap{overflow-x:auto;margin:0 0 20px;border:1px solid var(--line);border-radius:var(--radius)}
  table{width:100%;border-collapse:collapse;font-size:.95rem}
  @media(max-width:520px){table{font-size:.86rem}th,td{padding:10px 10px}td:first-child{font-size:1rem}}
  th,td{text-align:left;padding:12px 14px;border-bottom:1px solid var(--line);vertical-align:top}
  th{background:var(--panel-2);font-size:.75rem;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}
  td:first-child{font-family:Anton,"Anton Fallback",Impact,sans-serif;font-size:1.1rem;color:var(--orange);text-transform:uppercase}
  tr:last-child td{border-bottom:0}
  .safety{font-size:.88rem!important;color:var(--muted)!important;border-top:1px solid var(--line);padding-top:18px;margin-top:36px!important}
  .cta{background:var(--panel);border:1px solid var(--line);border-radius:18px;padding:28px 24px;margin:8px 0 56px;text-align:center;background-image:radial-gradient(500px 240px at 50% 0%,rgba(255,77,26,.2),transparent 70%)}
  .cta h2{font-size:clamp(1.8rem,6vw,2.6rem);margin:8px 0 10px}
  .cta p{color:var(--muted);max-width:44ch;margin:0 auto 20px}
  .posts{list-style:none;display:grid;gap:16px;padding:8px 0 56px}
  .post{background:var(--panel);border:1px solid var(--line);border-radius:var(--radius);padding:24px 22px;position:relative;transition:border-color .15s}
  .post:hover{border-color:var(--orange)}
  .post h2{font-size:clamp(1.6rem,5vw,2.1rem);margin:8px 0 10px}
  .post h2 a{text-decoration:none}
  .post h2 a::after{content:"";position:absolute;inset:0}
  .post p{color:var(--muted)}
  footer{border-top:1px solid var(--line);padding:42px 0 54px;text-align:center}
  .socials{display:flex;justify-content:center;flex-wrap:wrap;gap:12px;margin:18px 0 26px}
  .socials a{display:inline-flex;align-items:center;gap:10px;min-height:48px;padding:0 18px;border:1px solid var(--line);border-radius:999px;background:var(--panel);text-decoration:none;font-weight:700}
  .socials a:hover{border-color:var(--orange)}
  .socials svg{width:20px;height:20px;fill:currentColor}
  footer p{color:var(--muted);font-size:.8rem;max-width:70ch;margin:8px auto 0}
  .footlinks a{color:var(--text)}
  .video{margin:6px auto 30px;max-width:340px}
  .yt{position:relative;display:block;width:100%;aspect-ratio:9/16;padding:0;border:0;border-radius:var(--radius);overflow:hidden;background:#000;cursor:pointer}
  .yt img,.yt iframe{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border:0}
  .yt .play{position:absolute;left:50%;top:50%;width:72px;height:72px;margin:-36px 0 0 -36px;border-radius:50%;background:var(--btn);display:grid;place-items:center;box-shadow:0 8px 30px rgba(0,0,0,.5);transition:transform .15s}
  .yt:hover .play{transform:scale(1.08)}
  .yt .play svg{width:34px;height:34px;fill:#fff;margin-left:4px}
  .yt:focus-visible{outline:3px solid var(--pink);outline-offset:3px}
  .video figcaption{margin-top:12px;font-size:.92rem;color:var(--muted);text-align:center;line-height:1.5}
  .video figcaption strong{color:var(--text)}
  @media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}.btn{transition:none}}`;

function page({ title, desc, url, ogType, jsonld, current, body }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
${gtm}
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="description" content="${desc}">
<link rel="canonical" href="${url}">
<meta name="theme-color" content="#0b0b0c">
<meta property="og:site_name" content="Bounce Method">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:type" content="${ogType}">
<meta property="og:url" content="${url}">
<meta name="twitter:card" content="summary">
${icon}
<link rel="preload" href="/fonts/anton.woff2" as="font" type="font/woff2" crossorigin>
<script type="application/ld+json">${JSON.stringify(jsonld)}</script>
<style>${css}
</style>
</head>
<body>
${gtmNoscript}

<header class="bar">
  <div class="wrap">
    <a class="logo" href="/">Bounce <span>Method</span></a>
    <nav aria-label="Main">
      <a class="navlink" href="/blog/"${current === 'blog' ? ' aria-current="page"' : ''}>Blog</a>
      <a class="btn small" href="/#get-the-program">Get the program</a>
    </nav>
  </div>
</header>

<main>
${body}
</main>

${footer}
${body.includes('class="yt"') ? "<script>\n// YouTube videos load only when tapped, so the page stays fast.\ndocument.querySelectorAll('.yt').forEach(function (b) {\n  b.addEventListener('click', function () {\n    var f = document.createElement('iframe');\n    f.src = 'https://www.youtube-nocookie.com/embed/' + b.dataset.id + '?autoplay=1&playsinline=1&rel=0';\n    f.title = b.getAttribute('aria-label').replace('Play video: ', '');\n    f.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen';\n    f.allowFullscreen = true;\n    var box = document.createElement('div');\n    box.className = 'yt';\n    box.appendChild(f);\n    b.replaceWith(box);\n  }, { once: true });\n});\n</script>\n" : ''}</body>
</html>
`;
}

const cta = `    <aside class="cta" aria-labelledby="cta-title">
      <p class="eyebrow">Bounce Method</p>
      <h2 class="display" id="cta-title">Want the full plan?</h2>
      <p>Bounce Method is a complete vertical jump program for athletes. Sign up to be the first to know when it launches.</p>
      <a class="btn" href="/#get-the-program">Get the program</a>
    </aside>`;

// To add an article: add an entry here and a matching <slug>.html body file in tools/blog/articles/.
const posts = [{
  slug: 'how-to-jump-higher-for-basketball',
  title: 'How to Jump Higher for Basketball: The Complete Guide',
  h1: 'How to jump higher for basketball',
  desc: 'The 5 things that decide your vertical, a simple weekly plan, how long it takes, and the mistakes that keep hoopers stuck. A complete guide for athletes.',
  card: 'The 5 things that decide your vertical, a simple week you can follow, how long it takes, and the 6 mistakes that keep most hoopers stuck.',
  eyebrow: 'Vertical jump training',
  bodyFile: 'how-to-jump-higher-for-basketball.html',
  date: '2026-11-22', dateText: 'November 22, 2026', read: '10 min read',
}];

for (const p of posts) {
  const url = `${BASE}/blog/${p.slug}/`;
  const body = fs.readFileSync(path.join(S, p.bodyFile), 'utf8').replace(/\r\n/g, '\n');
  const html = page({
    title: `${p.title} | Bounce Method`, desc: p.desc, url, ogType: 'article', current: 'blog',
    jsonld: {
      '@context': 'https://schema.org', '@graph': [
        {
          '@type': 'BlogPosting', headline: p.title, description: p.desc,
          datePublished: p.date, dateModified: p.date, mainEntityOfPage: url, url,
          author: { '@type': 'Organization', name: 'Bounce Method', url: BASE + '/' },
          publisher: { '@type': 'Organization', name: 'Bounce Method', url: BASE + '/' },
          image: BASE + '/images/bounce-method-player.webp', inLanguage: 'en',
        },
        {
          '@type': 'BreadcrumbList', itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: BASE + '/' },
            { '@type': 'ListItem', position: 2, name: 'Blog', item: BASE + '/blog/' },
            { '@type': 'ListItem', position: 3, name: p.h1, item: url },
          ],
        },
      ],
    },
    body: `  <header class="page-head">
    <div class="narrow">
      <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> / <a href="/blog/">Blog</a></nav>
      <p class="eyebrow">${p.eyebrow}</p>
      <h1 class="display">${p.h1}</h1>
      <p class="meta">By Bounce Method · ${p.read}</p>
    </div>
  </header>
  <div class="narrow">
    <article>
${body}
    </article>
${cta}
  </div>`,
  });
  fs.mkdirSync(path.join(site, 'blog', p.slug), { recursive: true });
  fs.writeFileSync(path.join(site, 'blog', p.slug, 'index.html'), html);
}

const list = posts.map(q => `      <li class="post">
        <p class="meta">${q.read}</p>
        <h2 class="display"><a href="/blog/${q.slug}/">${q.h1}</a></h2>
        <p>${q.card}</p>
      </li>`).join('\n');

const idx = page({
  title: 'Blog: Vertical Jump Training Tips for Basketball | Bounce Method',
  desc: 'Vertical jump training tips for basketball players: strength, power, elasticity, speed and jump technique, from the Bounce Method program.',
  url: BASE + '/blog/', ogType: 'website', current: 'blog',
  jsonld: { '@context': 'https://schema.org', '@type': 'Blog', name: 'Bounce Method Blog', url: BASE + '/blog/', publisher: { '@type': 'Organization', name: 'Bounce Method', url: BASE + '/' } },
  body: `  <header class="page-head">
    <div class="narrow">
      <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> / Blog</nav>
      <p class="eyebrow">The Bounce Method blog</p>
      <h1 class="display">Jump higher. Play higher.</h1>
      <p class="meta">Training tips for hoopers who want more bounce: strength, power, elasticity, speed and jump technique.</p>
    </div>
  </header>
  <div class="narrow">
    <ul class="posts">
${list}
    </ul>
${cta}
  </div>`,
});
fs.writeFileSync(path.join(site, 'blog', 'index.html'), idx);
console.log('built', posts.length, 'article(s) + blog index');
