---
slug: building-with-docusaurus
title: Building a Modern Documentation Site with Docusaurus
authors: [admin]
tags: [docusaurus, documentation, react, static-site]
---

# Building a Modern Documentation Site with Docusaurus

Today I want to share my experience setting up a personal blog and documentation site using Docusaurus, Meta's powerful static site generator. After evaluating various options, I found Docusaurus to be the perfect balance of simplicity and functionality.

## Why Docusaurus?

When choosing a platform for my personal site, I had several requirements:
- **Markdown Support**: Write content in simple Markdown
- **React-Based**: Leverage React for custom components
- **i18n Ready**: Built-in internationalization support
- **Search Functionality**: Full-text search out of the box
- **Dark Mode**: Modern theme switching capabilities
- **Performance**: Static site generation for optimal loading

Docusaurus checked all these boxes and more.

<!--truncate-->

## Key Features I Implemented

### 1. Internationalization (i18n)

Setting up multi-language support was surprisingly straightforward:

```javascript
i18n: {
  defaultLocale: 'en',
  locales: ['en', 'zh'],
  localeConfigs: {
    en: {
      label: 'English',
      htmlLang: 'en-US',
    },
    zh: {
      label: '中文',
      htmlLang: 'zh-CN',
    },
  },
}
```

The locale dropdown in the navbar automatically handles language switching, making the site accessible to a global audience.

### 2. Enhanced Search

I integrated the `@easyops-cn/docusaurus-search-local` plugin for local search functionality:

```javascript
themes: [
  [
    require.resolve("@easyops-cn/docusaurus-search-local"),
    {
      hashed: true,
      language: ["en", "zh"],
      highlightSearchTermsOnTargetPage: true,
    },
  ],
],
```

This provides instant search results without needing external services.

### 3. Automated Deployment

Using GitHub Actions, I set up automatic deployment to GitHub Pages:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: ./build
```

Every push to main automatically builds and deploys the site!

## Project Structure

The organization I settled on:
```
docs/
├── intro.md           # Homepage
├── notes/            # Technical notes
│   ├── programming/  # Language-specific content
│   ├── tools/       # Tool documentation
│   └── thoughts/    # Reflections and insights
blog/                # Time-based blog posts
src/
└── pages/          # Custom React pages
    └── about.md    # About page
```

## Performance Optimizations

Docusaurus generates static HTML for each page, ensuring:
- Fast initial page loads
- Excellent SEO
- Works without JavaScript (progressive enhancement)
- Optimal Core Web Vitals scores

## Lessons Learned

1. **Start Simple**: Don't over-engineer the initial setup
2. **Use Built-in Features**: Docusaurus provides many features out of the box
3. **Optimize Images**: Use appropriate formats and lazy loading
4. **Test Locally**: Always run `npm run build` before deploying
5. **Version Control Everything**: Including configuration and content

## What's Next?

I'm planning to add:
- Comment system integration
- RSS feed customization
- Advanced MDX components
- Analytics integration

## Conclusion

Docusaurus has proven to be an excellent choice for building a personal technical blog. Its balance of simplicity and power makes it perfect for developers who want to focus on content while having the flexibility to customize when needed.

If you're considering building a documentation site or technical blog, I highly recommend giving Docusaurus a try!

---

*Have questions about my setup? Feel free to reach out or check out the [source code](https://github.com) of this site!*