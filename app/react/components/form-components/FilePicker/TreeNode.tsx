import { useRef } from 'react';
import { slugify } from 'markdown-to-jsx';

import { CollapseExpandButton } from '@@/CollapseExpandButton';
import { Checkbox } from '@@/form-components/Checkbox';

import { isDirectory, getFolderState, isDirectoryWithChildren } from './utils';
import { TreeNodeIcon } from './TreeNodeIcon';
import { FileNode } from './types';

const INDENT_PX = 16;
const DOUBLE_CLICK_DELAY_MS = 250;

interface Props {
  item: FileNode;
  depth: number;
  expanded: Set<string>;
  selected: Set<string>;
  nodePath: string;
  onExpandDirectory: (path: string) => void;
  onToggleSelect: (path: string, item: FileNode) => void;
}

export function TreeNode({
  item,
  depth,
  expanded,
  selected,
  nodePath,
  onExpandDirectory,
  onToggleSelect,
}: Props) {
  const isDir = isDirectory(item);
  const hasSubDir = isDirectoryWithChildren(item);
  const isOpen = isDir && expanded.has(nodePath);
  const folderState = isDir ? getFolderState(item, selected, nodePath) : null;
  const isChecked = isDir ? folderState === 'checked' : selected.has(nodePath);
  const isIndeterminate = folderState === 'indeterminate';

  const checkboxId = slugify(`${nodePath}/${item.name}`);
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleRowClick() {
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
      if (isDir) {
        onExpandDirectory(nodePath);
      }
      return;
    }
    clickTimerRef.current = setTimeout(() => {
      clickTimerRef.current = null;
      onToggleSelect(nodePath, item);
    }, DOUBLE_CLICK_DELAY_MS);
  }

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        className="relative flex h-8 cursor-pointer select-none items-center gap-1 pr-2"
        style={{ paddingLeft: depth * INDENT_PX + 12 }}
        onClick={handleRowClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && isDir) onExpandDirectory(nodePath);
          if (e.key === 'Space') onToggleSelect(nodePath, item);
        }}
      >
        {isDir ? (
          <CollapseExpandButton
            quarterRotation
            isExpanded={isOpen}
            onClick={() => onExpandDirectory(nodePath)}
          />
        ) : (
          <span className="w-[22px] shrink-0" />
        )}
        <Checkbox
          id={checkboxId}
          data-cy={checkboxId}
          checked={isChecked}
          indeterminate={isIndeterminate}
          onChange={() => onToggleSelect(nodePath, item)}
          onClick={(e) => e.stopPropagation()}
          aria-labelledby={`${checkboxId}-label`}
        />
        <TreeNodeIcon node={item} />
        <span
          id={`${checkboxId}-label`}
          className="flex-1 truncate text-sm text-gray-11 th-highcontrast:text-white th-dark:text-white"
          title={item.name}
        >
          {item.name}
        </span>
      </div>

      {isOpen &&
        hasSubDir &&
        item.children.map((child, index) => (
          <TreeNode
            key={`${nodePath}/${child.name}/${index}`}
            item={child}
            depth={depth + 1}
            expanded={expanded}
            selected={selected}
            nodePath={`${nodePath}/${child.name}`}
            onExpandDirectory={onExpandDirectory}
            onToggleSelect={onToggleSelect}
          />
        ))}
    </>
  );
}
