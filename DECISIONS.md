# Decisions

## Architecture

**Playwright and TypeScript for everything.** One tool covers both the UI and
the APIs, with one runner, one report and one CI job. Both are on the brief's
preferred list.

**Three projects, one per system and layer.** `platform-ui`, `platform-api` and
`booker-api` can run alone or together, and the report groups results the same
way. Adding a new area means a new spec file, not new plumbing.

**API clients with three kinds of method.** `PlatformApi` and `BookerApi` have:
- one method per endpoint, returning the raw response, so tests assert status and
  body themselves and negative tests are as easy to write as positive ones;
- typed `read…` methods for checking what is stored;
- `create…AndGetId` setup helpers that fail with a `precondition:` message.

**Typed data, not `any`.** Request and response shapes are TypeScript interfaces
in each system's `data.ts`, and response bodies are read through one `readJson<T>`
helper. A changed field name becomes a compile error instead of a confusing test failure.

**Page objects with user-facing locators.** Roles, labels and placeholders
first, as a user finds things. Where the UI gives nothing better (the room form
has no labels, RBP-14), ids are used, with a comment saying why. Page objects wait
for the page to be ready (the API response it loads, or a known element), so tests
never sleep.

**Log in once, through the API.** The setup project logs in through the API and
saves the session cookie. UI tests start already logged in; only the login tests
use the login form. This is faster and keeps one login problem from failing every test.

**The API is the source of truth.** Every UI action that changes data is confirmed
with an API read. This follows my test plan: the UI cannot be trusted to show what
was stored. RBP-15 shows why: the UI reports failure for a booking that was stored.

**Tests own their data and clean up.** Random fictional names (safe across parallel
workers), and a fresh room for every booking test. Tests never depend on existing
records or on each other. Each client remembers what it created, and the fixture
deletes it after the test. On the platform that deletion currently fails (RBP-05,
RBP-07, RBP-08); it will start working when those bugs are fixed.

**Defects fail the test, with intent.** Each test asserts the correct behaviour.
The assertion message carries the bug ID and the rule, and Playwright adds the
actual value, so a red test reads like a bug-report line. I considered marking
known bugs as expected failures (`test.fail`), which keeps CI green. I chose not
to, because the purpose of this suite is to report the system's state accurately.

**A failure must be about the right thing.** Setup steps (a login, creating a room,
waiting for it to be listed) assert separately with a `precondition:` message, so a
setup problem on the shared site is never reported as a product defect.

**Which status code is "correct".** Where the API documents a status code, the test
expects that code (for example, the Option A apidoc gives 201 for ping and delete,
and 403 for refused writes). Where it documents nothing, standard HTTP meaning applies:
401 for a failed login (RB-05), 400 for invalid input (RBP-03, RB-01 to RB-04).

**Credentials never appear in the repo or in shared reports.**
- Local runs read `.env` (git-ignored); CI reads repository secrets, visible only to the test step.
- Playwright traces record request bodies and typed values, so traces are produced only
  on local runs. I found this by scanning the first CI report for the credential values.
- `fill()` writes the typed value into the report's step log, so the login form is
  filled in a way that keeps values out of it.
- After a failed login test the form is cleared before Playwright snapshots the page,
  and login tests take no screenshots.

**Linting as a safety net.** ESLint with typescript-eslint's type-aware rules and
eslint-plugin-playwright. The key rule is `no-floating-promises`: a missing `await`
on an assertion makes a test pass without checking anything. TypeScript is pinned to
6.0 because typescript-eslint does not support TypeScript 7 yet.

## What I would do differently

- Agree a test-data strategy with the team first. On a real system I would seed
  and clean data through a test-only endpoint or database fixture, instead of
  relying on unique names and a scheduled reset.
- Ask for an OpenAPI spec. The validation rules here were learned from the API's
  own error messages; a spec would make them explicit and allow contract tests.

## With more time

- Contract tests for every endpoint against a schema, to catch silent changes in
  response shape.
- Automated accessibility scans (axe) on each admin page, building on RBP-14.
- More browsers (Firefox, WebKit) and a mobile viewport for the admin UI.
- Publish the HTML report to GitHub Pages from CI, so each run has a link.
- A small UI–API parity matrix that runs the same input through both layers and
  compares the errors side by side.
