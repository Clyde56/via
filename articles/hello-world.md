---
title: "Hello World"
date: 2026-05-27
tags: ["blog", "getting-started"]
description: "Welcome to my new blog! This is a sample article demonstrating the features of this blog system."
---

# Hello World!

Welcome to my new blog! This is built with pure HTML, CSS, and JavaScript, and deployed on **Cloudflare Pages**.

## What This Blog Supports

### Markdown Formatting

You can write articles using standard Markdown syntax:

- **Bold** and *italic* text
- `inline code` and code blocks
- [Links](https://example.com)
- Lists (ordered and unordered)
- Blockquotes
- Images
- Tables
- And more!

### Code Highlighting

```javascript
// JavaScript code block with syntax highlighting
function greet(name) {
  const message = `Hello, ${name}!`;
  console.log(message);
  return message;
}

greet('World');
```

```python
# Python code block
def fibonacci(n):
    a, b = 0, 1
    for _ in range(n):
        yield a
        a, b = b, a + b

print(list(fibonacci(10)))
# Output: [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]
```

```css
/* CSS code block */
:root {
  --primary-color: #2563eb;
  --text-color: #1f2937;
  --bg-color: #ffffff;
}

.container {
  max-width: 768px;
  margin: 0 auto;
  padding: 0 1rem;
}
```

### Blockquotes

> The best way to predict the future is to invent it.
>
> — Alan Kay

### Tables

| Feature | Status | Notes |
|---------|--------|-------|
| Markdown | ✅ | Full support |
| Code Highlighting | ✅ | Multiple languages |
| Dark Mode | ✅ | Toggle in header |
| RSS Feed | ✅ | Auto-generated |
| Tags | ✅ | Category filtering |

## Getting Started

To add a new article, create a `.md` file in the `articles/` directory with frontmatter like this:

```markdown
---
title: "Your Article Title"
date: 2026-05-27
tags: ["tag1", "tag2"]
description: "A brief description of your article."
---

Your content here...
```

Then add the article metadata to `articles/index.json`.

That's it! The article will automatically appear on the homepage and be included in the RSS feed.
