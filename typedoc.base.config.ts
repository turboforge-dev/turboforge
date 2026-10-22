export default {
  plugin: ["typedoc-plugin-markdown"],
  readme: "none",
  entryFileName: "index.mdx",
  fileExtension: ".mdx",
  skipErrorChecking: true,
  sanitizeComments: true,
  excludePrivate: true,
  excludeInternal: true,
  entryPointStrategy: "resolve",
  gitRevision: "main",
};
