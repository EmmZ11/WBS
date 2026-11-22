#!/usr/bin/env bash
# One-click setup and test run (macOS / Linux): ./run-tests.sh
# It does what the CI pipeline does: install, typecheck, lint, run every test project,
# then opens the HTML report.
set -euo pipefail
cd "$(dirname "$0")"

step() { printf '\n==> %s\n' "$1"; }

# 1. Node.js 22 or newer
step 'Checking Node.js'
if ! command -v node >/dev/null 2>&1; then
  echo 'Node.js is not installed. Install version 22 or newer from https://nodejs.org and run this again.'
  exit 1
fi
major=$(node --version | sed 's/^v//; s/\..*//')
if [ "$major" -lt 22 ]; then
  echo "Node.js $(node --version) found; version 22 or newer is needed (https://nodejs.org)."
  exit 1
fi
echo "Node.js $(node --version)"

# 2. Dependencies and browser
step 'Installing dependencies (npm ci)'
npm ci

step 'Installing the Chromium browser for Playwright'
if [ "$(uname -s)" = "Linux" ]; then
  npx playwright install --with-deps chromium   # Linux also needs system libraries
else
  npx playwright install chromium
fi

# 3. Credentials (.env, git-ignored). Asked for once; never printed.
if [ ! -f .env ]; then
  step 'Creating .env (the logins stay on this machine)'
  echo 'Restful Booker Platform admin login (automationintesting.online):'
  read -r -p '  Username: ' admin_user
  read -r -s -p '  Password: ' admin_pass; echo
  echo 'Restful Booker API login ("Auth - CreateToken" at restful-booker.herokuapp.com/apidoc):'
  read -r -p '  Username: ' booker_user
  read -r -s -p '  Password: ' booker_pass; echo
  while IFS= read -r line || [ -n "$line" ]; do
    case "$line" in
      ADMIN_USERNAME=*)  echo "ADMIN_USERNAME=$admin_user" ;;
      ADMIN_PASSWORD=*)  echo "ADMIN_PASSWORD=$admin_pass" ;;
      BOOKER_USERNAME=*) echo "BOOKER_USERNAME=$booker_user" ;;
      BOOKER_PASSWORD=*) echo "BOOKER_PASSWORD=$booker_pass" ;;
      *) echo "$line" ;;
    esac
  done < .env.example > .env
  echo 'Saved .env'
else
  printf '\nUsing the existing .env\n'
fi

# 4. The same steps as CI
export CI=true
step 'Typecheck'
npm run typecheck
step 'Lint'
npm run lint
step 'Running all test projects (about 3 minutes)'
set +e
npx playwright test
test_exit=$?
set -e

# 5. Result
echo
if [ "$test_exit" -eq 0 ]; then
  echo 'All tests passed.'
else
  echo 'Test run finished with failures. This is expected: every failure is a defect'
  echo 'in the systems under test, named by its bug ID and listed in BUG-REPORT.md.'
  echo 'A failure starting with "precondition:" means the shared demo site misbehaved; run again.'
fi
report="playwright-report/index.html"
if [ -f "$report" ]; then
  echo "Opening the HTML report: $report"
  if command -v open >/dev/null 2>&1; then open "$report"; elif command -v xdg-open >/dev/null 2>&1; then xdg-open "$report" >/dev/null 2>&1 || true; fi
fi
exit "$test_exit"
