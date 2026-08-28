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
#   scripts/vercel.sh info                        project settings summary
#   scripts/vercel.sh deployments [N]              last N deployments (default 5)
#   scripts/vercel.sh env                          list env var names/targets (not values)
#   scripts/vercel.sh domains                      list assigned domains
#   scripts/vercel.sh set-env KEY VALUE [targets]  create or update an env var
#                                                   (targets default: production,preview)
#   scripts/vercel.sh delete-env KEY               remove an env var
#   scripts/vercel.sh redeploy                      trigger a rebuild of the current
#                                                   main branch via a deploy hook

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
  local method="$1" path="$2" body="${3:-}"
  if [ -n "$body" ]; then
    curl -sS -X "$method" "https://api.vercel.com${path}" \
      -H "Authorization: Bearer ${VERCEL_TOKEN}" \
      -H "Content-Type: application/json" \
      -d "$body"
  else
    curl -sS -X "$method" "https://api.vercel.com${path}" \
      -H "Authorization: Bearer ${VERCEL_TOKEN}"
  fi
}

cmd="${1:-info}"

case "$cmd" in
  info)
    api GET "/v9/projects/${VERCEL_PROJECT_ID}?teamId=${VERCEL_TEAM_ID}" \
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
    api GET "/v6/deployments?projectId=${VERCEL_PROJECT_ID}&teamId=${VERCEL_TEAM_ID}&limit=${n}" \
      | python3 -c "
import json, sys
d = json.load(sys.stdin)
for dep in d.get('deployments', []):
    print(f\"{dep.get('created')}  {dep.get('state'):10}  {dep.get('target') or 'preview':10}  {dep.get('meta', {}).get('githubCommitSha', '')[:7]:8}  {dep.get('url')}\")
"
    ;;
  env)
    api GET "/v9/projects/${VERCEL_PROJECT_ID}/env?teamId=${VERCEL_TEAM_ID}" \
      | python3 -c "
import json, sys
d = json.load(sys.stdin)
for e in sorted(d.get('envs', []), key=lambda x: x.get('key','')):
    print(f\"{e.get('key'):32} target={','.join(e.get('target', []))}\")
"
    ;;
  domains)
    api GET "/v9/projects/${VERCEL_PROJECT_ID}/domains?teamId=${VERCEL_TEAM_ID}" \
      | python3 -c "
import json, sys
d = json.load(sys.stdin)
for dom in d.get('domains', []):
    print(dom.get('name'), '-', 'verified' if dom.get('verified') else 'unverified')
"
    ;;
  set-env)
    key="${2:?Usage: $0 set-env KEY VALUE [target1,target2]}"
    value="${3:?Usage: $0 set-env KEY VALUE [target1,target2]}"
    targets="${4:-production,preview}"
    targets_json=$(python3 -c "import json,sys; print(json.dumps(sys.argv[1].split(',')))" "$targets")

    # Find an existing env var with this key so we update it instead of
    # creating a duplicate (Vercel allows multiple envs with the same key
    # across different targets, which gets confusing fast).
    existing_id=$(api GET "/v9/projects/${VERCEL_PROJECT_ID}/env?teamId=${VERCEL_TEAM_ID}" \
      | python3 -c "
import json, sys
d = json.load(sys.stdin)
for e in d.get('envs', []):
    if e.get('key') == '$key':
        print(e.get('id'))
        break
")

    body=$(python3 -c "
import json, sys
print(json.dumps({'key': sys.argv[1], 'value': sys.argv[2], 'type': 'encrypted', 'target': json.loads(sys.argv[3])}))
" "$key" "$value" "$targets_json")

    if [ -n "$existing_id" ]; then
      result=$(api PATCH "/v10/projects/${VERCEL_PROJECT_ID}/env/${existing_id}?teamId=${VERCEL_TEAM_ID}" "$body")
      action="updated"
    else
      result=$(api POST "/v10/projects/${VERCEL_PROJECT_ID}/env?teamId=${VERCEL_TEAM_ID}" "$body")
      action="created"
    fi

    echo "$result" | python3 -c "
import json, sys
d = json.load(sys.stdin)
if 'error' in d:
    print('Error:', d['error'].get('message'))
    sys.exit(1)
print(f\"$action $key (target: $targets)\")
"
    ;;
  delete-env)
    key="${2:?Usage: $0 delete-env KEY}"
    existing_id=$(api GET "/v9/projects/${VERCEL_PROJECT_ID}/env?teamId=${VERCEL_TEAM_ID}" \
      | python3 -c "
import json, sys
d = json.load(sys.stdin)
for e in d.get('envs', []):
    if e.get('key') == '$key':
        print(e.get('id'))
        break
")
    if [ -z "$existing_id" ]; then
      echo "No env var named $key found." >&2
      exit 1
    fi
    api DELETE "/v9/projects/${VERCEL_PROJECT_ID}/env/${existing_id}?teamId=${VERCEL_TEAM_ID}" > /dev/null
    echo "Deleted $key"
    ;;
  redeploy)
    if [ -z "${VERCEL_DEPLOY_HOOK_URL:-}" ]; then
      echo "No VERCEL_DEPLOY_HOOK_URL set in .env.vercel.local - create a deploy hook first." >&2
      exit 1
    fi
    curl -sS -X POST "$VERCEL_DEPLOY_HOOK_URL" | python3 -c "
import json, sys
d = json.load(sys.stdin)
print('Triggered deployment:', d.get('job', {}).get('id', d))
"
    ;;
  *)
    echo "Unknown command: $cmd" >&2
    echo "Usage: $0 {info|deployments [N]|env|domains|set-env KEY VALUE [targets]|delete-env KEY|redeploy}" >&2
    exit 1
    ;;
esac
