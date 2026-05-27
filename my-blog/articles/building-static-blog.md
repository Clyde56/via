---
title: "Building a Static Blog with Pure HTML/CSS/JS"
date: 2026-05-26
tags: ["tech", "tutorial"]
description: "How I built this blog using only vanilla HTML, CSS, and JavaScript, deployed on Cloudflare Pages."
---

# Building a Static Blog with Pure HTML/CSS/JS

In this article, I'll walk through how this blog was built — a fully functional static blog with zero framework dependencies.

## Why No Framework?

Modern frontend frameworks like React, Vue, and Next.js are powerful, but they're not always necessary. For a personal blog:

- **Simplicity**: Vanilla JS is easier to maintain long-term
- **Performance**: No bundle overhead, no virtual DOM
- **Longevity**: HTML/CSS/JS will work forever
- **Learning**: Understanding the fundamentals makes you a better developer

## Architecture Overview

```
my-blog/
├── index.html              # App shell with SEO meta tags
├── _redirects              # Cloudflare SPA routing
├── _headers                # Security & cache headers
├── rss.xml                 # RSS feed
├── sitemap.xml             # SEO sitemap
├── assets/
│   ├── css/style.css       # Complete stylesheet (light/dark)
│   └── js/
│       ├── app.js          # SPA router, rendering, SEO
│       └── theme.js        # Theme toggle manager
├── articles/
│   ├── index.json          # Article metadata index
│   └── *.md                # Article content (Markdown)
└── README.md
```

### Key Technical Decisions

**1. Client-Side Routing using History API**

Instead of hash-based routing (`#/article/slug`), we use the History API for clean URLs:

```javascript
function navigate(url) {
  history.pushState(null, '', url);
  resolve();
}
```

The `_redirects` file ensures all paths fall back to `index.html`:

```
/* /index.html 200
```

**2. Markdown Rendering with marked.js**

Articles are stored as plain `.md` files and fetched via `fetch()`. We use the [marked](https://marked.js.org/) library for parsing:

```javascript
const response = await fetch('/articles/my-article.md');
const markdown = await response.text();
const html = marked.parse(markdown);
```

**3. YAML Frontmatter Parsing**

Each article includes metadata (title, date, tags) in YAML frontmatter. We parse it with a simple regex-based parser.

**4. Theme System with CSS Custom Properties**

Light and dark themes are handled entirely with CSS variables:

```css
:root {
  --bg: #ffffff;
  --text: #1e293b;
}

[data-theme="dark"] {
  --bg: #0f172a;
  --text: #e2e8f0;
}
```

**5. SEO with JSON-LD Structured Data**

The site includes JSON-LD structured data for Person, Website, BreadcrumbList, and Article schemas, enabling rich search results.

## Performance

Since there's no framework overhead:
- **First paint**: Instantly (HTML is served directly)
- **Time to Interactive**: ~200ms (CDN scripts loaded async)
- **Bundle Size**: Zero framework bytes

## Deployment

Deploying to Cloudflare Pages is as simple as:

1. Connect your GitHub repository
2. Set build output to the root directory
3. Done!

Cloudflare Pages automatically deploys and honors the `_redirects` file for SPA routing.

## Conclusion

Building a blog without frameworks taught me more about the web platform than any framework tutorial ever did. The result is fast, maintainable, and will work for decades to come.
