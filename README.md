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

A failure that starts with `precondition:` is different: test setup could not
complete (for example, the shared demo site reset its data mid-run). It is never a
product finding; re-run the job.

## What is tested

| Project | Target | Tests |
|---|---|---|
| `platform-ui` | Admin UI: login, navigation, Rooms, Report, Branding, Messages | 27 |
| `platform-api` | The API behind the admin UI: auth, access control, rooms, bookings, branding, messages, session | 36 |
| `booker-api` | Restful Booker API (Option A): every documented endpoint and option: lifecycle, both auth methods, search filters, formats, validation | 38 |

Two setup projects run first: `setup` logs in to the platform once and saves the
session; `booker-setup` checks the Option A login works (tokens are then created
once per worker).

## One-click run

Installs everything, asks for the four logins the first time (passwords are not shown
and stay in the git-ignored `.env`), runs the same steps as CI (typecheck, lint, all
tests) and opens the HTML report.

| System | How |
|---|---|
| Windows | Double-click `run-tests.cmd` |
| macOS / Linux | Run `bash run-tests.sh` in a terminal |

The only prerequisite is Node.js 22 or newer (https://nodejs.org). The run takes about
three minutes and ends with failures: those are the defects in BUG-REPORT.md.

## Setup

To do the same by hand. Requirements: Node.js 22 or newer (CI uses the version in `.nvmrc`), npm, internet access.

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
npm run lint                # ESLint, including Playwright rules
```

## CI

GitHub Actions runs on pushes to `main`, on pull requests, and on demand:
typecheck, lint, then all test projects. Each run publishes:
- a results table on the run page,
- the HTML report as the `playwright-report` artifact (error details, page snapshots
  and screenshots of failures; traces are local-only because they record credentials),
- JUnit XML as the `junit-results` artifact.

The four credentials are repository secrets with the same names as in `.env`, and
only the test step can read them. Actions are pinned to commit SHAs.

## Project structure

```
src/
  config.ts               URLs and credentials (from .env or CI secrets)
  fixtures.ts             adminApi, guestApi, bookerApi, bookerToken; clean-up after each test
  utils/                  unique ids for test data, typed JSON reading
  platform/
    platform-api.ts       client for the platform API: endpoints, typed reads, setup helpers
    data.ts               request and response types, fictional test data builders
    pages/                page objects: login, nav, rooms, report, branding, messages
  booker/
    booker-api.ts         client for the Restful Booker API
    data.ts               request and response types, fictional booking builder
tests/
  auth.setup.ts           platform login, saved once
  booker.setup.ts         checks the Option A login works
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

- Every test tries to delete what it created. On the platform this currently fails
  (RBP-05, RBP-07, RBP-08), so platform records stay until the site's scheduled reset;
  they use unique `QA…` names. Option A bookings are deleted after each test.
- Only Chromium is run. The risks found are server- and logic-side, so more
  browsers would add time without adding findings.
- CI retries a failed test once to separate network noise from real defects.
  A test that passes on retry is reported as flaky, never silently as passed.
- Results depend on two third-party demo services being up (see `precondition:` above).
