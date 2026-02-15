# Security Policy

## Supported Versions

We release patches for security vulnerabilities in the latest major version.

## Reporting a Vulnerability

If you discover a security vulnerability in ClawRecipes or ClawRecipes Kitchen, please report it responsibly:

1. **Do not** open a public GitHub issue for security vulnerabilities.
2. Email the maintainers or open a private security advisory on GitHub.
3. Include a clear description of the vulnerability, steps to reproduce, and potential impact.
4. Allow reasonable time for a fix before public disclosure.

We will acknowledge your report and keep you updated on the status of any fix.

## ClawRecipes Kitchen

ClawRecipes Kitchen is a local development and workflow UI. By design:

- **No authentication** — The API has no built-in auth. It is intended for localhost use or behind a protected reverse proxy.
- **Deployment** — When exposed on a network, use firewall rules, VPN, or a reverse proxy with authentication (e.g., basic auth, OAuth).
- **CORS** — In production (`NODE_ENV=production`), CORS defaults to same-origin only unless `ACCESS_CONTROL_ALLOW_ORIGIN` is set.
- **Rate limiting** — In production, API routes are rate-limited (100 requests/minute per IP); `/api/health` is exempt for monitoring.
- **CSP** — Content-Security-Policy headers are applied in production.
- **Request limits** — JSON body limit 256kb; dispatch request string max 64kb.
- **Validation** — Recipe IDs, team IDs, match objects (bindings), and prototype-pollution guards are enforced.
- **Destructive operations** — Cleanup and team removal are privileged; restrict access when behind a reverse proxy.
- **Dependency audit** — Run `npm run audit` before release to check for high-severity vulnerabilities (root and kitchen).
- **Destructive operations (production)** — When `NODE_ENV=production`, cleanup and team removal require `X-Confirm-Destructive: true` header to reduce accidental triggers.
- **Error response sanitization** — In production, `formatError` strips file paths from ENOENT and similar errors returned to clients. Server-side logs may still include full errors and paths; structured logging is deferred unless ops requirements emerge.
