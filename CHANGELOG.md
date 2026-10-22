# Changelog

All notable changes to this project are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and
the project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

_Nothing pending. The published tarball matches this repository._

## 0.1.3 — 2026-10-22

- Add the `repository` field to `package.json` so the plugin registry can link
  the published npm package back to this repository: it reads the package's
  `repository` field and only lists the npm version when it points here.

## 0.1.2 — 2026-10-21

- Add a Chinese README (`README.zh.md`), linked from `README.md` so it is
  discoverable.

## 0.1.1 — 2026-10-21

- **Fix: hide the drawer scrim at every width, not only below the breakpoint.**
  A root-scoped slot element exists at every width, so a `display: none` reset
  placed inside `@media` left the scrim unstyled above the breakpoint, where it
  fell back to the UA's `buttonface` background and showed up as a ~16×6 grey
  chip in the desktop sidebar. The base state is now "off", outside any media
  query, one rule per plugin-owned element, and each breakpoint re-enables
  exactly one with a more specific selector so it wins on specificity rather
  than source order. No width is left with no rule at all.
- `screenshots.json` fixed to the shape the registry probe accepts. The probe
  takes a plain path array; the file was a `{filename: caption}` map, which is
  none of the four accepted shapes, so the storefront silently showed no image.

## 0.1.0 — 2026-10-19

First public release.

- Hides the collapsed sidebar rail on narrow viewports, so the 1px column stops
  occupying a grid track and the conversation no longer renders at 0px wide.
- The DSH shell frame is a 3-track grid whose children are auto-placed, so
  hiding the sidebar with `display: none` takes it out of the grid; the
  implementation keeps it in flow instead.
