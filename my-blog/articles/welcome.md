---
title: "欢迎来到我的博客"
date: 2026-05-27
tags: ["blog", "welcome"]
description: "这是我的第一篇博客文章，介绍一下这个博客的功能和使用方法。"
author: "Author"
---

# 欢迎来到我的博客

这是我的个人博客，使用纯静态技术构建，部署在 Cloudflare Pages 上。

## 功能特性

- **📝 Markdown 渲染** — 所有文章以 Markdown 格式存储，前端实时渲染
- **🏷️ 标签分类** — 每篇文章可添加标签，按标签筛选查看
- **🌓 深色/浅色主题** — 一键切换，支持跟随系统偏好
- **📱 响应式设计** — 完美适配桌面端、平板和手机
- **🔍 SEO 优化** — Meta 标签、结构化数据自动生成
- **📡 RSS 订阅** — 支持 RSS 订阅最新文章
- **✨ 代码高亮** — 代码块语法高亮显示

## 代码示例

以下是几种语言的代码示例：

### JavaScript

```javascript
// 一个简单的异步函数
async function fetchData(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Fetch failed:', error);
    throw error;
  }
}
```

### Python

```python
def fibonacci(n):
    """生成斐波那契数列的前 n 个数"""
    a, b = 0, 1
    result = []
    for _ in range(n):
        result.append(a)
        a, b = b, a + b
    return result

print(fibonacci(10))
# 输出: [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]
```

### CSS

```css
.card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 24px;
  transition: all 0.2s ease;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
```

## 关于这个博客

这个博客的目标是：

1. **简单** — 无框架、无构建步骤，纯静态 HTML/CSS/JS
2. **快速** — 全球 CDN 加速，毫秒级加载
3. **易维护** — 添加新文章只需写 Markdown 文件

后续会陆续分享技术文章、学习笔记和个人思考。敬请期待！
