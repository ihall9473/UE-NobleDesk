#!/usr/bin/env bash
# Talks to Vercel's REST API directly with a project-scoped token.
# The `vercel` CLI itself doesn't work with project-scoped tokens (it
# checks account-wide identity before running almost any command), but
# the REST API works fine as long as every request includes ?teamId=.
#
# Reads VERCEL_TOKEN / VERCEL_PROJECT_ID / VERCEL_TEAM_ID from
# .env.vercel.local (gitignored - never commit that file).
#
# Usage:
#   scripts/vercel.sh info                 project settings summary
#   scripts/vercel.sh deployments [N]      last N deployments (default 5)
#   scripts/vercel.sh env                  list env var names/targets (not values)
#   scripts/vercel.sh domains              list assigned domains

set -euo pipefail
cd "$(dirname "$0")/.."

if [ -f .env.vercel.local ]; then
  set -a
  source .env.vercel.local
  set +a
fi

: "${VERCEL_TOKEN:?Set VERCEL_TOKEN in .env.vercel.local}"
: "${VERCEL_PROJECT_ID:?Set VERCEL_PROJECT_ID in .env.vercel.local}"
: "${VERCEL_TEAM_ID:?Set VERCEL_TEAM_ID in .env.vercel.local}"

api() {
  local path="$1"
  curl -sS "https://api.vercel.com${path}" \
    -H "Authorization: Bearer ${VERCEL_TOKEN}"
}

cmd="${1:-info}"

case "$cmd" in
  info)
    api "/v9/projects/${VERCEL_PROJECT_ID}?teamId=${VERCEL_TEAM_ID}" \
      | python3 -c "
import json, sys
d = json.load(sys.stdin)
print('name:', d.get('name'))
print('framework:', d.get('framework'))
t = d.get('targets', {}).get('production', {})
print('production readyState:', t.get('readyState'), t.get('readySubstate'))
print('production url:', (t.get('alias') or [None])[0])
print('production commit:', t.get('meta', {}).get('githubCommitSha'))
"
    ;;
  deployments)
    n="${2:-5}"
    api "/v6/deployments?projectId=${VERCEL_PROJECT_ID}&teamId=${VERCEL_TEAM_ID}&limit=${n}" \
      | python3 -c "
import json, sys
d = json.load(sys.stdin)
for dep in d.get('deployments', []):
    print(f\"{dep.get('created')}  {dep.get('state'):10}  {dep.get('target') or 'preview':10}  {dep.get('meta', {}).get('githubCommitSha', '')[:7]:8}  {dep.get('url')}\")
"
    ;;
  env)
    api "/v9/projects/${VERCEL_PROJECT_ID}/env?teamId=${VERCEL_TEAM_ID}" \
      | python3 -c "
import json, sys
d = json.load(sys.stdin)
for e in sorted(d.get('envs', []), key=lambda x: x.get('key','')):
    print(f\"{e.get('key'):32} target={','.join(e.get('target', []))}\")
"
    ;;
  domains)
    api "/v9/projects/${VERCEL_PROJECT_ID}/domains?teamId=${VERCEL_TEAM_ID}" \
      | python3 -c "
import json, sys
d = json.load(sys.stdin)
for dom in d.get('domains', []):
    print(dom.get('name'), '-', 'verified' if dom.get('verified') else 'unverified')
"
    ;;
  *)
    echo "Unknown command: $cmd" >&2
    echo "Usage: $0 {info|deployments [N]|env|domains}" >&2
    exit 1
    ;;
esac
