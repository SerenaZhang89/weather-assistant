# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Single-page weather assistant (天气助手) — pure HTML/CSS/JS with no frameworks, no dependencies, no build step.

## Running

```bash
open index.html
```

## Architecture

- 代码文件（`index.html`、`style.css`、`app.js`）在根目录
- `image/` — 图片资源（`header.png`、`UI.png`）

`index.html` 引用同目录下的 `style.css` 和 `app.js`，`style.css` 通过相对路径引用 `image/header.png`。

JS flow: Geolocation API → OpenStreetMap Nominatim (reverse geocode, zh locale) → render location → Open-Meteo API (3-day forecast) → render weather cards.

Chinese direct-administered municipalities (北京/上海/天津/重庆) are detected via ISO 3166-2 codes and displayed differently from regular cities.

All UI text is in Simplified Chinese (zh-CN).


## 语言规范
- 所有对话和文档都使用中文
- 文档使用markdown格式
