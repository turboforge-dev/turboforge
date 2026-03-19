import { createMDX } from "fumadocs-mdx/next";

/** Detect GitHub Actions */
const isGitHubActions = process.env.GITHUB_ACTIONS === "true";

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  ...(isGitHubActions && {
    // basePath: "/turboforge", // we are publishing to https://turboforge.js.org/ -- so remove basePath
    output: "export",
  }),
};

export default withMDX(config);
