import { useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

import { pluralize } from '@/react/common/string-utils';

import { Button } from '@@/buttons/Button';
import { Directory, File, FileNode } from '@@/form-components/FilePicker/types';
import { CommandPalette } from '@@/CommandPalette/CommandPalette';
import { globToRegex } from '@@/CommandPalette/utils';
import { Widget } from '@@/Widget';

import { isDirectory, getAllFilePaths, getFolderState } from './utils';
import { TreeNode } from './TreeNode';
import { SelectedPanel } from './SelectedPanel';

interface Props {
  files: FileNode[];
  /* array of file paths that have been selected */
  value: string[];
  onChange: (filePaths: string[]) => void;
  exampleExpressions?: string[];
}

export function FilePicker({
  files,
  value,
  onChange,
  exampleExpressions = ['*.yml', 'src/**', '**/dist/*'],
}: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set([]));
  const selected = useMemo(
    () => new Set(value.map((p) => (p.startsWith('/') ? p.slice(1) : p))),
    [value]
  );
  const [filter, setFilter] = useState('');
  const treeAreaRef = useRef<HTMLDivElement>(null);
  const commandPaletteRef = useRef<HTMLInputElement>(null);

  const allFilePaths = useMemo(
    () => files.flatMap((file) => getAllFilePaths(file, file.name)),
    [files]
  );

  return (
    <Widget>
      <div className="flex flex-col border-b border-l-0 border-r-0 border-t-0 border-solid border-gray-4 px-3 py-2 th-highcontrast:border-white th-dark:border-gray-7">
        <p>
          Browse files, select individually, or use wildcard expressions.
          Contains {allFilePaths.length}{' '}
          {pluralize(allFilePaths.length, 'file')}. Try patterns like:
        </p>
        <div className="flex gap-1">
          {exampleExpressions.map((pattern, index) => {
            return (
              <Button
                key={`example-${index}`}
                color="none"
                className="!th-highcontrast:bg-gray-9 !th-highcontrast:text-gray-3 !th-dark:bg-gray-9 !th-dark:text-gray-3 !bg-gray-3 !p-2 font-mono !text-gray-9"
                onClick={() => {
                  setFilter(pattern);
                  commandPaletteRef.current?.focus();
                }}
                data-cy={`example-${index}-button`}
              >
                {pattern}
              </Button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-2 border-b border-l-0 border-r-0 border-t-0 border-solid border-gray-4 px-3 py-2 th-highcontrast:border-white th-dark:border-gray-7">
        <CommandPalette
          ref={commandPaletteRef}
          value={filter}
          onChange={setFilter}
          onCompletion={addExpression}
          allFilePaths={allFilePaths}
          openDropdownOnFocus={false}
          renderDropdown={renderDropdown}
        />
      </div>

      <div ref={treeAreaRef} className="flex h-80 overflow-hidden">
        {allFilePaths.length === 0 && (
          <p className="w-full px-3 py-4 text-center text-xs text-gray-6 th-highcontrast:text-gray-5 th-dark:text-gray-5">
            No files available
          </p>
        )}
        {!filter.trim() && (
          <>
            <div className="min-w-0 flex-1 overflow-y-auto">
              {files.map((file) => (
                <TreeNode
                  key={file.name}
                  item={file}
                  depth={0}
                  expanded={expanded}
                  selected={selected}
                  nodePath={file.name}
                  onExpandDirectory={toggleDirectory}
                  onToggleSelect={toggleSelect}
                />
              ))}
            </div>

            <div className="flex w-80 shrink-0 flex-col border-b-0 border-l border-r-0 border-t-0 border-solid border-gray-4 th-highcontrast:border-white th-dark:border-gray-7">
              <SelectedPanel selected={selected} removeFile={removeFile} />
            </div>
          </>
        )}
      </div>

      <div className="flex items-center justify-between border-b-0 border-l-0 border-r-0 border-t border-solid border-gray-4 px-3 py-2 th-highcontrast:border-white th-dark:border-gray-7">
        <span className="text-xs text-gray-6 th-highcontrast:text-white th-dark:text-gray-5">
          {selected.size} selected
        </span>
        <Button
          color="default"
          size="small"
          onClick={() => onChange([])}
          data-cy="file-picker-clear"
        >
          Clear
        </Button>
      </div>
    </Widget>
  );

  function renderDropdown(paths: string[]): ReactNode {
    if (!treeAreaRef.current) return null;
    return createPortal(
      paths.length === 0 ? (
        <p className="px-3 py-4 text-center text-xs text-gray-6 th-highcontrast:text-gray-5 th-dark:text-gray-5">
          No matching files
        </p>
      ) : (
        <ul className="h-full w-full overflow-y-auto px-1">
          {paths.map((path) => (
            <li key={path} className="flex h-8 list-none items-center px-3">
              <span className="truncate font-mono text-[13px] text-gray-11 th-highcontrast:text-white th-dark:text-white">
                /{path}
              </span>
            </li>
          ))}
        </ul>
      ),
      treeAreaRef.current
    );
  }

  function handleChange(next: Set<string>) {
    onChange(
      Array.from(next)
        .map((f) => `/${f}`)
        .sort()
    );
  }

  function toggleDirectory(path: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }

  function toggleSelect(path: string, item: Directory | File) {
    if (!isDirectory(item)) {
      const next = new Set(selected);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      handleChange(next);
      return;
    }

    const filePaths = getAllFilePaths(item, path);
    const state = getFolderState(item, selected, path);
    const next = new Set(selected);
    if (state === 'checked') {
      filePaths.forEach((p) => next.delete(p));
    } else {
      filePaths.forEach((p) => next.add(p));
    }
    handleChange(next);
  }

  function removeFile(path: string) {
    const next = new Set(selected);
    next.delete(path);
    handleChange(next);
  }

  function addExpression(pattern: string) {
    const re = globToRegex(pattern);
    const matchedPaths = allFilePaths.filter((p) => re.test(p));
    handleChange(new Set([...selected, ...matchedPaths]));
  }
}
