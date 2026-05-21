# README Guide

Load during Step 4.

## README vs JSDoc

| README | JSDoc |
| ------ | ----- |
| Positioning, install, run | Per-symbol behavior |
| Scripts, env vars | Params, returns, throws |
| Directory overview | Implementation detail |

Link to source; do not paste full API listings.

## Bilingual layout

| Condition | Output |
| --------- | ------ |
| `README_CN.md` exists | `README.md` English + `README_CN.md` Chinese, cross-linked |
| Otherwise | Single `README.md`; default **Chinese** unless user requested English only |

## Checklist

- [ ] Name and one-line positioning
- [ ] Environment requirements when applicable
- [ ] Install and commands match `package.json` scripts
- [ ] Config / env vars when they exist
- [ ] Directory structure and roles
- [ ] Usage examples for exports or main workflows

## Verify

Every script name and path in README exists in the repo. No docs for unimplemented features.
