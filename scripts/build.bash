#!/usr/bin/env bash
# spell-checker: ignore pipefail
set -euo pipefail; if [ -n "${DEBUG-}" ]; then set -x; fi

project_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." >/dev/null 2>&1 && pwd )"

cd "$project_dir"

# packages that must be built before other ones (in this order)
build_order=( \
  "@openstax/cutie-core" \
)

# all other packages
all_packages=$(yarn --silent workspaces info | node -e "process.stdout.write(Object.keys(JSON.parse(require('fs').readFileSync('/dev/stdin').toString())).join(' '))")
remaining_packages=$(echo "${build_order[@]}" "$all_packages" | tr ' ' '\n' | sort | uniq -u)

# build em
for package in "${build_order[@]}" $remaining_packages; do
  echo "building $package ..."
  yarn workspace "$package" build:clean
done
