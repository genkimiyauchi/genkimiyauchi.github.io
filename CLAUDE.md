# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Genki Miyauchi's personal academic website, built with Jekyll using the [al-folio](https://github.com/alshedivat/al-folio) theme. Deployed automatically to GitHub Pages (`gh-pages` branch) on every push to `main`.

## Development

**Recommended (Docker):**

```bash
docker compose pull && docker compose up   # http://localhost:8080
# or slim image (~100MB):
docker compose -f docker-compose-slim.yml up
```

**Without Docker:**

```bash
bundle install
bundle exec jekyll serve   # http://localhost:4000
```

**Build only:**

```bash
bundle exec jekyll build   # output in _site/
```

Changes to most files hot-reload. Changes to `_config.yml` require a full restart.

## Key content files

| What to edit         | File                                          |
| -------------------- | --------------------------------------------- |
| Homepage bio text    | `_pages/about.md`                             |
| Japanese homepage    | `_pages/about_ja.md`                          |
| Publications         | `_bibliography/papers.bib`                    |
| News/announcements   | `_news/announcement_YYYY-MM-DD.md`            |
| Social links & email | `_data/socials.yml`                           |
| CV data              | `_data/cv.yml` (or `assets/json/resume.json`) |
| Site-wide settings   | `_config.yml`                                 |

## Publications (jekyll-scholar)

Papers are in `_bibliography/papers.bib`. Custom BibTeX fields supported:

- `selected={true}` — shows paper on homepage
- `abbr={ICRA}` — venue badge
- `pdf`, `arxiv`, `code`, `video`, `poster`, `slides`, `website` — link buttons
- `preview={image.png}` — thumbnail from `assets/img/publication_preview/`
- `award={Best Paper}` — highlights an award
- `bibtex_show={true}` — shows BibTeX toggle button
- `abstract={...}` — shown on expand

The `scholar.last_name`/`first_name` in `_config.yml` controls whose name is bolded in author lists.

Fields listed under `filtered_bibtex_keywords` in `_config.yml` are stripped from the displayed BibTeX block.

## Disabled pages

Several pages are in the `exclude:` list in `_config.yml` and **will not be built**: `cv.md`, `projects.md`, `books.md`, `profiles.md`, `repositories.md`, `dropdown.md`, `teaching.md`, `blog.md`. To enable any of them, remove the entry from the exclude list.

## Deployment

Push to `main` → GitHub Actions builds the site → deploys to `gh-pages` branch. The `gh-pages` branch is auto-managed; never edit it directly.
