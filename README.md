# Data Grid Subcategories

An interactive data availability matrix showing completeness by location and sub-category, designed to be embedded as an iframe inside [viz-datagrid-v2](https://github.com/ocha-dap/viz-datagrid). Rows are humanitarian data sub-categories, columns are country locations, and each cell indicates whether data is available and up-to-date, available but not current, or unavailable.

## Stack

- D3 v7 (CDN) — data loading, table rendering, transitions
- Sass — compiled CSS using the HDX design system tokens
- Native ES modules — no bundler
- Deployed via GitHub Pages

## Setup

```bash
git clone https://github.com/ocha-dap/viz-datagrid-subcategories.git
cd viz-datagrid-subcategories
npm install
```

## Development

Build once and start a local server:

```bash
npm run build
npm start        # http://localhost:3000
```

Watch CSS changes during development:

```bash
npm run watch:css
```

## Build

```bash
npm run build
```

Compiles Sass, copies HTML, JS, assets, and data into `dist/`.

## Deploy

```bash
npm run deploy
```

Runs the build then publishes `dist/` to the `gh-pages` branch.

## Data

Data is fetched at runtime from three Google Sheets CSV exports defined at the top of `src/js/viz.js`:

| Constant | Content |
|----------|---------|
| `DATA_COMPLETE` | Cell-level data completeness status per sub-category and location |
| `PCT_COMPLETE_SUBCATEGORY` | Percentage complete per sub-category |
| `PCT_COMPLETE_COUNTRY` | Percentage complete per country |

## Project structure

```
src/
  index.html          — markup and script tags
  js/
    viz.js            — all data loading, table rendering, and interaction logic
  scss/
    styles.scss       — component styles
    _variables.scss   — HDX design tokens (colors, type, spacing)
    _tokens.scss      — CSS custom properties (:root)
    _fonts.scss       — Humanitarian Icons icon font
    _grid.scss        — layout grid
    _loader.scss      — loading spinner
  assets/
    fonts/            — Humanitarian Icons font files
    icons/            — SVG category icons
  data/               — local data files
dist/                 — built output (git-ignored, published to gh-pages)
```
