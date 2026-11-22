# Test Plan and Test Scenarios

This plan turns my exploratory findings into automated tests. The original
thinking is in [`docs/`](docs): the audio recording, the raw transcript and the
formatted test-planning introduction. Those documents are unchanged; this file
is the executable version of them.

## 1. Systems under test

| System | URL | Why it is in scope |
|---|---|---|
| Restful Booker Platform, admin area | `automationintesting.online/admin` | The internal tool staff use. Main scope of my plan. |
| Platform API (behind the admin UI) | `automationintesting.online/api` | The source of truth the UI is checked against. |
| Restful Booker API (brief's Option A) | `restful-booker.herokuapp.com` | Covered as the bonus "other option". |

## 2. Scope

**In scope**
- Admin login, then every admin area: Rooms, Report (calendar and booking), Branding, Messages.
- The platform API endpoints those areas call.
- Input validation, error handling and UI–API parity.
- Light security checks against the OWASP Top 10: broken access control (A01),
  injection and XSS (A03), security misconfiguration (A05), authentication and
  session failures (A07).
- Option A: the booking lifecycle, its auth rules and its validation.

**Out of scope**
- The public guest-facing site (home page, guest booking, contact form). Guest
  endpoints are only used as test setup, for example to create a message that
  admin then reads.
- Performance and load testing.
- Visual design beyond basic usability and accessibility.
- Deep security testing.

## 3. Key risks (from exploration)

1. **Validation gap between UI and API.** The API has rules; the UI does not show
   or explain them. Errors are raw, and many do not say which field is wrong.
2. **Broken core functions.** Rooms cannot be opened, edited or deleted; messages
   cannot be opened; bookings cannot be read or cancelled by id.
3. **Misleading feedback.** A booking that succeeds is reported to the admin as failed.
4. **Security.** Admin data is readable without a login; sessions survive logout;
   the session cookie is unprotected; server internals leak in errors.
5. **Shared, resetting data.** The demo site is public and resets on a schedule,
   so results must be confirmed against the API, not assumed from the UI.

## 4. Approach

- **API is the source of truth.** Every UI action that changes data is confirmed with an API read.
- **Tests assert the correct behaviour.** When the system is wrong, the test fails
  with the bug ID and the expected and actual result. Nothing is skipped or hidden.
- **Each test owns its data.** Unique fictional names, a fresh room per booking test.
  No test depends on another or on existing data.
- **Shared data is never altered.** Branding is only re-sent unchanged or with an
  invalid value the API refuses.
- **Priority** decides depth:
  - **P1**: core business flow, data exposure or session security.
  - **P2**: validation and error handling, the main risk theme.
  - **P3**: usability and accessibility.

## 5. Test scenarios

Type: **+** positive, **−** negative, **B** boundary, **S** security.
Bug IDs link to [BUG-REPORT.md](BUG-REPORT.md).

### 5.1 Login and session (admin UI and platform API)

| # | Scenario | Type | Layer | Priority | Why | Bug |
|---|---|---|---|---|---|---|
| L1 | Valid login opens the admin area | + | UI | P1 | Gate to every admin feature | |
| L2 | Invalid login shows an error, stays on login | − | UI | P1 | Basic auth behaviour | |
| L3 | Unknown user, empty fields, SQL injection are refused (401) | − S | API | P1 | Login must not be bypassable (A03, A07) | |
| L4 | Generic "Invalid credentials" message | S | API | P2 | Does not reveal which half was wrong | |
| L5 | Token validation refuses missing and forged tokens | − S | API | P1 | Session integrity | |
| L6 | Password input is masked | S | UI | P2 | Shoulder-surfing | |
| L7 | Admin pages show login when not logged in | − S | UI | P1 | Access control in the UI | |
| L8 | Logout ends the session in the browser | + | UI | P1 | Session lifecycle | |
| L9 | Token stops working after logout | S | API | P1 | Logout must end the session server-side (A07) | RBP-12 |
| L10 | Session cookie is HttpOnly and Secure | S | UI | P2 | Token theft via script or plain HTTP (A05) | RBP-13 |
| L11 | Logout is not offered before login | − | UI | P3 | Confusing UI state | RBP-04 |

### 5.2 Access control without a session (platform API)

| # | Scenario | Type | Priority | Why | Bug |
|---|---|---|---|---|---|
| A1 | Cannot create a room | S | P1 | Admin action (A01) | |
| A2 | Cannot delete a room (401, not 500) | S | P1 | Admin action; must refuse cleanly | RBP-05 |
| A3 | Cannot change branding | S | P1 | Site-wide data | |
| A4 | Cannot list bookings or read the report | S | P1 | Guest personal data | |
| A5 | Cannot list guest messages | S | P1 | Names and subjects are personal data | RBP-01 |

### 5.3 Navigation (admin UI)

| # | Scenario | Type | Priority | Why |
|---|---|---|---|---|
| N1–N4 | Rooms, Report, Branding, Messages links open their pages | + | P2 | Every area must be reachable |

### 5.4 Rooms

| # | Scenario | Type | Layer | Priority | Why | Bug |
|---|---|---|---|---|---|---|
| R1 | Admin creates a room; it is stored with the right values | + | UI, API | P1 | Core admin data; everything hangs off rooms | |
| R2 | Empty room is refused; every error names its field | − | API | P2 | Validation theme | RBP-09 |
| R3 | Empty form says which fields are missing | − | UI | P2 | My finding: errors do not say what is wrong | RBP-09 |
| R4 | Required fields are marked as required | − | UI | P2 | My finding: nothing is marked mandatory | RBP-09 |
| R5 | Negative price is refused | B | API | P2 | Boundary on price | |
| R6 | Admin can read a single room / room page shows details | + | API, UI | P1 | Room detail page is blank | RBP-06 |
| R7 | Admin can update a room | + | API | P1 | Rooms cannot be edited | RBP-06 |
| R8 | Admin can delete a room | + | API, UI | P1 | My finding: rooms cannot be deleted | RBP-05 |
| R9 | Room name with HTML is shown as text, not executed | S | UI | P1 | Stored XSS (A03) | |
| R10 | Form inputs have accessible labels | − | UI | P3 | No guidance; screen readers | RBP-14 |

### 5.5 Report and bookings

| # | Scenario | Type | Layer | Priority | Why | Bug |
|---|---|---|---|---|---|---|
| B1 | Calendar moves between months and back to today | + | UI | P3 | My finding: navigation works | |
| B2 | Admin books from the calendar: stored and confirmed | + | UI, API | P1 | Core flow; my 409 finding | RBP-15 |
| B3 | Valid booking is created (201) and shows for its room and in the report | + | API | P1 | Report must reflect bookings | |
| B4 | Overlapping booking for the same room is refused (409) | − | API | P1 | Prevents double booking | |
| B5 | Empty booking is refused and lists missing fields | − | API | P2 | Validation theme | |
| B6 | First name 2 and 19, last name 2 and 31 characters are refused | B | API | P2 | Limits 3–18 and 3–30 from the API | |
| B7 | Every validation error names its field | − | API, UI | P2 | My finding: raw error block | RBP-02 |
| B8 | Checkout before checkin is a 400, not a 409 | − | API | P2 | Wrong status hides the reason | RBP-03 |
| B9 | Admin can read and cancel a booking by id | + | API | P1 | Bookings cannot be managed | RBP-08 |
| B10 | Booking dialog has a meaningful accessible name | − | UI | P3 | Announced as "onRequestClose Example" | RBP-14 |

### 5.6 Branding

| # | Scenario | Type | Layer | Priority | Why | Bug |
|---|---|---|---|---|---|---|
| G1 | Branding can be read with all the form's fields | + | API | P2 | Baseline | |
| G2 | Form shows the branding stored in the API | + | UI | P2 | UI–API parity | |
| G3 | Saving the current branding unchanged succeeds | + | API, UI | P2 | The site's own data is rejected | RBP-10 |
| G4 | Invalid email is refused, naming the email field | − | API, UI | P2 | Validation feedback | |
| G5 | Validation errors do not expose server internals | S | API | P2 | Information disclosure (A05) | RBP-11 |

### 5.7 Messages

| # | Scenario | Type | Layer | Priority | Why | Bug |
|---|---|---|---|---|---|---|
| M1 | New message appears in the admin list (API: as unread) | + | API, UI | P1 | Admin must see enquiries | |
| M2 | Opening a message shows its full text | + | API, UI | P1 | My finding: 500 on open | RBP-07 |
| M3 | Admin can mark a message as read | + | API | P2 | Inbox management | RBP-07 |

### 5.8 Option A: Restful Booker API

Every endpoint and every option in the apidoc is covered at least once: the 8
endpoints, both write-authorisation methods (token cookie, Basic auth), the four
search filters, and the three body formats (JSON, XML, URL-encoded).

| # | Scenario | Type | Priority | Why | Bug |
|---|---|---|---|---|---|
| O1 | Health check responds (201, as documented) | + | P2 | Fail fast if the service is down | |
| O2 | Guest creates a booking and reads it back | + | P1 | Core flow | |
| O3 | Create, find by name, update, patch, delete (token cookie), then 404 | + | P1 | Full lifecycle in one flow | |
| O4 | Valid credentials return a token | + | P1 | Gate to every write | |
| O5 | Bad credentials refused with 401 and no token | − S | P1 | Auth (A07) | RB-05 |
| O6 | Update, patch and delete with no auth, a forged token or wrong Basic credentials are forbidden; booking unchanged | S | P1 | Bookings belong to someone (A01) | |
| O7 | Update, patch and delete work with Basic auth | + | P1 | Documented alternative to the token | |
| O8 | Full update (PUT) with missing fields is refused, booking unchanged | − | P2 | PUT replaces the whole booking | |
| O9 | All booking ids are returned without a filter | + | P2 | Search baseline | |
| O10 | Filter by name returns only that booking | + | P1 | Finding a guest's booking | |
| O11 | Check-in filter: day before includes, same day includes, day after excludes | B | P2 | Documented "greater than or equal" | RB-07 |
| O12 | Check-out filter: day before includes, same day includes, day after excludes | B | P2 | Documented "greater than or equal" | RB-08 |
| O13 | Invalid filter date is refused with 400 | − | P2 | Server error on bad input | RB-09 |
| O14 | Reading a booking that does not exist returns 404 | − | P2 | Correct status | |
| O15 | Updating, patching or deleting a booking that does not exist returns 404 | − | P3 | Correct status | RB-10 |
| O16 | Booking can be read as XML, with an XML content type | + | P3 | Documented format | RB-11 |
| O17 | Booking can be created with an XML body and with a URL-encoded body | + | P3 | Documented formats | |
| O18 | Missing required field is 400, not 500 | − | P2 | Server error on bad input | RB-01 |
| O19 | Checkout before checkin is refused | − | P2 | Impossible stay is stored | RB-02 |
| O20 | Invalid date is refused | − | P2 | Stored as `0NaN-aN-aN` | RB-03 |
| O21 | Negative total price is refused | B | P2 | Money field boundary | RB-04 |
| O22 | Non-boolean deposit flag is refused, not coerced | − | P3 | Silent data change | RB-06 |
| — | Documentation matches behaviour (reviewed by hand) | − | P3 | Wrong examples mislead integrators | RB-12 |

## 6. What was deliberately not automated

- Guest site flows: out of my scope.
- Exhaustive boundary sweeps: one value either side of each limit proves the rule.
- Visual layout: my plan excludes visual design.
- Load and concurrency: out of scope, and unfair on a shared public demo.
