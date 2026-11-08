# Security Policy

## Supported Versions

Security updates are applied to the latest release on the default branch.

| Version | Supported |
| :--- | :--- |
| `1.x` (Current `main` branch) | Yes |
| Older snapshots or modified forks | No |

## Reporting a Vulnerability

If you discover a security vulnerability in `index.html`, `Code.gs`, or the repository configuration, please report it privately rather than opening a public issue.

- **Email**: [hireistiak@gmail.com](mailto:hireistiak@gmail.com)
- **Subject Line**: `[SECURITY] exe.pro.bd Vulnerability Report`

### What to Include
1. A clear description of the issue and its potential impact.
2. Step-by-step instructions or a minimal proof-of-concept to reproduce the behavior.
3. Affected file(s) and function names (`index.html` or `Code.gs`).

## Response Expectations

- **Initial Acknowledgment**: Within 48 hours of receiving the report.
- **Triage & Assessment**: Within 5 business days.
- **Remediation**: Validated issues are patched on the main branch as quickly as practical, with credit given to the reporter if desired.

## Scope & Architecture Notes

Because this project operates as a static single-file front-end paired with an optional serverless Google Apps Script endpoint:
- Client-side rate limits (`localStorage` / `sessionStorage`) are convenience guards for normal browsers; authoritative rate limiting, allowlist enforcement, and quota protection are enforced inside `Code.gs`.
- All software download links point to external official vendor releases; binary integrity should always be verified against the published SHA-256 digest.
