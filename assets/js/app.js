/**
 * Blog Application - SPA Router, Renderer & SEO Manager
 *
 * Handles:
 * - History API routing (clean URLs, no hash)
 * - Article loading and Markdown rendering
 * - Tag filtering and tag cloud
 * - SEO meta tags and JSON-LD structured data
 * - Previous/Next article navigation
 */
(function () {
  'use strict';

  // ========================================================================
  // 1. Configuration
  // ========================================================================

  const CONFIG = {
    title: 'My Blog',
    description: 'A personal blog built with pure static technology, deployed on Cloudflare Pages.',
    url: 'https://my-blog.pages.dev',
    author: 'Author',
    locale: 'zh-CN',
    articlesIndex: '/articles/index.json',
    articlesDir: '/articles/',
  };

  // ========================================================================
  // 2. State
  // ========================================================================

  const state = {
    articles: [],       // Full article index from JSON
    tags: {},            // { tagName: [slug, ...], ... }
    isLoading: false,
  };

  // ========================================================================
  // 3. DOM References
  // ========================================================================

  const $app = document.getElementById('app');
  const dom = {};

  function cacheDom() {
    dom.title = document.querySelector('title');
    dom.metaDesc = document.querySelector('meta[name="description"]');
    dom.metaKeywords = document.querySelector('meta[name="keywords"]');
    dom.ogTitle = document.querySelector('meta[property="og:title"]');
    dom.ogDesc = document.querySelector('meta[property="og:description"]');
    dom.ogUrl = document.querySelector('meta[property="og:url"]');
    dom.ogType = document.querySelector('meta[property="og:type"]');
    dom.canonical = document.querySelector('link[rel="canonical"]');
    dom.ldBreadcrumb = document.getElementById('ld-breadcrumb');
    dom.ldArticle = document.getElementById('ld-article');
  }

  // ========================================================================
  // 4. Utilities
  // ========================================================================

  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr || '';
    return d.toLocaleDateString('zh-CN', {
      year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC'
    });
  }

  function toRFC822(dateStr) {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? '' : d.toUTCString();
  }

  function slugify(text) {
    if (typeof text !== 'string') return '';
    return text.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\u4e00-\u9fff-]/g, '')
      .replace(/--+/g, '-')
      .replace(/^-|-$/g, '');
  }

  // ========================================================================
  // 5. Frontmatter Parser
  // ========================================================================

  function parseFrontmatter(md) {
    const match = md.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!match) return { data: {}, content: md };

    const data = {};
    const lines = match[1].split('\n');
    for (const line of lines) {
      const colonIdx = line.indexOf(':');
      if (colonIdx === -1) continue;
      const key = line.slice(0, colonIdx).trim();
      let value = line.slice(colonIdx + 1).trim();
      // Remove surrounding quotes
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      // Try parsing as JSON array
      if (value.startsWith('[') && value.endsWith(']')) {
        try { value = JSON.parse(value); } catch (e) { /* keep as string */ }
      }
      data[key] = value;
    }
    return { data, content: match[2] };
  }

  // ========================================================================
  // 6. Data Loading
  // ========================================================================

  async function loadArticles() {
    try {
      // 优先从localStorage读取（管理后台保存的数据）
      const storedArticles = localStorage.getItem('blog_articles');
      if (storedArticles) {
        const articles = JSON.parse(storedArticles);
        state.articles = articles.sort((a, b) => new Date(b.date) - new Date(a.date));
      } else {
        // 如果localStorage没有，从index.json读取
        const res = await fetch(CONFIG.articlesIndex);
        if (!res.ok) throw new Error('Failed to load articles');
        const articles = await res.json();
        state.articles = articles.sort((a, b) => new Date(b.date) - new Date(a.date));
      }

      // Build tag index: { tagName: [slug, ...], ... }
      state.tags = {};
      for (const article of state.articles) {
        if (!Array.isArray(article.tags)) continue;
        for (const tag of article.tags) {
          if (!state.tags[tag]) state.tags[tag] = [];
          state.tags[tag].push(article.slug);
        }
      }
    } catch (e) {
      console.error('Failed to load articles:', e);
      state.articles = [];
      state.tags = {};
    }
  }

  async function fetchArticleMd(slug) {
    // 优先从localStorage读取文章内容（管理后台保存的）
    const storedContent = localStorage.getItem(`article_md_${slug}`);
    if (storedContent) {
      return storedContent;
    }
    // 如果localStorage没有，从服务器读取.md文件
    const res = await fetch(CONFIG.articlesDir + slug + '.md');
    if (!res.ok) throw new Error('Article not found: ' + slug);
    return res.text();
  }

  // ========================================================================
  // 7. SEO Manager - Meta Tags & JSON-LD
  // ========================================================================

  const SEO = {
    /**
     * Update all SEO meta tags and structured data for a given page.
     * @param {string} type - 'home' | 'article' | 'tag' | 'tags' | '404'
     * @param {object} data - Type-specific data
     */
    update(type, data) {
      let pageTitle = CONFIG.title;
      let description = CONFIG.description;
      let canonicalUrl = CONFIG.url;
      let ogType = 'website';
      let keywords = '';

      switch (type) {
        case 'article': {
          const d = data || {};
          pageTitle = d.title ? d.title + ' - ' + CONFIG.title : CONFIG.title;
          description = d.description || d.excerpt || CONFIG.description;
          canonicalUrl = CONFIG.url + '/article/' + (d.slug || '');
          ogType = 'article';
          keywords = Array.isArray(d.tags) ? d.tags.join(', ') : '';
          this.updateArticleLD(d);
          this.updateBreadcrumb([
            { name: 'Home', path: '/' },
            { name: d.title || 'Article', path: '/article/' + (d.slug || '') }
          ]);
          break;
        }
        case 'tag': {
          const tag = (data && data.tag) || '';
          pageTitle = '标签: ' + tag + ' - ' + CONFIG.title;
          description = '查看所有关于 "' + tag + '" 的文章';
          canonicalUrl = CONFIG.url + '/tag/' + encodeURIComponent(tag);
          keywords = tag;
          this.removeArticleLD();
          this.updateBreadcrumb([
            { name: 'Home', path: '/' },
            { name: 'Tags', path: '/tags' },
            { name: tag, path: '/tag/' + encodeURIComponent(tag) }
          ]);
          break;
        }
        case 'tags': {
          pageTitle = '标签 - ' + CONFIG.title;
          description = '浏览所有文章标签';
          canonicalUrl = CONFIG.url + '/tags';
          this.removeArticleLD();
          this.updateBreadcrumb([
            { name: 'Home', path: '/' },
            { name: 'Tags', path: '/tags' }
          ]);
          break;
        }
        default: {
          // Home / 404
          this.removeArticleLD();
          this.updateBreadcrumb([{ name: 'Home', path: '/' }]);
          keywords = state.articles.flatMap(a => a.tags || []).join(', ');
        }
      }

      document.title = pageTitle;
      this.setMeta('description', description);
      this.setMeta('keywords', keywords || CONFIG.title + ', blog');
      this.setMeta('og:title', pageTitle);
      this.setMeta('og:description', description);
      this.setMeta('og:url', canonicalUrl);
      this.setMeta('og:type', ogType);
      this.setMeta('twitter:title', pageTitle);
      this.setMeta('twitter:description', description);
      if (dom.canonical) dom.canonical.setAttribute('href', canonicalUrl);

      // Update theme-color based on current theme
      const theme = document.documentElement.getAttribute('data-theme');
      this.setMeta('theme-color', theme === 'dark' ? '#0f172a' : '#ffffff');
    },

    setMeta(name, content) {
      const selector = name.startsWith('og:') || name.startsWith('twitter:')
        ? 'meta[property="' + name + '"]'
        : 'meta[name="' + name + '"]';
      let el = document.querySelector(selector);
      if (!el) {
        el = document.createElement('meta');
        if (name.startsWith('og:') || name.startsWith('twitter:')) {
          el.setAttribute('property', name);
        } else {
          el.setAttribute('name', name);
        }
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    },

    // --- JSON-LD: Article ---
    updateArticleLD(article) {
      this.removeArticleLD();
      const script = document.createElement('script');
      script.id = 'ld-article';
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: article.title || '',
        description: article.description || article.excerpt || '',
        datePublished: article.date || '',
        dateModified: article.date || '',
        author: { '@type': 'Person', name: CONFIG.author },
        publisher: {
          '@type': 'Organization',
          name: CONFIG.title,
          logo: { '@type': 'ImageObject', url: CONFIG.url + '/favicon.ico' }
        },
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': CONFIG.url + '/article/' + (article.slug || '')
        }
      });
      document.head.appendChild(script);
    },

    removeArticleLD() {
      const existing = document.getElementById('ld-article');
      if (existing) existing.remove();
    },

    // --- JSON-LD: BreadcrumbList ---
    updateBreadcrumb(items) {
      const script = dom.ldBreadcrumb;
      if (!script) return;
      const list = items.map((item, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: item.name,
        item: CONFIG.url + item.path
      }));
      script.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: list
      });
    },

    // --- RSS auto-discovery link ---
    ensureRSSLink() {
      if (!document.querySelector('link[type="application/rss+xml"]')) {
        const link = document.createElement('link');
        link.rel = 'alternate';
        link.type = 'application/rss+xml';
        link.title = CONFIG.title + ' RSS';
        link.href = '/rss.xml';
        document.head.appendChild(link);
      }
    }
  };

  // ========================================================================
  // 8. Router (History API)
  // ========================================================================

  const Router = {
    init() {
      // Intercept all clicks on [data-route] links
      document.addEventListener('click', (e) => {
        const link = e.target.closest('[data-route]');
        if (!link) return;
        // Let external links / downloads open normally
        if (link.target === '_blank' || link.hasAttribute('download')) return;
        e.preventDefault();
        const href = link.getAttribute('href');
        if (href && !href.startsWith('http') && !href.startsWith('//')) {
          this.navigate(href);
        }
      });

      // Handle browser back/forward
      window.addEventListener('popstate', () => this.resolve());

      // Resolve initial route
      this.resolve();
    },

    navigate(url) {
      history.pushState(null, '', url);
      this.resolve();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      this.closeMobileMenu();
    },

    resolve() {
      const path = window.location.pathname;

      // Route patterns
      if (path === '/' || path === '') {
        renderHome();
      } else if (/^\/article\/([^/]+)\/?$/.test(path)) {
        const slug = path.match(/^\/article\/([^/]+)\/?$/)[1];
        renderArticle(decodeURIComponent(slug));
      } else if (path === '/tags' || path === '/tags/') {
        renderTagsPage();
      } else if (/^\/tag\/([^/]+)\/?$/.test(path)) {
        const tag = decodeURIComponent(path.match(/^\/tag\/([^/]+)\/?$/)[1]);
        renderTagView(tag);
      } else {
        renderNotFound();
      }
    },

    closeMobileMenu() {
      const nav = document.querySelector('.header-nav');
      const btn = document.querySelector('.menu-toggle');
      if (nav) nav.classList.remove('open');
      if (btn) {
        btn.classList.remove('active');
        btn.setAttribute('aria-expanded', 'false');
      }
    }
  };

  // ========================================================================
  // 9. Mobile Menu
  // ========================================================================

  function initMobileMenu() {
    const btn = document.querySelector('.menu-toggle');
    const nav = document.querySelector('.header-nav');
    if (!btn || !nav) return;

    btn.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('open');
      btn.classList.toggle('active');
      btn.setAttribute('aria-expanded', String(isOpen));
    });
  }

  // ========================================================================
  // 10. Renderers
  // ========================================================================

  function showLoading() {
    $app.innerHTML = `
      <div class="loading">
        <div class="spinner"></div>
        <span>加载中...</span>
      </div>`;
  }

  // --- Home Page ---
  function renderHome() {
    SEO.update('home');
    if (state.articles.length === 0) {
      $app.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📝</div>
          <h2 class="empty-state-title">暂无文章</h2>
          <p class="empty-state-desc">博客还没有文章，敬请期待！</p>
        </div>`;
      return;
    }
    renderArticleList(state.articles);
  }

  function renderArticleList(articles, activeTag) {
    const tagKeys = Object.keys(state.tags).sort();
    const tagCloudHtml = tagKeys.length > 0 ? `
      <div class="tag-cloud">
        <div class="tag-cloud-title">🏷️ 标签</div>
        ${tagKeys.map(t => {
          const count = state.tags[t].length;
          const active = activeTag === t ? ' tag-filter-active' : '';
          return `<a class="tag${active}" href="/tag/${encodeURIComponent(t)}" data-route>
            ${t} <span class="tag-count">(${count})</span>
          </a>`;
        }).join('')}
        ${activeTag ? `<a class="tag" href="/" data-route>显示全部</a>` : ''}
      </div>` : '';

    const pageTitle = activeTag
      ? `标签: ${escapeHtml(activeTag)}`
      : '最新文章';
    const pageSubtitle = activeTag
      ? `共 ${articles.length} 篇关于 "${escapeHtml(activeTag)}" 的文章`
      : `共 ${state.articles.length} 篇文章`;

    const listHtml = articles.length > 0
      ? `<div class="article-grid">
          ${articles.map(a => renderCard(a)).join('')}
         </div>`
      : `<div class="empty-state">
          <div class="empty-state-icon">📭</div>
          <h2 class="empty-state-title">没有匹配的文章</h2>
          <p class="empty-state-desc">换个标签试试？</p>
         </div>`;

    $app.innerHTML = `
      <div class="container-narrow">
        <div class="page-header">
          <h1 class="page-title">${pageTitle}</h1>
          <p class="page-subtitle">${pageSubtitle}</p>
        </div>
        ${tagCloudHtml}
        ${listHtml}
      </div>`;
  }

  function renderCard(article) {
    const tagsHtml = (article.tags || []).map(t =>
      `<a class="tag" href="/tag/${encodeURIComponent(t)}" data-route
          onclick="event.stopPropagation()">${escapeHtml(t)}</a>`
    ).join('');

    return `
      <a class="article-card" href="/article/${article.slug}" data-route>
        <h2 class="article-card-title">${escapeHtml(article.title)}</h2>
        <p class="article-card-desc">${escapeHtml(article.description || article.excerpt || '')}</p>
        <div class="article-card-meta">
          <span class="article-card-date">📅 ${formatDate(article.date)}</span>
          ${article.readingTime ? `<span class="article-card-reading">📖 ${article.readingTime} min</span>` : ''}
          <div class="article-card-tags">${tagsHtml}</div>
        </div>
      </a>`;
  }

  // --- Article Detail ---
  async function renderArticle(slug) {
    showLoading();
    SEO.update('article', { slug, title: '加载中...' });

    try {
      const md = await fetchArticleMd(slug);
      const { data, content } = parseFrontmatter(md);
      data.slug = slug;

      // Update SEO with real data
      SEO.update('article', data);

      const html = marked.parse(content, { breaks: true, gfm: true });

      // Find prev/next in sorted list
      const idx = state.articles.findIndex(a => a.slug === slug);
      const prev = idx > 0 ? state.articles[idx - 1] : null;
      const next = idx < state.articles.length - 1 ? state.articles[idx + 1] : null;

      const tagsHtml = (data.tags || []).map(t =>
        `<a class="tag" href="/tag/${encodeURIComponent(t)}" data-route>${escapeHtml(t)}</a>`
      ).join(' ');

      $app.innerHTML = `
        <article class="container-narrow">
          <div class="article-header">
            <a class="article-back" href="/" data-route>← 返回文章列表</a>
            <h1 class="article-title">${escapeHtml(data.title)}</h1>
            <div class="article-meta">
              <span class="article-meta-item">📅 ${formatDate(data.date)}</span>
              <span class="article-meta-item">✍️ ${escapeHtml(data.author || CONFIG.author)}</span>
              ${data.readingTime ? `<span class="article-meta-item">📖 ${data.readingTime} min read</span>` : ''}
              ${tagsHtml ? `<span class="article-meta-item">🏷️ ${tagsHtml}</span>` : ''}
            </div>
          </div>
          <div class="article-body">${html}</div>
          <nav class="article-nav">
            ${prev ? `
              <a class="article-nav-link" href="/article/${prev.slug}" data-route>
                <span class="article-nav-label">← 上一篇</span>
                <span class="article-nav-title">${escapeHtml(prev.title)}</span>
              </a>` : '<div></div>'}
            ${next ? `
              <a class="article-nav-link article-nav-link-right" href="/article/${next.slug}" data-route>
                <span class="article-nav-label">下一篇 →</span>
                <span class="article-nav-title">${escapeHtml(next.title)}</span>
              </a>` : ''}
          </nav>
        </article>`;

      // Highlight code blocks
      document.querySelectorAll('.article-body pre code').forEach((block) => {
        hljs.highlightElement(block);
      });

    } catch (e) {
      console.error('Failed to load article:', e);
      SEO.update('404');
      $app.innerHTML = `
        <div class="error-page">
          <div class="error-code">:(</div>
          <h2 class="error-title">文章未找到</h2>
          <p class="error-desc">请检查链接是否正确，或返回首页浏览其他文章。</p>
          <a class="btn" href="/" data-route>返回首页</a>
        </div>`;
    }
  }

  // --- Tags Page ---
  function renderTagsPage() {
    SEO.update('tags');
    const tagEntries = Object.keys(state.tags).sort();

    if (tagEntries.length === 0) {
      $app.innerHTML = `
        <div class="container-narrow">
          <div class="page-header">
            <h1 class="page-title">🏷️ 标签</h1>
            <p class="page-subtitle">还没有文章标签</p>
          </div>
        </div>`;
      return;
    }

    $app.innerHTML = `
      <div class="container-narrow">
        <div class="page-header">
          <h1 class="page-title">🏷️ 标签</h1>
          <p class="page-subtitle">共 ${tagEntries.length} 个标签</p>
        </div>
        <div class="tags-page">
          ${tagEntries.map(t => {
            const count = state.tags[t].length;
            return `<a class="tag tag-lg" href="/tag/${encodeURIComponent(t)}" data-route>
              ${escapeHtml(t)} <span class="tag-count">(${count})</span>
            </a>`;
          }).join('')}
        </div>
      </div>`;
  }

  // --- Tag Filter View ---
  function renderTagView(tag) {
    const filtered = state.articles.filter(a =>
      Array.isArray(a.tags) && a.tags.some(t => slugify(t) === slugify(tag))
    );
    SEO.update('tag', { tag });
    renderArticleList(filtered, tag);
  }

  // --- 404 ---
  function renderNotFound() {
    SEO.update('404');
    $app.innerHTML = `
      <div class="error-page">
        <div class="error-code">404</div>
        <h2 class="error-title">页面未找到</h2>
        <p class="error-desc">你访问的页面不存在或已被移除。</p>
        <a class="btn" href="/" data-route>返回首页</a>
      </div>`;
  }

  // ========================================================================
  // 11. Article Count Badge
  // ========================================================================

  function updateArticleCount() {
    const countEl = document.getElementById('article-count');
    if (countEl) {
      countEl.textContent = '(' + state.articles.length + ')';
      countEl.style.display = '';
    }
  }

  // ========================================================================
  // 12. Highlight.js Theme Sync
  // ========================================================================

  function initHljsThemeSync() {
    const hljsTheme = document.getElementById('hljs-theme');
    if (!hljsTheme) return;
    const observer = new MutationObserver(() => {
      const theme = document.documentElement.getAttribute('data-theme');
      hljsTheme.href = theme === 'dark'
        ? 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css'
        : 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css';
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  }

  // ========================================================================
  // 13. Init
  // ========================================================================

  async function init() {
    cacheDom();
    SEO.ensureRSSLink();
    initHljsThemeSync();
    initMobileMenu();

    // Load articles then render
    showLoading();
    await loadArticles();
    updateArticleCount();
    Router.init();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
