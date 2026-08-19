import { Directory, FileNode } from './types';

export function isDirectory(node: FileNode): node is Directory {
  return 'children' in node;
}

export function isDirectoryWithChildren(
  item: FileNode
): item is Required<Directory> {
  return isDirectory(item) && 'children' in item;
}

export function getAllFilePaths(item: FileNode, nodePath: string): string[] {
  if (!isDirectory(item)) {
    return [nodePath];
  }
  return (item.children ?? []).flatMap((child) =>
    getAllFilePaths(child, `${nodePath}/${child.name}`)
  );
}

export function getFolderState(
  item: Directory,
  selected: Set<string>,
  nodePath: string
): 'checked' | 'indeterminate' | 'unchecked' {
  const filePaths = getAllFilePaths(item, nodePath);
  if (filePaths.length === 0) return 'unchecked';
  const selectedCount = filePaths.filter((p) => selected.has(p)).length;
  if (selectedCount === filePaths.length) return 'checked';
  if (selectedCount > 0) return 'indeterminate';
  return 'unchecked';
}

export function filterToPattern(text: string): string {
  const t = text.trim();
  if (/[*?]/.test(t)) return t;
  return `*${t}*`;
}

export function buildFileTree(filePaths: string[]): FileNode[] {
  // Root container to hold top-level nodes
  const root: Directory = { name: '', children: [] };

  for (const path of filePaths) {
    const parts = path.split('/').filter((p) => p.length > 0);
    let current: Directory = root;

    parts.forEach((part, index) => {
      const isLastPart = index === parts.length - 1;

      if (!current.children) {
        current.children = [];
      }

      let existingNode = current.children.find((node) => node.name === part);

      if (isLastPart) {
        if (!existingNode) {
          current.children.push({ name: part });
        }
      } else {
        if (!existingNode) {
          const newDir: Directory = { name: part, children: [] };
          current.children.push(newDir);
          existingNode = newDir;
        } else if (!isDirectory(existingNode)) {
          (existingNode as Directory).children = [];
        }
        current = existingNode as Directory;
      }
    });
  }

  return sortTree(root.children ?? []);
}

function sortTree(nodes: FileNode[]): FileNode[] {
  return nodes
    .toSorted((a, b) => {
      const aIsDir = isDirectory(a);
      const bIsDir = isDirectory(b);

      // Directories come before files
      if (aIsDir && !bIsDir) return -1;
      if (!aIsDir && bIsDir) return 1;

      // Otherwise, alphabetical (case-insensitive)
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    })
    .map((node) =>
      isDirectory(node) && node.children
        ? { ...node, children: sortTree(node.children) }
        : node
    );
}
