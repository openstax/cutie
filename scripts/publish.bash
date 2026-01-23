#!/usr/bin/env bash
# spell-checker: ignore pipefail
set -euo pipefail; if [ -n "${DEBUG-}" ]; then set -x; fi

project_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." >/dev/null 2>&1 && pwd )"

cd "$project_dir"

yarn --check-files

if [ -n "$(git status --porcelain=v1 2>/dev/null)" ]; then
  echo "please stash, commit, gitignore, or reset your changes before publishing" > /dev/stderr
  exit 1
fi

current_branch=$(git rev-parse --abbrev-ref HEAD)
date_key=$(date +%Y-%m-%d_%H-%M-%S)
release_branch_name="release-$date_key"

git checkout -b "$release_branch_name"

packages=( \
  "cuite-core" \
  "cutie-client" \
)

for package in "${packages[@]}"; do
  relative_package_dir="packages/flex-page-$package"
  package_dir="$project_dir/$relative_package_dir"
  cd "$package_dir";
  name=$(node -e "process.stdout.write(JSON.parse(require('fs').readFileSync('/dev/stdin').toString()).name)" < package.json)
  version=$(node -e "process.stdout.write(JSON.parse(require('fs').readFileSync('/dev/stdin').toString()).version)" < package.json)
  package_branch_name="$release_branch_name-$package"
  package_tag_name="$package-$version"

  if [ $(git tag -l "$package_tag_name") ]; then
    echo "package version $name@$version already exists, skipping."
  else
    echo "building $name@$version ..."
    yarn build:clean
    git add -f dist/
    git commit -m "adding dist files"

    cd "$project_dir";
    git subtree split -P $relative_package_dir -b "$package_branch_name"
    git checkout "$package_branch_name"
    git tag "$package_tag_name";
    git push origin tag "$package_tag_name"

    git checkout "$release_branch_name"
  fi
done

git checkout "$current_branch"
