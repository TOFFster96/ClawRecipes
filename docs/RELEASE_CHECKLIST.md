# Release Checklist

Use this checklist before publishing a new version of ClawRecipes (including Kitchen).

## Pre-release

- [ ] `npm run test:all` passes (plugin + Kitchen tests)
- [ ] `npm run audit` passes (no high/critical vulnerabilities in root or kitchen)
- [ ] Update [CHANGELOG.md](../CHANGELOG.md) with changes under `[Unreleased]`
- [ ] Bump version in [package.json](../package.json) (and kitchen if versioned separately)
- [ ] Move CHANGELOG `[Unreleased]` entries to the new version

## Release

- [ ] `npm publish` (or your package manager's publish command)
- [ ] Create git tag (e.g. `v0.2.18`)
- [ ] Push tag

## Post-release

- [ ] Verify package on npm (or registry)
- [ ] Create GitHub release with changelog excerpt if applicable
