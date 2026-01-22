#!/usr/bin/env bash
# spell-checker: ignore pipefail yargs mkdir withoutspecs
set -euo pipefail; if [ -n "${DEBUG-}" ]; then set -x; fi

project_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." >/dev/null 2>&1 && pwd )"

cd "$project_dir";

tsc_args=(--noEmit false --declaration)

mkdir -p dist

yarn -s tsc --project tsconfig.without-specs.esm.json "${tsc_args[@]}"
yarn -s tsc --project tsconfig.without-specs.cjs.json "${tsc_args[@]}"
