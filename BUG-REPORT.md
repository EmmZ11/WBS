# Bug Report

Every defect below was reproduced by hand during exploration, then encoded in an
automated test that fails while the defect exists. The test name is given for each,
so the evidence (error message with expected and actual values, page snapshot and,
for UI tests, a screenshot) is in the HTML report.

**Run used for this report:** GitHub Actions run
[44955192025](https://github.com/EmmZ11/WBS/actions/runs/44955192025), commit `93aa3ad`,
21 November 2026. The HTML report of that run is committed in [report/](report/index.html).

| Tests | Passed | Failed | Flaky | Skipped |
|---|---|---|---|---|
| 78 (76 tests + 2 login setups) | 45 | 33 | 0 | 0 |

All 33 failures are the defects below; no test failed for any other reason. A local
run on the same commit gave the same result.

| Project | Failures | Bugs |
|---|---|---|
| platform-api | 15 | RBP-01, 02, 03, 05, 06, 07, 08, 09, 10, 11, 12 |
| platform-ui | 12 | RBP-02, 04, 05, 06, 07, 09, 10, 13, 14, 15 |
| booker-api | 6 | RB-01 to RB-06 |

## Severity

| Severity | Meaning |
|---|---|
| High | Core function broken, personal data exposed, or session security broken |
| Medium | Wrong result or misleading behaviour with a workaround; information disclosure |
| Low | Usability, accessibility or convention issue |

## Summary

| ID | Title | Severity | Area |
|---|---|---|---|
| RBP-01 | Guest messages can be listed without logging in | High | Messages / access control |
| RBP-05 | Rooms cannot be deleted | High | Rooms |
| RBP-06 | Room page is blank; rooms cannot be read or edited | High | Rooms |
| RBP-07 | Messages cannot be opened or marked as read | High | Messages |
| RBP-08 | Bookings cannot be read or cancelled by id | High | Bookings |
| RBP-12 | Session token still works after logout | High | Session |
| RBP-15 | A successful booking is reported to the admin as failed | High | Report |
| RBP-02 | Booking validation errors do not say which field is wrong | Medium | Report / bookings |
| RBP-09 | Room form: nothing marked required, errors do not name fields | Medium | Rooms |
| RBP-10 | Branding cannot be saved with the site's own data | Medium | Branding |
| RBP-11 | Branding errors expose server internals | Medium | Branding / security |
| RBP-13 | Session cookie is not HttpOnly or Secure | Medium | Session / security |
| RBP-03 | Invalid booking dates return 409 Conflict instead of 400 | Low | Bookings |
| RBP-04 | Logout button shown before logging in | Low | Login |
| RBP-14 | Room form inputs and booking dialog lack accessible names | Low | Accessibility |
| RB-01 | Missing required field crashes with 500 | Medium | Option A: validation |
| RB-02 | Checkout before checkin is accepted | Medium | Option A: validation |
| RB-03 | Invalid date is stored as `0NaN-aN-aN` | Medium | Option A: validation |
| RB-04 | Negative total price is accepted | Medium | Option A: validation |
| RB-05 | Bad credentials return 200 instead of 401 | Medium | Option A: auth |
| RB-06 | Non-boolean deposit flag is silently converted to true | Low | Option A: validation |

**Likely common cause (RBP-05 to RBP-08):** every platform API route that takes an
id (`/api/room/{id}`, `/api/booking/{id}`, `/api/message/{id}`) returns
500 Internal Server Error, for every method, logged in or not. List and create
routes work. These are reported separately because each breaks a different admin
task, but a developer should start by looking at id-route handling.

---

## Restful Booker Platform (admin)

### RBP-01: Guest messages can be listed without logging in
**Severity:** High · **Layer:** API · **OWASP:** A01 Broken Access Control
**Steps:** Without logging in, send `GET /api/message`.
**Expected:** 401, because messages belong to the admin-only Messages page.
**Actual:** 200, with every message's sender name and subject.
**Impact:** Personal data (guest names and what they wrote about) is public.
**Test:** `Platform API: access control without a session › cannot list guest messages`

### RBP-02: Booking validation errors do not say which field is wrong
**Severity:** Medium · **Layer:** API and UI (Report booking dialog)
**Steps:** In Report, select dates, leave the form empty and click Book.
**Expected:** Each error names its field, ideally next to that field.
**Actual:** One block of raw API messages. Some name a field ("Firstname should not
be blank"); others do not ("size must be between 3 and 18", "size must be between
3 and 30", "must be greater than or equal to 1"). The admin cannot tell which input is wrong.
**Tests:** `Platform API: booking validation › validation errors name the field at fault`;
`Platform UI: report and booking › booking with empty fields says which fields are wrong`

### RBP-03: Invalid booking dates return 409 Conflict instead of 400
**Severity:** Low · **Layer:** API
**Steps:** `POST /api/booking` with checkout earlier than checkin.
**Expected:** 400 with a message such as "checkout must be after checkin".
**Actual:** 409 `{"error":"Failed to create booking"}`. 409 also means "dates already
booked", so the admin cannot tell bad input from a real clash.
**Test:** `Platform API: booking validation › checkout before checkin is rejected as a validation error (400)`

### RBP-04: Logout button shown before logging in
**Severity:** Low · **Layer:** UI
**Steps:** Open `/admin` without a session.
**Expected:** Only the login form; no Logout option.
**Actual:** The navigation shows a Logout button.
**Test:** `Platform UI: admin login › Logout is not offered before logging in`

### RBP-05: Rooms cannot be deleted
**Severity:** High · **Layer:** UI and API
**Steps:** In Rooms, click the delete (×) icon on a room.
**Expected:** The room is removed from the list and from the API.
**Actual:** `DELETE /api/room/{id}` returns 500. The room stays and the UI shows no
error. Without a login the same call also returns 500 instead of 401.
**Tests:** `Platform UI: rooms › admin can delete a room`;
`Platform API: rooms (admin) › admin can delete a room and it leaves the list`;
`Platform API: access control without a session › cannot delete a room (401, not a server error)`

### RBP-06: Room page is blank; rooms cannot be read or edited
**Severity:** High · **Layer:** UI and API
**Steps:** In Rooms, click a room to open its page.
**Expected:** The room's name, type, price, features and bookings, with Edit.
**Actual:** `GET /api/room/{id}` returns 500. The page shows empty labels and
"No features added to the room" even when features were set. `PUT /api/room/{id}`
also returns 500, so rooms cannot be edited.
**Tests:** `Platform UI: rooms › opening a room shows its details`;
`Platform API: rooms (admin) › admin can read a single room`; `… › admin can update a room`

### RBP-07: Messages cannot be opened or marked as read
**Severity:** High · **Layer:** UI and API
**Steps:** In Messages, click a message.
**Expected:** The message opens with its full text, and is marked as read.
**Actual:** `GET /api/message/{id}` returns 500 and nothing opens. `PUT /api/message/{id}/read`
also returns 500. Admin can see that a message exists but never read it.
**Tests:** `Platform UI: messages › opening a message shows its full text`;
`Platform API: messages (admin) › admin can open a message and read its full text`; `… › admin can mark a message as read`

### RBP-08: Bookings cannot be read or cancelled by id
**Severity:** High · **Layer:** API
**Steps:** Create a booking, then `GET` or `DELETE /api/booking/{id}`.
**Expected:** 200 with the booking; the delete removes it.
**Actual:** 500 for both. A booking cannot be cancelled.
**Tests:** `Platform API: bookings (admin) › admin can read a booking by id`; `… › admin can cancel a booking`

### RBP-09: Room form: nothing marked required, errors do not name fields
**Severity:** Medium · **Layer:** UI and API
**Steps:** In Rooms, click Create with the form empty.
**Expected:** Required fields are marked; the error says which are missing.
**Actual:** No field is marked required. The UI shows only "Failed to create room".
The API, sent an empty room directly, names some fields ("Room name must be set")
but not others ("must not be null", "must be greater than or equal to 1").
**Tests:** `Platform UI: rooms › submitting an empty form says which fields are missing`;
`… › required fields are marked as required`;
`Platform API: rooms (admin) › an empty room is refused with errors that name the missing fields`

### RBP-10: Branding cannot be saved with the site's own data
**Severity:** Medium · **Layer:** UI and API
**Steps:** Open Branding and click Submit without changing anything.
**Expected:** Saved.
**Actual:** 400; the UI shows "Url should be a correct url format". The site's own
logo value, `/images/rbp-logo.jpg`, fails the API's URL rule, so no branding change
can be saved unless the logo is also replaced with a full URL.
**Tests:** `Platform UI: branding › submitting the form unchanged saves`;
`Platform API: branding (admin) › saving the current branding unchanged succeeds`

### RBP-11: Branding errors expose server internals
**Severity:** Medium · **Layer:** API · **OWASP:** A05 Security Misconfiguration
**Steps:** `PUT /api/branding` with an invalid email.
**Expected:** 400 with a short, field-level message.
**Actual:** 400 whose message includes Java class and method names
(`org.springframework…ResponseEntity`, `com.automationintesting.api.BrandingController.updateBranding`,
`java.sql.SQLException`). This tells an attacker the framework and code structure.
**Test:** `Platform API: branding (admin) › validation errors do not expose server internals`

### RBP-12: Session token still works after logout
**Severity:** High · **Layer:** API (and UI logout) · **OWASP:** A07 Authentication Failures
**Steps:** Log in, note the token, log out (UI button or `POST /api/auth/logout`),
then use the token.
**Expected:** The token is rejected after logout.
**Actual:** `POST /api/auth/validate` still returns 200, and the token can still
create rooms. Logout only deletes the browser cookie.
**Impact:** A stolen or leftover token stays valid indefinitely.
**Test:** `Platform API: session handling › a token stops working after logout`

### RBP-13: Session cookie is not HttpOnly or Secure
**Severity:** Medium · **Layer:** UI · **OWASP:** A05 Security Misconfiguration
**Steps:** Log in and inspect the `token` cookie.
**Expected:** `HttpOnly` and `Secure` are set.
**Actual:** Neither is set. The cookie is written by page JavaScript, so any script
on the page can read the admin token (made worse by RBP-12), and the browser may
send it over plain HTTP.
**Test:** `Platform UI: admin login › the session cookie is protected from scripts and plain HTTP`

### RBP-14: Room form inputs and booking dialog lack accessible names
**Severity:** Low · **Layer:** UI · **Standard:** WCAG 2.2 (1.3.1, 4.1.2)
**Steps:** Inspect the Rooms create form and the Report booking dialog with a screen reader.
**Expected:** Each input has a label; the dialog has a meaningful name.
**Actual:** Room name and price inputs have no label. The booking dialog is announced
as "onRequestClose Example", leftover sample text from a component library.
**Tests:** `Platform UI: rooms › form inputs have accessible labels`;
`Platform UI: report and booking › the booking dialog has a meaningful accessible name`

### RBP-15: A successful booking is reported to the admin as failed
**Severity:** High · **Layer:** UI (Report)
**Steps:** In Report, select free dates, fill in the guest names, choose a room, click Book.
**Expected:** The dialog closes and the booking appears.
**Actual:** `POST /api/booking` returns 201 and the booking is stored, but the dialog
stays open and shows "Failed to create booking". Happens for any room.
**Impact:** The admin retries. The retry then fails with 409 because the first
attempt did succeed, which explains the 409 seen during exploration.
**Test:** `Platform UI: report and booking › admin can book a room from the calendar: stored and confirmed`

---

## Restful Booker API (Option A)

### RB-01: Missing required field crashes with 500
**Severity:** Medium
**Steps:** `POST /booking` without `lastname`.
**Expected:** 400 naming the missing field.
**Actual:** 500 Internal Server Error, with no detail. An empty body does the same.
**Test:** `Restful Booker API: booking validation › missing required field (lastname) is a 400, not a server error`

### RB-02: Checkout before checkin is accepted
**Severity:** Medium
**Steps:** `POST /booking` with checkin 2027-06-10 and checkout 2027-06-05.
**Expected:** 400.
**Actual:** 200; the impossible stay is stored.
**Test:** `… › checkout before checkin is refused`

### RB-03: Invalid date is stored as `0NaN-aN-aN`
**Severity:** Medium
**Steps:** `POST /booking` with `checkin: "not-a-date"`.
**Expected:** 400.
**Actual:** 200; the booking is stored with checkin `0NaN-aN-aN`.
**Test:** `… › an invalid date is refused`

### RB-04: Negative total price is accepted
**Severity:** Medium
**Steps:** `POST /booking` with `totalprice: -50`.
**Expected:** 400.
**Actual:** 200; stored with a price of −50.
**Test:** `… › a negative total price is refused`

### RB-05: Bad credentials return 200 instead of 401
**Severity:** Medium · **OWASP:** A07
**Steps:** `POST /auth` with a wrong username and password.
**Expected:** 401.
**Actual:** 200 with `{"reason":"Bad credentials"}`. Clients and monitoring that rely
on status codes treat a failed login as a success. No token is issued, which is correct.
**Test:** `Restful Booker API: authentication and authorisation › bad credentials are refused with 401`

### RB-06: Non-boolean deposit flag is silently converted to true
**Severity:** Low
**Steps:** `POST /booking` with `depositpaid: "yes"`.
**Expected:** 400 (wrong type).
**Actual:** 200; stored as `true`. Any non-empty value would record a deposit as paid.
**Test:** `Restful Booker API: booking validation › a non-boolean depositpaid is refused, not coerced`

---

## Checked and not defects

- Password field is masked.
- Login refuses SQL injection, empty and unknown credentials with a generic message.
- A forged platform token is refused (403).
- A room name containing HTML is displayed as text; no script runs.
- Overlapping bookings for the same room are refused with 409.
- Option A update and delete are refused without a valid token, and the booking survives.
- Report dates: selecting nights 10–12 gives checkout on the 13th in every time zone
  tested (check-out is the morning after the last night).
- Platform data disappearing after a while: the public demo resets on a schedule; by design.

## Observations (not logged as defects)

- **Room list lagging behind the API.** In one CI attempt, a room the API had just
  confirmed was missing from the admin Rooms list. This matches my exploration note
  that room data "seemed cached" and "eventually caught up". Seen once, not reproduced
  on demand, so it is recorded here rather than as a bug. The UI tests now reload until
  a new room appears and, if it never does, stop with a precondition message so this
  can never be mistaken for another defect.
- **Platform outage during CI.** One CI run (44955610869, first attempt) hit a period
  where the demo returned 500 "An unexpected error occurred" for room creation and
  pages timed out. The site recovered minutes later and a re-run of the same commit
  was normal. This is the shared public demo, not the system the bugs describe.
