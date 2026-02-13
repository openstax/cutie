#!/usr/bin/env bash
# spell-checker: ignore pipefail mktemp pids
set -euo pipefail; if [ -n "${DEBUG-}" ]; then set -x; fi

project_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." >/dev/null 2>&1 && pwd )"

cd "$project_dir"

# defaults
host=""
concurrency=2
flow_filter=""

# parse args
while [[ $# -gt 0 ]]; do
  case "$1" in
    --host)
      host="$2"
      shift 2
      ;;
    --concurrency)
      concurrency="$2"
      shift 2
      ;;
    --flow)
      flow_filter="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1" >&2
      echo "Usage: $0 --host <url> [--concurrency <n>] [--flow <name>]" >&2
      exit 1
      ;;
  esac
done

if [ -z "$host" ]; then
  echo "Error: --host <url> is required" >&2
  echo "Usage: $0 --host <url> [--concurrency <n>] [--flow <name>]" >&2
  exit 1
fi

# discover test flows
if [ -n "$flow_filter" ]; then
  flow_files=("docs/test-flows/${flow_filter}.md")
  if [ ! -f "${flow_files[0]}" ]; then
    echo "Error: flow file not found: ${flow_files[0]}" >&2
    exit 1
  fi
else
  flow_files=(docs/test-flows/*.md)
  if [ ${#flow_files[@]} -eq 0 ]; then
    echo "Error: no test flows found in docs/test-flows/" >&2
    exit 1
  fi
fi

echo "Running ${#flow_files[@]} test flow(s) with concurrency $concurrency"
echo "Host: $host"
echo ""

# set up results directory
results_dir=$(mktemp -d)
trap 'rm -rf "$results_dir"' EXIT

# track pids and their associated flow names
declare -A pid_to_flow
running=0
any_failed=0

for flow_file in "${flow_files[@]}"; do
  flow_name=$(basename "$flow_file" .md)

  # wait for a slot if at concurrency limit
  while [ "$running" -ge "$concurrency" ]; do
    # wait for any child to finish; capture exit status directly
    finished_pid=""
    if wait -n -p finished_pid; then
      echo "PASS: ${pid_to_flow[$finished_pid]}"
    else
      echo "FAIL: ${pid_to_flow[$finished_pid]}"
      any_failed=1
    fi
    unset "pid_to_flow[$finished_pid]"
    running=$((running - 1))
  done

  echo "Starting: $flow_name"

  # run claude agent in background, capture output to file
  claude --agent manual-test --print \
    "Run the test flow $flow_file against $host" \
    > "$results_dir/$flow_name.txt" 2>&1 &

  pid=$!
  pid_to_flow[$pid]="$flow_name"
  running=$((running + 1))
done

# wait for remaining processes
for pid in "${!pid_to_flow[@]}"; do
  flow_name="${pid_to_flow[$pid]}"
  if wait "$pid"; then
    echo "PASS: $flow_name"
  else
    echo "FAIL: $flow_name"
    any_failed=1
  fi
done

# print results
echo ""
echo "========================================"
echo "  Results"
echo "========================================"

for flow_file in "${flow_files[@]}"; do
  flow_name=$(basename "$flow_file" .md)
  result_file="$results_dir/$flow_name.txt"

  echo ""
  echo "----------------------------------------"
  echo "  $flow_name"
  echo "----------------------------------------"
  echo ""

  if [ -f "$result_file" ]; then
    cat "$result_file"
  else
    echo "(no output)"
  fi
done

exit "$any_failed"
