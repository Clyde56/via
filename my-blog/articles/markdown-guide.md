---
title: "Markdown 语法指南"
date: 2026-05-25
tags: ["guide", "markdown"]
description: "一篇全面的 Markdown 语法参考，包含代码块、表格、列表、引用等常用语法。"
author: "Author"
---

# Markdown 语法指南

Markdown 是一种轻量级标记语言，由 John Gruber 于 2004 年创建。它设计简洁，易读易写，非常适合用于博客文章、文档和笔记。

## 文本样式

- **粗体**：使用 `**` 或 `__` 包裹
- *斜体*：使用 `*` 或 `_` 包裹
- ~~删除线~~：使用 `~~` 包裹
- `行内代码`：使用反引号 `` ` `` 包裹

## 标题

```markdown
# 一级标题
## 二级标题
### 三级标题
#### 四级标题
```

注意：一篇文档应该只有一个一级标题。

## 代码块

使用三个反引号包裹代码块，并可以指定语言以实现语法高亮：

```python
def quick_sort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quick_sort(left) + middle + quick_sort(right)

print(quick_sort([3, 6, 8, 10, 1, 2, 1]))
```

## 表格

| 语法 | 效果 | 说明 |
|------|------|------|
| `**文本**` | **文本** | 加粗 |
| `*文本*` | *文本* | 斜体 |
| `` `代码` `` | `代码` | 行内代码 |
| `~~文本~~` | ~~文本~~ | 删除线 |

表格使用 `---` 分隔表头和内容，使用 `|` 分隔列。

## 引用

> 这是一段引用文字。
>
> 引用可以跨越多行，使用 `>` 符号。
>
> > 引用内部还可以嵌套引用。

## 列表

### 有序列表

1. 第一项
2. 第二项
3. 第三项

### 无序列表

- 项目 A
- 项目 B
  - 子项目 B-1
  - 子项目 B-2
- 项目 C

## 链接和图片

```markdown
[链接文字](https://example.com)
![图片描述](https://example.com/image.jpg)
```

## 分隔线

使用三个或更多的 `-`、`*` 或 `_`：

---

## 任务列表

- [x] 已完成的任务
- [ ] 未完成的任务
- [ ] 另一个待办事项

---

以上就是 Markdown 的常用语法。掌握这些基本语法后，你就能轻松写出格式美观的文章了。
