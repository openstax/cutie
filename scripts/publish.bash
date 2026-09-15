#!/usr/bin/env bash
# spell-checker: ignore pipefail
set -euo pipefail; if [ -n "${DEBUG-}" ]; then set -x; fi

project_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." >/dev/null 2>&1 && pwd )"

cd "$project_dir"

npm ci

if [ -n "$(git status --porcelain=v1 2>/dev/null)" ]; then
  echo "please stash, commit, gitignore, or reset your changes before publishing" > /dev/stderr
  exit 1
fi

packages=( \
  "cutie-core" \
  "cutie-client" \
  "cutie-editor" \
)

for package in "${packages[@]}"; do
  cd "$project_dir/packages/$package"
  name=$(node -e "process.stdout.write(JSON.parse(require('fs').readFileSync('/dev/stdin').toString()).name)" < package.json)
  version=$(node -e "process.stdout.write(JSON.parse(require('fs').readFileSync('/dev/stdin').toString()).version)" < package.json)

  echo "building $name@$version ..."
  npm run build:clean
  npm publish
done
