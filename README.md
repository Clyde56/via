# My Blog - 个人博客

基于纯静态技术构建的个人博客网站，部署在 Cloudflare Pages 上。

## 技术栈

- **HTML/CSS/JavaScript** — 纯静态，无框架依赖
- **[Marked](https://marked.js.org/)** — Markdown 渲染（CDN）
- **[Highlight.js](https://highlightjs.org/)** — 代码语法高亮（CDN）
- **Cloudflare Pages** — 全球 CDN 托管和部署

## 功能特性

| 特性 | 说明 |
|------|------|
| 📝 **Markdown 文章** | 文章以 `.md` 格式存储，前端实时渲染 |
| 🏷️ **标签分类** | 每篇文章可添加多个标签，支持按标签筛选 |
| 🌓 **深色/浅色主题** | 一键切换，支持跟随系统偏好 |
| 📱 **响应式设计** | 完美适配桌面端、平板、手机 |
| 🔍 **SEO 优化** | JSON-LD 结构化数据（Person/Website/BreadcrumbList/Article）、Open Graph、Twitter Card |
| 📡 **RSS 订阅** | 支持 RSS 2.0 订阅 |
| ✨ **代码高亮** | 支持多种语言的语法高亮 |
| 🧭 **History API 路由** | 干净的 URL，无 `#` 符号 |
| ⬅️➡️ **上下篇文章导航** | 文章底部自动显示 |

## 项目结构

```
my-blog/
├── index.html              # 主入口（SPA 单页应用）
├── 404.html                # 自定义 404 页面
├── _redirects              # Cloudflare Pages 重定向规则
├── _headers                # Cloudflare Pages 自定义响应头
├── wrangler.toml           # Wrangler 部署配置
├── rss.xml                 # RSS 订阅文件
├── sitemap.xml             # SEO 站点地图
├── .gitignore
├── README.md
├── assets/
│   ├── css/
│   │   └── style.css       # 全部样式（含深色/浅色主题）
│   └── js/
│       ├── app.js          # SPA 路由、渲染、SEO 逻辑
│       └── theme.js        # 主题切换管理
└── articles/
    ├── index.json          # 文章清单（元数据索引）
    ├── welcome.md          # 示例文章
    ├── hello-world.md
    ├── building-static-blog.md
    └── markdown-guide.md
```

## 如何添加新文章

### 第 1 步：创建 Markdown 文件

在 `articles/` 目录下创建 `.md` 文件，文件名为文章的唯一标识（slug），建议使用英文或拼音：

```markdown
---
title: "文章标题"
date: 2026-05-27
tags: ["标签1", "标签2"]
description: "文章摘要，用于列表页和 SEO"
---

# 文章标题

文章正文内容...
```

**frontmatter 字段说明：**

| 字段 | 必需 | 说明 |
|------|------|------|
| `title` | ✅ | 文章标题 |
| `date` | ✅ | 发布日期（YYYY-MM-DD 格式） |
| `tags` | ✅ | 标签数组，如 `["tech", "javascript"]` |
| `description` | ✅ | 文章摘要，用于列表卡片和 SEO meta |
| `author` | ❌ | 作者名（默认使用站点配置中的作者） |
| `readingTime` | ❌ | 预计阅读时间（分钟），如 `5` |

### 第 2 步：更新文章清单

编辑 `articles/index.json`，在数组中添加新文章的元数据：

```json
{
  "slug": "your-article-slug",
  "title": "文章标题",
  "date": "2026-05-27",
  "tags": ["标签1", "标签2"],
  "description": "文章摘要",
  "readingTime": 5
}
```

### 第 3 步：更新 RSS

编辑 `rss.xml`，在 `<channel>` 中添加新的 `<item>` 条目：

```xml
<item>
  <title>文章标题</title>
  <link>https://your-domain.pages.dev/article/your-article-slug</link>
  <guid isPermaLink="true">https://your-domain.pages.dev/article/your-article-slug</guid>
  <pubDate>Mon, 25 May 2026 00:00:00 GMT</pubDate>
  <description>文章摘要</description>
  <category>标签</category>
</item>
```

### 第 4 步（可选）：更新 sitemap.xml

在 `sitemap.xml` 中添加新文章的 `<url>` 条目：

```xml
<url>
  <loc>https://your-domain.pages.dev/article/your-article-slug</loc>
  <changefreq>monthly</changefreq>
  <priority>0.6</priority>
</url>
```

### 第 5 步（可选）：更新站点配置

编辑 `assets/js/app.js` 开头的 `CONFIG` 对象，修改站点标题、描述、URL 等：

```javascript
const CONFIG = {
  title: 'My Blog',
  description: 'A personal blog',
  url: 'https://your-domain.pages.dev',
  author: 'Your Name',
  locale: 'zh-CN',
};
```

同时更新 `index.html` 中以下标签的值：
- `<title>` 标签
- `meta[name="description"]`
- `meta[property="og:url"]`
- `link[rel="canonical"]`
- JSON-LD 结构中 `@id` 和 `url` 字段

以及 `rss.xml` 中的 `<link>` 和 `<atom:link href>`。

## 本地预览

由于项目是纯静态文件，推荐使用任意 HTTP 服务器在本地预览：

### 使用 Python

```bash
# Python 3
python -m http.server 8000

# 然后打开 http://localhost:8000
```

### 使用 Node.js

```bash
npx serve .
```

### 使用 VS Code

安装 "Live Server" 插件，右键 `index.html` → "Open with Live Server"。

> **注意**：直接双击打开 `index.html` 不能正常使用 SPA 路由，必须通过 HTTP 服务器访问。

## 部署到 Cloudflare Pages

### 方法一：通过 Git 自动部署（推荐）

1. 将代码推送到 GitHub/GitLab 仓库
2. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
3. 进入 **Pages** → **创建项目** → **连接到 Git**
4. 选择你的仓库
5. 构建设置：
   - **构建命令**：（留空，无需构建）
   - **构建输出目录**：`/`（根目录）
6. 点击 **保存并部署**

### 方法二：通过 Wrangler CLI 部署

```bash
# 安装 Wrangler
npm install -g wrangler

# 登录 Cloudflare
wrangler login

# 部署
wrangler pages deploy . --project-name=my-blog
```

### 方法三：手动上传

在 Cloudflare Pages 控制台选择 **创建项目** → **直接上传**，将整个项目文件夹拖入即可。

## 自定义域名

1. 在 Cloudflare Pages 项目设置中，点击 **自定义域**
2. 输入你的域名并按照指示配置 DNS
3. 更新 `assets/js/app.js` 中的 `CONFIG.url`
4. 更新 `rss.xml` 中的 `<link>` 和 `<atom:link href>`
5. 更新 `sitemap.xml` 中的 `<loc>` 值
6. 更新 `index.html` 中的 JSON-LD、OG 标签、canonical URL

## 自定义主题色

编辑 `assets/css/style.css` 中的 CSS 变量：

```css
:root {
  --accent: #2563eb;       /* 主色调 */
  --accent-hover: #1d4ed8; /* 悬停色 */
  --accent-light: #eff6ff; /* 浅色背景 */
}

[data-theme="dark"] {
  --accent: #60a5fa;
  --accent-hover: #93bbfc;
  --accent-light: #1e3a5f;
}
```

## 浏览器支持

- Chrome/Edge（最新 2 个版本）
- Firefox（最新 2 个版本）
- Safari（最新 2 个版本）
- 移动端 Safari 和 Chrome

## 技术细节

### SPA 路由

项目使用 History API 实现客户端路由，无 `#` 符号：

| 路由 | 页面 |
|------|------|
| `/` | 首页（文章列表） |
| `/article/:slug` | 文章详情 |
| `/tags` | 标签列表 |
| `/tag/:tag` | 按标签筛选 |

`_redirects` 文件将服务器上所有路径请求指向 `index.html`：

```
/* /index.html 200
```

### SEO

所有页面自动生成：
- **Meta 标签**：`title`、`description`、`keywords`
- **Open Graph**：`og:title`、`og:description`、`og:url`、`og:type`
- **Twitter Card**：`twitter:title`、`twitter:description`
- **JSON-LD**：`Person`、`WebSite`、`BreadcrumbList`、`Article` 结构化数据

## License

MIT
