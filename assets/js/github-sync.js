/**
 * GitHub API Integration Module
 * Handles syncing blog articles to GitHub repository
 */
const GitHubSync = (function () {
  'use strict';

  // ===== Storage Keys =====
  const STORAGE_KEYS = {
    CONFIG: 'github_sync_config',
    SYNC_STATUS: 'github_sync_status'
  };

  // ===== State =====
  let config = {
    token: '',
    owner: '',
    repo: '',
    branch: 'main',
    articlesPath: 'articles',
    enabled: false
  };

  let syncQueue = [];
  let isSyncing = false;

  // ===== Initialization =====
  function init() {
    loadConfig();
  }

  function loadConfig() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CONFIG);
      if (stored) {
        config = { ...config, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.error('Failed to load GitHub config:', e);
    }
  }

  function saveConfig(newConfig) {
    config = { ...config, ...newConfig };
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
    return config;
  }

  function getConfig() {
    return { ...config };
  }

  function isEnabled() {
    return config.enabled && config.token && config.owner && config.repo;
  }

  // ===== GitHub API Helpers =====
  async function githubFetch(endpoint, options = {}) {
    const url = `https://api.github.com${endpoint}`;
    const headers = {
      'Accept': 'application/vnd.github.v3+json',
      'Authorization': `token ${config.token}`,
      'Content-Type': 'application/json',
      ...options.headers
    };

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `GitHub API error: ${response.status}`);
    }

    return response.json();
  }

  // ===== Get File SHA (needed for updates) =====
  async function getFileSha(path) {
    try {
      const data = await githubFetch(
        `/repos/${config.owner}/${config.repo}/contents/${path}?ref=${config.branch}`
      );
      return data.sha;
    } catch (e) {
      // File doesn't exist
      return null;
    }
  }

  // ===== Create or Update File =====
  async function upsertFile(path, content, message) {
    const sha = await getFileSha(path);
    const body = {
      message,
      content: btoa(unescape(encodeURIComponent(content))),
      branch: config.branch
    };

    if (sha) {
      body.sha = sha;
    }

    return githubFetch(
      `/repos/${config.owner}/${config.repo}/contents/${path}`,
      {
        method: 'PUT',
        body: JSON.stringify(body)
      }
    );
  }

  // ===== Delete File =====
  async function deleteFile(path, message) {
    const sha = await getFileSha(path);
    if (!sha) {
      console.log('File not found, skipping delete:', path);
      return null;
    }

    return githubFetch(
      `/repos/${config.owner}/${config.repo}/contents/${path}`,
      {
        method: 'DELETE',
        body: JSON.stringify({
          message,
          sha,
          branch: config.branch
        })
      }
    );
  }

  // ===== Sync Article to GitHub =====
  async function syncArticle(article, content) {
    if (!isEnabled()) {
      console.log('GitHub sync not enabled');
      return { success: false, reason: 'not_enabled' };
    }

    try {
      // Generate markdown content with frontmatter
      const markdown = generateMarkdown(article, content);
      
      // Upload article file
      const articlePath = `${config.articlesPath}/${article.slug}.md`;
      await upsertFile(
        articlePath,
        markdown,
        `📝 ${article.slug === article.title ? 'Update' : 'Add'} article: ${article.title}`
      );

      // Update index.json
      await updateArticlesIndex();

      return { success: true };
    } catch (e) {
      console.error('Failed to sync article to GitHub:', e);
      return { success: false, error: e.message };
    }
  }

  // ===== Delete Article from GitHub =====
  async function deleteArticleFromGithub(slug) {
    if (!isEnabled()) {
      return { success: false, reason: 'not_enabled' };
    }

    try {
      const articlePath = `${config.articlesPath}/${slug}.md`;
      await deleteFile(
        articlePath,
        `🗑️ Delete article: ${slug}`
      );

      // Update index.json
      await updateArticlesIndex();

      return { success: true };
    } catch (e) {
      console.error('Failed to delete article from GitHub:', e);
      return { success: false, error: e.message };
    }
  }

  // ===== Update articles/index.json =====
  async function updateArticlesIndex() {
    // Get current articles from localStorage
    const articles = JSON.parse(localStorage.getItem('blog_articles') || '[]');
    
    // Create index content (without content, just metadata)
    const indexContent = articles.map(a => ({
      slug: a.slug,
      title: a.title,
      date: a.date,
      tags: a.tags || [],
      description: a.description || ''
    }));

    await upsertFile(
      `${config.articlesPath}/index.json`,
      JSON.stringify(indexContent, null, 2),
      '📋 Update articles index'
    );
  }

  // ===== Generate Markdown with Frontmatter =====
  function generateMarkdown(article, content) {
    const frontmatter = [
      '---',
      `title: "${escapeYaml(article.title)}"`,
      `date: ${article.date}`,
      `tags: ${JSON.stringify(article.tags || [])}`,
      `description: "${escapeYaml(article.description || '')}"`,
      article.author ? `author: "${escapeYaml(article.author)}"` : null,
      '---',
      ''
    ].filter(Boolean).join('\n');

    return frontmatter + content;
  }

  function escapeYaml(str) {
    return str.replace(/"/g, '\\"').replace(/\n/g, '\\n');
  }

  // ===== Batch Sync All Articles =====
  async function syncAllArticles() {
    if (!isEnabled()) {
      return { success: false, reason: 'not_enabled' };
    }

    const results = {
      success: 0,
      failed: 0,
      errors: []
    };

    const articles = JSON.parse(localStorage.getItem('blog_articles') || '[]');
    
    for (const article of articles) {
      const content = localStorage.getItem(`article_content_${article.slug}`) || '';
      const result = await syncArticle(article, content);
      
      if (result.success) {
        results.success++;
      } else {
        results.failed++;
        results.errors.push({ slug: article.slug, error: result.error });
      }
    }

    return results;
  }

  // ===== Validate GitHub Connection =====
  async function validateConnection() {
    try {
      // Test authentication
      const user = await githubFetch('/user');
      
      // Test repository access
      const repo = await githubFetch(
        `/repos/${config.owner}/${config.repo}`
      );

      return {
        success: true,
        user: user.login,
        repo: repo.full_name,
        private: repo.private
      };
    } catch (e) {
      return {
        success: false,
        error: e.message
      };
    }
  }

  // ===== Get Sync Status =====
  function getSyncStatus() {
    return {
      enabled: isEnabled(),
      isSyncing,
      queueLength: syncQueue.length,
      config: {
        owner: config.owner,
        repo: config.repo,
        branch: config.branch
      }
    };
  }

  // ===== Set Sync Status =====
  function setSyncStatus(status) {
    localStorage.setItem(STORAGE_KEYS.SYNC_STATUS, JSON.stringify({
      ...status,
      timestamp: Date.now()
    }));
  }

  // ===== Base64 Encode (UTF-8 safe) =====
  function btoa(str) {
    return window.btoa(str);
  }

  // ===== Public API =====
  return {
    init,
    loadConfig,
    saveConfig,
    getConfig,
    isEnabled,
    syncArticle,
    deleteArticleFromGithub,
    syncAllArticles,
    validateConnection,
    getSyncStatus,
    setSyncStatus,
    upsertFile,
    deleteFile
  };
})();

// Auto-initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => GitHubSync.init());
} else {
  GitHubSync.init();
}
