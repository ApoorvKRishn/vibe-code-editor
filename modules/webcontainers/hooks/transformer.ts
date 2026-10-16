import type { FileSystemTree } from "@webcontainer/api";
import type {
  TemplateFolder,
  TemplateItem,
} from "@/modules/playground/lib/path-to-json";
import { getItemName } from "@/modules/playground/lib";

export function transformToWebContainerFormat(
  template: TemplateFolder
): FileSystemTree {
  const toTree = (items: TemplateItem[]): FileSystemTree => {
    const tree: FileSystemTree = {};
    for (const item of items) {
      tree[getItemName(item)] =
        "folderName" in item
          ? { directory: toTree(item.items) }
          : { file: { contents: item.content ?? "" } };
    }
    return tree;
  };

  return toTree(template.items);
}
