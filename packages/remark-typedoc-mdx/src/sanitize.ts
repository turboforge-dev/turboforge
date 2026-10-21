/**
 * Sanitizes unquoted and unfenced curly braces in Markdown/MDX content.
 *
 * In MDX, unquoted curly braces (e.g. `{alt || "fallback"}` from TypeDoc JSDoc comments)
 * are treated as live JavaScript expressions by the MDX compiler. When undeclared variables
 * are encountered during Next.js SSG prerendering, it throws ReferenceError and halts the build.
 *
 * This function escapes unescaped `{` and `}` in plain text while strictly preserving:
 * 1. Fenced code blocks (``` ... ``` and ~~~ ... ~~~)
 * 2. Inline code spans (` ... ` and `` ... ``)
 * 3. Pre-existing escaped curly braces (\{ and \})
 */
export function sanitizeMdxCurlyBraces(content: string): string {
  // Split by fenced code blocks (``` or ~~~)
  const codeBlockRegex = /(```[\s\S]*?```|~~~[\s\S]*?~~~)/g;
  const parts = content.split(codeBlockRegex);

  return parts
    .map((part, index) => {
      // Odd indices are fenced code blocks - preserve as-is
      if (index % 2 === 1) {
        return part;
      }

      // Split non-fenced content by inline code spans (`+[\s\S]*?`+)
      const inlineCodeRegex = /(`+[\s\S]*?`+)/g;
      const subParts = part.split(inlineCodeRegex);

      return subParts
        .map((subPart, subIndex) => {
          // Odd indices are inline code - preserve as-is
          if (subIndex % 2 === 1) {
            return subPart;
          }

          // In plain text, escape unescaped { and }
          return subPart
            .replace(/(?<!\\)\{/g, "\\{")
            .replace(/(?<!\\)\}/g, "\\}");
        })
        .join("");
    })
    .join("");
}
