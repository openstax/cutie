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
all_packages=$(npm query .workspace | node -e "process.stdout.write(JSON.parse(require('fs').readFileSync('/dev/stdin').toString()).map(pkg => pkg.name).join(' '))")
remaining_packages=$(echo "${build_order[@]}" "$all_packages" | tr ' ' '\n' | sort | uniq -u)

# build em
for package in "${build_order[@]}" $remaining_packages; do
  echo "building $package ..."
  npm run build:clean --workspace "$package"
done
