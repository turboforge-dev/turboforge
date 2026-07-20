# Commit Message Rules

When asked to generate a commit message, you MUST follow these rules.

## Context
- Generate commit based on `git diff --cached`
- Check the `git log` if needed to get the context of the changes.
- If no files are staged, inform the user and ask them to stage files.
- Ignore package lock files such as pnpm-lock.yaml, package-lock.json etc.

## Format
Your response must be in the following format:

```
<type>(<scope>): <title>

[optional body]

[optional footer]
```

### Guidelines
- **Title**: Imperative mood (e.g., "add" not "added"), under 72 chars.
- **Body**: Detailed explanation if needed, wrapped at 72 chars.
- **Footer**: For breaking changes or closing issues.
- **Ignore**: Do not read package lock files such as yarn.lock, pnpm-lock.yaml, package-lock.json etc.
