#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ROOT_DIR}/.env.e2e"
EXAMPLE_FILE="${ROOT_DIR}/.env.e2e.example"

random_hex() {
  openssl rand -hex "${1}"
}

replace_in_file() {
  local key="$1"
  local value="$2"
  local file="$3"

  if [[ "$(uname)" == "Darwin" ]]; then
    sed -i '' "s|^${key}=.*|${key}=${value}|" "${file}"
  else
    sed -i "s|^${key}=.*|${key}=${value}|" "${file}"
  fi
}

if [[ ! -f "${EXAMPLE_FILE}" ]]; then
  echo "Missing ${EXAMPLE_FILE}" >&2
  exit 1
fi

if [[ ! -f "${ENV_FILE}" ]]; then
  cp "${EXAMPLE_FILE}" "${ENV_FILE}"
fi

if grep -q '__CHANGE_ME__' "${ENV_FILE}"; then
  replace_in_file "E2E_POSTGRES_PASSWORD" "$(random_hex 16)" "${ENV_FILE}"
  replace_in_file "E2E_JWT_SECRET" "$(random_hex 32)" "${ENV_FILE}"
  replace_in_file "E2E_JWT_REFRESH_SECRET" "$(random_hex 32)" "${ENV_FILE}"
  replace_in_file "E2E_ENCRYPTION_KEY" "$(random_hex 32)" "${ENV_FILE}"
  replace_in_file "E2E_PASSWORD" "E2e!$(random_hex 12)Aa1" "${ENV_FILE}"
fi
