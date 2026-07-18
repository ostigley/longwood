#!/usr/bin/env bash
set -euo pipefail

# Last manually-deployed gh-pages commit, immediately before the
# Handlebars/YAML migration's automated deploys began (PR #1).
SAFE_COMMIT="af79b53"

if [[ "${1:-}" != "-y" ]]; then
  echo "This force-pushes gh-pages back to ${SAFE_COMMIT}, discarding any deploys after it."
  read -r -p "Continue? [y/N] " reply
  [[ "$reply" =~ ^[Yy]$ ]] || { echo "Aborted."; exit 1; }
fi

git fetch origin gh-pages
current_branch="$(git rev-parse --abbrev-ref HEAD)"

git checkout gh-pages
git reset --hard "$SAFE_COMMIT"
git push --force-with-lease origin gh-pages

git checkout "$current_branch"

echo "gh-pages rolled back to $(git rev-parse --short "$SAFE_COMMIT")."
echo "Note: this only fixes the live site. If the bad change is still on main,"
echo "the next push to main will redeploy it — revert the offending commit on"
echo "main too for a durable fix."
