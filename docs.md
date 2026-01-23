### **The Prompt for Antigravity**

> **Role:** Senior DevOps & Documentation Architect
> **Goal:** Initialize a high-performance documentation workspace using **Fumadocs** and **TypeDoc** with auto-generated API references and versioning.
> **Technical Stack & Constraints:**
> * **Package Manager:** Strictly use `pnpm` with a monorepo workspace structure.
> * **Framework:** Fumadocs (Next.js based).
> * **API Engine:** TypeDoc with `typedoc-plugin-markdown` and `fumadocs-docgen` (or `typedoc-plugin-fumadocs`).
> * **Styling:** Tailwind CSS with native Dark/Light mode support.
> 
> 
> **Architectural Requirements:**
> 1. **Auto-Generation:** Configure a pre-build script that runs TypeDoc to scan the `src` directory and output MDX files into the Fumadocs content folder.
> 2. **Versioning Strategy:** Implement directory-based versioning.
> * Current version: `content/docs/v1/...`
> * Archives: `content/docs/v0/...`
> * Setup Fumadocs `source` configuration to handle these as distinct collections or use a version switcher component in the UI.
> 
> 
> 3. **Content Structure:**
> * `/docs/guides`: Manual MDX files for tutorials and conceptual guides.
> * `/docs/api`: Auto-generated API reference folder.
> 
> 
> 4. **Plugins:** >    - Include `typedoc-plugin-markdown` for MDX compatibility.
> * Include `typedoc-plugin-frontmatter` to inject necessary Fumadocs metadata (title, description) into generated files.
> * Setup `fumadocs-typescript` for interactive "Auto Type Tables" in manual guides.
> 
> 
> 
> 
> **Task:** Provide the `pnpm-workspace.yaml`, the `package.json` scripts, the `typedoc.json` configuration, and the Fumadocs `source.ts` logic to tie it all together.

---

### **What else to consider?**

For a "top-notch" OSS experience, precision in the "boring" details is what separates good from great:

* **Breadcrumbs & Pagination:** Ensure the auto-generated API docs support nested breadcrumbs. Navigating `Namespace > Class > Method` should feel native.
* **Search Integration:** Use **Orama** or **Algolia**. For versioned docs, the search must be "version-aware" so users don't accidentally copy-paste code from a legacy API version.
* **Twoslash Integration:** Use `shiki-twoslash`. This allows users to hover over code snippets in your **Guides** to see type definitions—exactly like VS Code.
* **Edit This Page Button:** Every page (including auto-generated ones) should have a link to the GitHub source. For API docs, this should ideally link to the source `.ts` file, not the generated `.mdx`.
* **Last Updated Timestamp:** Vital for trust. Users need to know if the documentation is stale.
* **OG Image Generation:** Use `@vercel/og` or Fumadocs' built-in metadata support to auto-generate social share cards for every documentation page.
