# Security Policy

## Reporting a vulnerability

Do not disclose security vulnerabilities in a public issue.

Use GitHub's private vulnerability reporting feature for this repository. Include:

- A clear description of the vulnerability.
- The affected component and version or commit.
- Reproduction steps or a minimal proof of concept.
- The potential impact.
- Any suggested remediation.

Avoid including real credentials, personal data, production database records, or active Infor tokens in the report.

## Sensitive configuration

The following values must be supplied through protected environment or secret-management systems:

- Django `SECRET_KEY`
- PostgreSQL credentials
- SMTP credentials
- Infor ION API credentials and access tokens
- Production host, CORS, CSRF, and TLS configuration

The committed `.env.example` is documentation only. Never use its placeholder values in production.

## Production baseline

Before deployment:

- Set `DEBUG=False` and use a strong unique `SECRET_KEY`.
- Enable HTTPS, secure cookies, and an appropriate HSTS policy.
- Restrict database and backend ports to private networks.
- Enforce backend authentication and role-based authorization.
- Run the CI and security workflows successfully.
- Back up PostgreSQL and uploaded media, and test restoration.
- Configure centralized logs, monitoring, and security alerts.
- Rotate any credential suspected of exposure.

## Automated checks

The repository uses Gitleaks, pip-audit, npm audit, Trivy, Dependabot, and local pre-commit checks. Automated scanning reduces risk but does not replace security review, penetration testing, or operational monitoring.
