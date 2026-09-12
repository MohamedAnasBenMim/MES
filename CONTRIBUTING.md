# Contributing to MES

Thank you for helping improve the MES platform.

## Development workflow

1. Create a branch from `main` with a descriptive name such as `feature/operator-filter` or `fix/infor-timeout`.
2. Keep changes focused on one concern.
3. Add or update tests for changed behavior.
4. Run the relevant local checks.
5. Open a pull request using the repository template.

## Local checks

### Backend

```bash
ruff check MES-Backend/ --select E9,F63,F7,F82
black --check MES-Backend/
isort --check-only --profile black MES-Backend/
cd MES-Backend
python manage.py check
python manage.py makemigrations --check --dry-run
python manage.py test
```

### Frontend

```bash
cd MES-Frontend
npm ci
npm test -- --watch=false --browsers=ChromeHeadlessCI
npm run build -- --configuration production
```

### Complete container stack

```bash
docker compose config --quiet
docker compose up --build -d
docker compose ps
```

Verify the frontend and `/api/health/` endpoint before submitting the pull request.

## Commit guidance

Use short, imperative commit messages. Conventional prefixes are encouraged:

- `feat:` new functionality
- `fix:` defect correction
- `test:` test changes
- `docs:` documentation
- `refactor:` behavior-preserving code change
- `ci:` pipeline changes
- `chore:` maintenance

Never commit `.env`, credentials, access tokens, private keys, production data, database exports, or user-uploaded media.

## Pull requests

A pull request should explain:

- The problem and the chosen solution.
- The affected user roles or workflows.
- How the change was tested.
- Any migration, configuration, deployment, or rollback requirement.
- Screenshots for visible frontend changes.

All required CI and security checks should pass before merging.
