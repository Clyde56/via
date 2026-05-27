/**
 * Admin Panel - Blog Management System
 * Handles authentication, CRUD operations, and local storage
 */
(function () {
  'use strict';

  // ===== Constants =====
  const STORAGE_KEYS = {
    PASSWORD: 'blog_admin_password',
    ARTICLES: 'blog_articles',
    DRAFTS: 'blog_drafts',
    AUTH: 'blog_admin_auth'
  };

  // ===== State =====
  let articles = [];
  let currentEditSlug = null;
  let deleteTargetSlug = null;

  // ===== DOM Elements =====
  const $loginPage = document.getElementById('login-page');
  const $adminPanel = document.getElementById('admin-panel');
  const $loginForm = document.getElementById('login-form');
  const $passwordInput = document.getElementById('password');
  const $logoutBtn = document.getElementById('logout-btn');
  const $newArticleBtn = document.getElementById('new-article-btn');
  const $articleCount = document.getElementById('article-count');
  const $articlesTbody = document.getElementById('articles-tbody');
  const $emptyState = document.getElementById('empty-state');
  const $articlesTable = document.getElementById('articles-table-container');
  const $editorModal = document.getElementById('editor-modal');
  const $editorTitle = document.getElementById('editor-title');
  const $closeEditor = document.getElementById('close-editor');
  const $articleForm = document.getElementById('article-form');
  const $editSlug = document.getElementById('edit-slug');
  const $articleTitle = document.getElementById('article-title');
  const $articleDate = document.getElementById('article-date');
  const $articleDescription = document.getElementById('article-description');
  const $articleTags = document.getElementById('article-tags');
  const $articleAuthor = document.getElementById('article-author');
  const $articleContent = document.getElementById('article-content');
  const $previewContent = document.getElementById('preview-content');
  const $saveDraft = document.getElementById('save-draft');
  const $deleteModal = document.getElementById('delete-modal');
  const $deleteArticleTitle = document.getElementById('delete-article-title');
  const $closeDelete = document.getElementById('close-delete');
  const $cancelDelete = document.getElementById('cancel-delete');
  const $confirmDelete = document.getElementById('confirm-delete');
  const $toast = document.getElementById('toast');

  // ===== Utility Functions =====
  function showToast(message, type = 'info') {
    $toast.textContent = message;
    $toast.className = `toast toast-${type}`;
    $toast.style.display = 'block';
    setTimeout(() => {
      $toast.style.display = 'none';
    }, 3000);
  }

  function slugify(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50);
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // ===== Storage Functions =====
  function loadArticles() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ARTICLES);
      if (stored) {
        articles = JSON.parse(stored);
      } else {
        // Load from index.json if no local storage
        fetch('/articles/index.json')
          .then(res => res.json())
          .then(data => {
            articles = data;
            saveArticles();
            renderArticles();
          })
          .catch(() => {
            articles = [];
          });
      }
    } catch (e) {
      console.error('Failed to load articles:', e);
      articles = [];
    }
  }

  function saveArticles() {
    localStorage.setItem(STORAGE_KEYS.ARTICLES, JSON.stringify(articles));
  }

  function loadDraft(slug) {
    try {
      const drafts = JSON.parse(localStorage.getItem(STORAGE_KEYS.DRAFTS) || '{}');
      return drafts[slug] || null;
    } catch {
      return null;
    }
  }

  function saveDraft(slug, data) {
    try {
      const drafts = JSON.parse(localStorage.getItem(STORAGE_KEYS.DRAFTS) || '{}');
      drafts[slug] = data;
      localStorage.setItem(STORAGE_KEYS.DRAFTS, JSON.stringify(drafts));
    } catch (e) {
      console.error('Failed to save draft:', e);
    }
  }

  // ===== Authentication =====
  function checkAuth() {
    const isAuth = sessionStorage.getItem(STORAGE_KEYS.AUTH);
    if (isAuth === 'true') {
      showAdminPanel();
    } else {
      showLoginPage();
    }
  }

  function showLoginPage() {
    $loginPage.style.display = 'flex';
    $adminPanel.style.display = 'none';
  }

  function showAdminPanel() {
    $loginPage.style.display = 'none';
    $adminPanel.style.display = 'block';
    loadArticles();
    renderArticles();
  }

  function handleLogin(e) {
    e.preventDefault();
    const password = $passwordInput.value;
    
    if (!password) {
      showToast('请输入密码', 'error');
      return;
    }

    const storedPassword = localStorage.getItem(STORAGE_KEYS.PASSWORD);
    
    if (!storedPassword) {
      // First time - set password
      localStorage.setItem(STORAGE_KEYS.PASSWORD, password);
      sessionStorage.setItem(STORAGE_KEYS.AUTH, 'true');
      showToast('密码已设置，登录成功！', 'success');
      showAdminPanel();
    } else if (password === storedPassword) {
      sessionStorage.setItem(STORAGE_KEYS.AUTH, 'true');
      showToast('登录成功！', 'success');
      showAdminPanel();
    } else {
      showToast('密码错误', 'error');
    }
    
    $passwordInput.value = '';
  }

  function handleLogout() {
    sessionStorage.removeItem(STORAGE_KEYS.AUTH);
    showToast('已退出登录', 'info');
    showLoginPage();
  }

  // ===== Render Functions =====
  function renderArticles() {
    $articleCount.textContent = articles.length;
    
    if (articles.length === 0) {
      $articlesTable.style.display = 'none';
      $emptyState.style.display = 'block';
      return;
    }

    $articlesTable.style.display = 'block';
    $emptyState.style.display = 'none';

    // Sort by date descending
    const sorted = [...articles].sort((a, b) => new Date(b.date) - new Date(a.date));

    $articlesTbody.innerHTML = sorted.map(article => `
      <tr>
        <td class="article-title-cell">
          <a href="/#/article/${article.slug}" class="article-title-link" target="_blank">
            ${escapeHtml(article.title)}
          </a>
          ${article.description ? `<div class="article-desc">${escapeHtml(article.description)}</div>` : ''}
        </td>
        <td class="article-date">${formatDate(article.date)}</td>
        <td>
          <div class="article-tags">
            ${(article.tags || []).map(tag => `<span class="article-tag">${escapeHtml(tag)}</span>`).join('')}
          </div>
        </td>
        <td>
          <span class="article-status status-${article.status || 'published'}">
            ${article.status === 'draft' ? '草稿' : '已发布'}
          </span>
        </td>
        <td class="article-actions">
          <button class="btn btn-sm btn-outline" onclick="admin.editArticle('${article.slug}')">编辑</button>
          <button class="btn btn-sm btn-outline" onclick="admin.duplicateArticle('${article.slug}')">复制</button>
          <button class="btn btn-sm btn-danger" onclick="admin.confirmDelete('${article.slug}', '${escapeHtml(article.title)}')">删除</button>
        </td>
      </tr>
    `).join('');
  }

  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ===== Editor Functions =====
  function openEditor(slug = null) {
    currentEditSlug = slug;
    
    if (slug) {
      $editorTitle.textContent = '编辑文章';
      const article = articles.find(a => a.slug === slug);
      if (article) {
        $editSlug.value = slug;
        $articleTitle.value = article.title;
        $articleDate.value = article.date;
        $articleDescription.value = article.description || '';
        $articleTags.value = (article.tags || []).join(', ');
        $articleAuthor.value = article.author || '';
        
        // Load content from localStorage or generate placeholder
        const storedContent = localStorage.getItem(`article_content_${slug}`);
        $articleContent.value = storedContent || `# ${article.title}\n\n在此编写文章内容...`;
      }
    } else {
      $editorTitle.textContent = '写新文章';
      $editSlug.value = '';
      $articleTitle.value = '';
      $articleDate.value = new Date().toISOString().split('T')[0];
      $articleDescription.value = '';
      $articleTags.value = '';
      $articleAuthor.value = '';
      $articleContent.value = '';
    }
    
    $editorModal.style.display = 'flex';
    switchTab('write');
  }

  function closeEditorModal() {
    $editorModal.style.display = 'none';
    currentEditSlug = null;
  }

  function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    
    if (tab === 'write') {
      $articleContent.style.display = 'block';
      $previewContent.style.display = 'none';
    } else {
      $articleContent.style.display = 'none';
      $previewContent.style.display = 'block';
      $previewContent.innerHTML = marked.parse($articleContent.value, { breaks: true, gfm: true });
      // Highlight code blocks
      $previewContent.querySelectorAll('pre code').forEach(block => {
        hljs.highlightElement(block);
      });
    }
  }

  function insertCodeBlock() {
    const textarea = $articleContent;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);
    
    const codeBlock = `\n\`\`\`javascript\n${selected || '// 在此输入代码'}\n\`\`\`\n`;
    textarea.value = text.substring(0, start) + codeBlock + text.substring(end);
    textarea.focus();
    textarea.selectionStart = start + 4;
    textarea.selectionEnd = start + codeBlock.length - 4;
  }

  function insertImage() {
    const url = prompt('请输入图片URL:');
    if (url) {
      const textarea = $articleContent;
      const start = textarea.selectionStart;
      const text = textarea.value;
      const imageMarkdown = `![图片描述](${url})`;
      textarea.value = text.substring(0, start) + imageMarkdown + text.substring(start);
      textarea.focus();
    }
  }

  // ===== CRUD Operations =====
  function handleSubmit(e) {
    e.preventDefault();
    
    const title = $articleTitle.value.trim();
    const date = $articleDate.value;
    const description = $articleDescription.value.trim();
    const tags = $articleTags.value.split(',').map(t => t.trim()).filter(Boolean);
    const author = $articleAuthor.value.trim();
    const content = $articleContent.value;
    
    if (!title || !date) {
      showToast('请填写标题和日期', 'error');
      return;
    }

    const slug = currentEditSlug || slugify(title);
    
    // Check for duplicate slug
    if (!currentEditSlug && articles.some(a => a.slug === slug)) {
      showToast('已存在相同标题的文章，请修改标题', 'error');
      return;
    }

    const articleData = {
      slug,
      title,
      date,
      description,
      tags,
      author: author || undefined,
      status: 'published'
    };

    if (currentEditSlug) {
      // Update existing
      const index = articles.findIndex(a => a.slug === currentEditSlug);
      if (index !== -1) {
        articles[index] = articleData;
      }
    } else {
      // Add new
      articles.push(articleData);
    }

    // Save content to localStorage
    localStorage.setItem(`article_content_${slug}`, content);
    
    // Save to articles index
    saveArticles();
    
    // Generate and save the markdown file content
    const markdownContent = `---
title: "${title}"
date: ${date}
tags: ${JSON.stringify(tags)}
description: "${description}"
${author ? `author: "${author}"` : ''}
---

${content}`;

    // Save the full markdown to localStorage for export
    localStorage.setItem(`article_md_${slug}`, markdownContent);

    renderArticles();
    closeEditorModal();
    showToast(currentEditSlug ? '文章已更新' : '文章已发布', 'success');
  }

  function editArticle(slug) {
    openEditor(slug);
  }

  function duplicateArticle(slug) {
    const article = articles.find(a => a.slug === slug);
    if (!article) return;

    const newSlug = slug + '-copy';
    const newArticle = {
      ...article,
      slug: newSlug,
      title: article.title + ' (副本)',
      status: 'draft'
    };

    articles.push(newArticle);
    
    // Copy content
    const content = localStorage.getItem(`article_content_${slug}`);
    if (content) {
      localStorage.setItem(`article_content_${newSlug}`, content);
    }

    saveArticles();
    renderArticles();
    showToast('文章已复制', 'success');
  }

  function confirmDelete(slug, title) {
    deleteTargetSlug = slug;
    $deleteArticleTitle.textContent = title;
    $deleteModal.style.display = 'flex';
  }

  function closeDeleteModal() {
    $deleteModal.style.display = 'none';
    deleteTargetSlug = null;
  }

  function deleteArticle() {
    if (!deleteTargetSlug) return;

    articles = articles.filter(a => a.slug !== deleteTargetSlug);
    localStorage.removeItem(`article_content_${deleteTargetSlug}`);
    localStorage.removeItem(`article_md_${deleteTargetSlug}`);

    // Remove from drafts
    try {
      const drafts = JSON.parse(localStorage.getItem(STORAGE_KEYS.DRAFTS) || '{}');
      delete drafts[deleteTargetSlug];
      localStorage.setItem(STORAGE_KEYS.DRAFTS, JSON.stringify(drafts));
    } catch {}

    saveArticles();
    renderArticles();
    closeDeleteModal();
    showToast('文章已删除', 'success');
  }

  function saveDraftAction() {
    const slug = currentEditSlug || slugify($articleTitle.value) || 'draft_' + Date.now();
    const draftData = {
      title: $articleTitle.value,
      date: $articleDate.value,
      description: $articleDescription.value,
      tags: $articleTags.value,
      author: $articleAuthor.value,
      content: $articleContent.value
    };
    
    saveDraft(slug, draftData);
    showToast('草稿已保存', 'info');
  }

  // ===== Export Functions =====
  function exportArticles() {
    // Export articles index
    const indexJson = JSON.stringify(articles, null, 2);
    downloadFile('articles/index.json', indexJson, 'application/json');

    // Export each article's markdown
    articles.forEach(article => {
      const md = localStorage.getItem(`article_md_${article.slug}`);
      if (md) {
        downloadFile(`articles/${article.slug}.md`, md, 'text/markdown');
      }
    });

    showToast('文章已导出，请将文件放入项目目录', 'success');
  }

  function downloadFile(filename, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ===== Event Listeners =====
  function init() {
    checkAuth();

    $loginForm.addEventListener('submit', handleLogin);
    $logoutBtn.addEventListener('click', handleLogout);
    $newArticleBtn.addEventListener('click', () => openEditor());
    $closeEditor.addEventListener('click', closeEditorModal);
    $articleForm.addEventListener('submit', handleSubmit);
    $saveDraft.addEventListener('click', saveDraftAction);

    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Editor actions
    document.getElementById('insert-code').addEventListener('click', insertCodeBlock);
    document.getElementById('insert-image').addEventListener('click', insertImage);

    // Delete modal
    $closeDelete.addEventListener('click', closeDeleteModal);
    $cancelDelete.addEventListener('click', closeDeleteModal);
    $confirmDelete.addEventListener('click', deleteArticle);

    // Close modals on outside click
    $editorModal.addEventListener('click', (e) => {
      if (e.target === $editorModal) closeEditorModal();
    });
    $deleteModal.addEventListener('click', (e) => {
      if (e.target === $deleteModal) closeDeleteModal();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeEditorModal();
        closeDeleteModal();
      }
      if (e.ctrlKey && e.key === 's') {
        if ($editorModal.style.display === 'flex') {
          e.preventDefault();
          saveDraftAction();
        }
      }
    });

    // Theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
      });
    }
  }

  // ===== Public API =====
  window.admin = {
    editArticle,
    duplicateArticle,
    confirmDelete,
    exportArticles
  };

  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
