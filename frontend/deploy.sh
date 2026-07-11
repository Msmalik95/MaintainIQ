#!/usr/bin/env bash
set -euo pipefail

npm install
npm run build

dist_dir="dist"
if [ -d "$dist_dir" ]; then
  echo "Frontend build generated at $dist_dir"
fi
