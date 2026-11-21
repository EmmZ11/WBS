# Restful Booker: QA Tech Challenge

API and UI test framework for the Restful Booker Platform admin tool, plus the
Restful Booker API (the brief's Option A). Built with **Playwright and TypeScript**.

| Deliverable | Where |
|---|---|
| Code | `src/`, `tests/` |
| Test plan and scenarios (positive and negative, with priorities) | [TEST-PLAN.md](TEST-PLAN.md) |
| Bug report | [BUG-REPORT.md](BUG-REPORT.md) |
| Architecture choices | [DECISIONS.md](DECISIONS.md) |
| My original exploration (audio, raw transcript, test-planning introduction) | [docs/](docs) |
| CI | [.github/workflows/tests.yml](.github/workflows/tests.yml) |
| Committed HTML report of a real run | [report/index.html](report/index.html) |

## Read this first: red tests are expected

The suite tests what the system **should** do. Where it does not, the test fails
with the bug ID, for example `RBP-05: DELETE /api/room/25 should succeed, got 500`.
A red run therefore means "defects found", not "framework broken". Every failing
test maps to one entry in [BUG-REPORT.md](BUG-REPORT.md).

## What is tested

| Project | Target | Tests |
|---|---|---|
| `platform-ui` | Admin UI: login, navigation, Rooms, Report, Branding, Messages | 27 |
| `platform-api` | The API behind the admin UI: auth, access control, rooms, bookings, branding, messages, session | 35 |
| `booker-api` | Restful Booker API (Option A): booking lifecycle, auth, validation | 14 |

Two setup projects run first and log in once: `setup` (platform) and `booker-setup` (Option A).

## Setup

Requirements: Node.js 26 (pinned in `.nvmrc`), npm, internet access.

```bash
npm ci
npx playwright install --with-deps chromium
cp .env.example .env    # then fill in the four credentials
```

`.env` holds the logins and is git-ignored:

| Variable | Value |
|---|---|
| `ADMIN_USERNAME`, `ADMIN_PASSWORD` | Admin login for automationintesting.online |
| `BOOKER_USERNAME`, `BOOKER_PASSWORD` | Login from the "Auth – CreateToken" section of restful-booker.herokuapp.com/apidoc |

## Run

```bash
npm test                    # everything
npm run test:platform-ui    # admin UI only
npm run test:platform-api   # platform API only
npm run test:booker-api     # Option A only
npm run report              # open the last HTML report
npm run typecheck           # TypeScript check
```

## CI

GitHub Actions runs on every push and pull request: typecheck, then all projects.
Each run publishes:
- a pass/fail summary table on the run page,
- the HTML report as the `playwright-report` artifact (error details and screenshots of failures;
  traces are local-only because they record credentials),
- JUnit XML as the `junit-results` artifact.

The four credentials are repository secrets with the same names as in `.env`.

## Project structure

```
src/
  config.ts               URLs and credentials (from .env or CI secrets)
  fixtures.ts             adminApi, guestApi, bookerApi, bookerToken
  platform/
    platform-api.ts       thin client for the platform API
    data.ts               fictional test data builders
    pages/                page objects: login, nav, rooms, report, branding, messages
  booker/
    booker-api.ts         thin client for the Restful Booker API
    data.ts               fictional booking builder
tests/
  auth.setup.ts           platform login, saved once
  booker.setup.ts         proves the Option A login works
  platform-ui/  platform-api/  booker-api/
```

## Assumptions

- The admin area is the system under test; the guest site is out of scope. Guest
  endpoints are only used as setup (for example, to create a message for admin to read).
- The platform API is the source of truth for what is stored.
- Both demo sites are public and shared. Other people's activity can appear at
  any time, so tests only assert on data they created themselves.
- The platform resets its data on a schedule. Persistence across that reset is
  not tested, and is not treated as a defect.
- All test data is fictional.

## Known limitations

- Rooms, bookings and messages cannot be deleted through the API (RBP-05, RBP-07,
  RBP-08), so platform tests cannot clean up after themselves. Records use
  unique `QA…` names and disappear at the site's next data reset.
- Only Chromium is run. The risks found are server- and logic-side, so more
  browsers would add time without adding findings.
- CI retries a failed test once to separate network noise from real defects.
  A test that passes on retry is reported as flaky, never silently as passed.
- Results depend on two third-party demo services being up.
