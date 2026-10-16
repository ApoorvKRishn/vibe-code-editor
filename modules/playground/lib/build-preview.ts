import { findFileByPath } from ".";
import type { TemplateFolder } from "./types";

/**
 * Turns the project's index.html into one self-contained HTML string for the
 * preview iframe: <link href="x.css"> and <script src="x.js"> tags that point
 * at project files are replaced with the files' contents inline.
 */
export function buildPreviewHtml(root: TemplateFolder): string | null {
  const indexFile = findFileByPath(root, "index.html");
  if (!indexFile) return null;

  const readFile = (path: string) => findFileByPath(root, path.replace(/^\.?\//, ""))?.content;

  return indexFile.content
    .replace(/<link[^>]*href=["']([^"']+\.css)["'][^>]*>/gi, (tag, href) => {
      const css = readFile(href);
      return css === undefined ? tag : `<style>\n${css}\n</style>`;
    })
    .replace(/<script([^>]*)src=["']([^"']+\.js)["']([^>]*)><\/script>/gi, (tag, before, src, after) => {
      const js = readFile(src);
      // Escape "</script" so file contents can't close the tag early.
      return js === undefined
        ? tag
        : `<script${before}${after}>\n${js.replace(/<\/script/gi, "<\\/script")}\n</script>`;
    });
}
