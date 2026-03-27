#!/usr/bin/env bash
set -euo pipefail

WS_URL="${1:-ws://localhost:8080}"
HTTP_TARGET="${2:-http://localhost:8080}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STAMP="$(date +%Y%m%d-%H%M%S)"
RESULT_DIR="${SCRIPT_DIR}/results/${STAMP}"
RESULT_JSON="${RESULT_DIR}/artillery-result.json"
REPORT_HTML="${RESULT_DIR}/artillery-report.html"

mkdir -p "${RESULT_DIR}"
touch "${RESULT_JSON}"

echo "==> WebSocket target: ${WS_URL}"
echo "==> HTTP target: ${HTTP_TARGET}"
echo "==> Result dir: ${RESULT_DIR}"

echo "==> Health check..."
curl -fsS "${HTTP_TARGET}/health" >/dev/null

echo "==> Running Artillery test..."
ARTILLERY_WS_URL="${WS_URL}" ARTILLERY_HTTP_TARGET="${HTTP_TARGET}" \
  npm exec --yes --package=artillery artillery run "${SCRIPT_DIR}/websocket-load-test.yml" --output "${RESULT_JSON}"

echo "==> Generating HTML report..."
npm exec --yes --package=artillery artillery report "${RESULT_JSON}" --output "${REPORT_HTML}"

echo "==> Done."
echo "JSON: ${RESULT_JSON}"
echo "HTML: ${REPORT_HTML}"
