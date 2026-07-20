#!/bin/bash

# @file collect-git-context.sh
# @description Extracts staged changes, maps them to monorepo package scopes, 
# and calculates complexity metadata for the AI Agent.

# 1. Configuration & Pathspecs
# Using :(exclude) to ensure cross-platform compatibility and avoid "no such path" errors.
EXCLUSIONS=(
    ":(exclude)*-lock.json"
    ":(exclude)pnpm-lock.yaml"
    ":(exclude)node_modules"
    ":(exclude)dist"
    ":(exclude)build"
    ":(exclude).turbo"
    ":(exclude).forge-meta.json"
)

# 2. Scope Mapping Logic
declare -A SCOPE_MAP
ALL_SCOPES=()

# Find all package.json files to map directories to package names
while IFS= read -r pkg_json; do
    dir=$(dirname "$pkg_json" | sed 's|^\./||')
    # Extract package name and strip @org/ prefix
    name=$(jq -r '.name' "$pkg_json" 2>/dev/null)
    
    if [[ -n "$name" && "$name" != "null" ]]; then
        SCOPE_MAP["$dir"]="$name"
        ALL_SCOPES+=("$name")
    fi
done < <(find . -name "package.json" -not -path "*/node_modules/*")

# 3. Analyze Staged Files
STAGED_FILES=$(git diff --cached --name-only)
if [[ -z "$STAGED_FILES" ]]; then
    echo "STATUS:CLEAN"
    exit 0
fi

DETECTED_SCOPES=()
declare -A SCOPE_GROUPS

while read -r file; do
    matched_scope="none"
    current_dir=$(dirname "$file")
    
    # Recurse up directories to find the nearest package owner
    temp_dir="$current_dir"
    while [[ "$temp_dir" != "." && "$temp_dir" != "/" ]]; do
        if [[ -n "${SCOPE_MAP[$temp_dir]}" ]]; then
            matched_scope="${SCOPE_MAP[$temp_dir]}"
            break
        fi
        temp_dir=$(dirname "$temp_dir")
    done

    # Fallback for meta-files
    if [[ "$matched_scope" == "none" ]]; then
        if [[ "$file" =~ ^(\.github/|turbo\.json|scripts/|plopfile\.js) ]]; then
            matched_scope="tooling"
        fi
    fi

    DETECTED_SCOPES+=("$matched_scope")
    SCOPE_GROUPS["$matched_scope"]+="$file "
done <<< "$STAGED_FILES"

# 4. Gather Quantitative Metrics
STATS=$(git diff --cached --shortstat -- "${EXCLUSIONS[@]}" 2>/dev/null)
INSERTIONS=$(echo "$STATS" | grep -oE '[0-9]+ insertion' | awk '{print $1}')
[[ -z "$INSERTIONS" ]] && INSERTIONS=0
FILE_COUNT=$(echo "$STAGED_FILES" | wc -l | xargs)

# 5. Output Metadata for Antigravity Agent
UNIQUE_SCOPES=$(echo "${DETECTED_SCOPES[@]}" | tr ' ' '\n' | sort -u | tr '\n' ' ' | xargs)

echo "--- METADATA ---"
echo "FILE_COUNT: $FILE_COUNT"
echo "LOC_INSERTIONS: $INSERTIONS"
echo "DETECTED_SCOPES: $UNIQUE_SCOPES"
echo "--- SCOPE GROUPS ---"
for s in "${!SCOPE_GROUPS[@]}"; do
    echo "SCOPE[$s]: ${SCOPE_GROUPS[$s]}"
done
echo "--- DIFF CONTENT ---"
git diff --cached -- "${EXCLUSIONS[@]}"
