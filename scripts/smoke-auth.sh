#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${OWLGORITHM_SMOKE_BASE_URL:-http://127.0.0.1:3847}"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

EMAIL="smoke-test+$(date +%s)@example.com"
PASSWORD='SmokePass123'
NEW_PASSWORD='SmokePass456'
UPDATED_EMAIL="smoke-test-updated+$(date +%s)@example.com"

json_value() {
  node -e '
    const data = JSON.parse(process.argv[1]);
    const path = process.argv[2].split(".");
    let value = data;
    for (const key of path) value = value?.[key];
    if (value === undefined || value === null) process.exit(2);
    process.stdout.write(typeof value === "string" ? value : JSON.stringify(value));
  ' "$1" "$2"
}

extract_token() {
  node -e '
    const url = new URL(process.argv[1]);
    process.stdout.write(url.searchParams.get("token") || "");
  ' "$1"
}

echo "Smoke test signup for ${EMAIL}"
SIGNUP_RESPONSE="$(curl -fsS -X POST "${BASE_URL}/api/auth/signup" \
  -H 'Content-Type: application/json' \
  -d "{\"name\":\"Smoke Test\",\"email\":\"${EMAIL}\",\"password\":\"${PASSWORD}\"}")"
VERIFY_URL="$(json_value "${SIGNUP_RESPONSE}" previewUrl)"
VERIFY_TOKEN="$(extract_token "${VERIFY_URL}")"

LOGIN_BEFORE_VERIFY_CODE="$(curl -sS -o "${TMP_DIR}/login-before-verify.json" -w '%{http_code}' \
  -X POST "${BASE_URL}/api/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"${EMAIL}\",\"password\":\"${PASSWORD}\"}")"
if [[ "${LOGIN_BEFORE_VERIFY_CODE}" != "403" ]]; then
  echo "Expected blocked login before verification, got ${LOGIN_BEFORE_VERIFY_CODE}" >&2
  exit 1
fi

echo "Smoke test email verification"
VERIFY_RESPONSE="$(curl -fsS -c "${TMP_DIR}/verify-cookies.txt" -X POST "${BASE_URL}/api/auth/verify-email" \
  -H 'Content-Type: application/json' \
  -d "{\"token\":\"${VERIFY_TOKEN}\"}")"
VERIFY_STATE="$(json_value "${VERIFY_RESPONSE}" user.emailVerified)"
if [[ "${VERIFY_STATE}" != "true" ]]; then
  echo "Expected verified user after verification" >&2
  exit 1
fi

echo "Smoke test password reset"
RESET_REQUEST="$(curl -fsS -X POST "${BASE_URL}/api/auth/password-reset/request" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"${EMAIL}\"}")"
RESET_URL="$(json_value "${RESET_REQUEST}" previewUrl)"
RESET_TOKEN="$(extract_token "${RESET_URL}")"
curl -fsS -c "${TMP_DIR}/reset-cookies.txt" -X POST "${BASE_URL}/api/auth/password-reset/confirm" \
  -H 'Content-Type: application/json' \
  -d "{\"token\":\"${RESET_TOKEN}\",\"password\":\"${NEW_PASSWORD}\"}" >/dev/null

LOGIN_AFTER_RESET_CODE="$(curl -sS -o "${TMP_DIR}/login-after-reset.json" -w '%{http_code}' \
  -X POST "${BASE_URL}/api/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"${EMAIL}\",\"password\":\"${NEW_PASSWORD}\"}")"
if [[ "${LOGIN_AFTER_RESET_CODE}" != "200" ]]; then
  echo "Expected successful login after password reset, got ${LOGIN_AFTER_RESET_CODE}" >&2
  exit 1
fi

echo "Smoke test email change re-verification"
PROFILE_UPDATE="$(curl -fsS -b "${TMP_DIR}/reset-cookies.txt" -X PATCH "${BASE_URL}/api/account/profile" \
  -H 'Content-Type: application/json' \
  -d "{\"name\":\"Smoke Test\",\"email\":\"${UPDATED_EMAIL}\"}")"
VERIFY_REQUIRED="$(json_value "${PROFILE_UPDATE}" verificationRequired)"
if [[ "${VERIFY_REQUIRED}" != "true" ]]; then
  echo "Expected profile email change to require verification" >&2
  exit 1
fi

curl -fsS -b "${TMP_DIR}/reset-cookies.txt" -c "${TMP_DIR}/reset-cookies.txt" \
  -X POST "${BASE_URL}/api/auth/logout" >/dev/null

LOGIN_AFTER_EMAIL_CHANGE_CODE="$(curl -sS -o "${TMP_DIR}/login-after-email-change.json" -w '%{http_code}' \
  -X POST "${BASE_URL}/api/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"${UPDATED_EMAIL}\",\"password\":\"${NEW_PASSWORD}\"}")"
if [[ "${LOGIN_AFTER_EMAIL_CHANGE_CODE}" != "403" ]]; then
  echo "Expected blocked login after email change until re-verified, got ${LOGIN_AFTER_EMAIL_CHANGE_CODE}" >&2
  exit 1
fi

NEW_VERIFY_URL="$(json_value "${PROFILE_UPDATE}" previewUrl)"
NEW_VERIFY_TOKEN="$(extract_token "${NEW_VERIFY_URL}")"
curl -fsS -c "${TMP_DIR}/final-cookies.txt" -X POST "${BASE_URL}/api/auth/verify-email" \
  -H 'Content-Type: application/json' \
  -d "{\"token\":\"${NEW_VERIFY_TOKEN}\"}" >/dev/null

echo "Smoke test account deletion"
DELETE_RESPONSE="$(curl -fsS -b "${TMP_DIR}/final-cookies.txt" -X DELETE "${BASE_URL}/api/account" \
  -H 'Content-Type: application/json' \
  -d "{\"password\":\"${NEW_PASSWORD}\"}")"
DELETED_STATE="$(json_value "${DELETE_RESPONSE}" deleted)"
if [[ "${DELETED_STATE}" != "true" ]]; then
  echo "Expected delete-account response to confirm deletion" >&2
  exit 1
fi

echo "Auth smoke test passed"
