# Decisions

## Architecture

**Playwright and TypeScript for everything.** One tool covers both the UI and
the APIs, with one runner, one report and one CI job. Both are on the brief's
preferred list.

**Three projects, one per system and layer.** `platform-ui`, `platform-api` and
`booker-api` can run alone or together, and the report groups results the same
way. Adding a new area means a new spec file, not new plumbing.

**Thin API clients, not abstractions.** `PlatformApi` and `BookerApi` have one
method per endpoint and return the raw response. Tests make their own assertions,
which keeps negative tests (wrong status, wrong body) as easy to write as positive ones.

**Page objects with user-facing locators.** Roles, labels and placeholders
first, as a user finds things. Where the UI gives nothing better (the room form
has no labels, RBP-14), ids are used, with a comment saying why.

**Log in once, through the API.** The setup project logs in through the API and
saves the session cookie. UI tests start already logged in; only the login tests
use the login form. This is faster and keeps one login problem from failing every test.

**The API is the source of truth.** Every UI action is confirmed with an API read.
This follows my test plan: the UI cannot be trusted to show what was stored.
RBP-15 shows why: the UI reports failure for a booking that was stored.

**Tests own their data.** Unique fictional names, and a fresh room for every
booking test. Tests never depend on existing records or on each other, so they
run in parallel on a shared public site.

**Defects fail the test, with intent.** Each test asserts the correct behaviour.
The assertion message carries the bug ID and the rule, and Playwright adds the
actual value, so a red test reads like a bug-report line. I considered marking
known bugs as expected failures (`test.fail`), which keeps CI green. I chose not
to, because the purpose of this suite is to report the system's state accurately.

**Setup projects guard against false results.** If a login fails, the dependent
tests are skipped, not run. A credentials problem can never pass for a product defect.

**Credentials are never in the repo or in shared reports.** Local runs read `.env`,
which is git-ignored; CI reads repository secrets. Playwright traces record request
bodies and typed values, including passwords, so traces are produced only on local
runs (in the git-ignored `test-results/`). CI reports keep screenshots, error
messages and step logs, which are enough to see each defect. I found this by scanning
the first CI report for the credential values before committing it.

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
