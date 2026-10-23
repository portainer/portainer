import { Search, X } from 'lucide-react';
import { type ReactNode, forwardRef, useMemo, useRef, useState } from 'react';

import { pluralize } from '@/react/common/string-utils';

import { Button } from '@@/buttons';

import { filterToPattern } from '../form-components/FilePicker/utils';

import { globToRegex } from './utils';

interface Props {
  value: string;
  onChange: (value: string) => void;
  onCompletion: (pattern: string) => void;
  allFilePaths: string[];
  renderDropdown?: (paths: string[]) => ReactNode;
  openDropdownOnFocus?: boolean;
}

export const CommandPalette = forwardRef<HTMLInputElement, Props>(
  function CommandPalette(
    {
      value,
      onChange,
      onCompletion,
      allFilePaths,
      renderDropdown,
      openDropdownOnFocus = true,
    },
    forwardedRef
  ) {
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef<HTMLInputElement | null>(null);

    function setRefs(node: HTMLInputElement | null) {
      inputRef.current = node;
      if (typeof forwardedRef === 'function') {
        forwardedRef(node);
      } else if (forwardedRef) {
        // eslint-disable-next-line no-param-reassign
        forwardedRef.current = node;
      }
    }

    const filterTrimmed = value.trim();
    const filterActive = filterTrimmed.length > 0;

    const matchingPaths = useMemo(() => {
      if (openDropdownOnFocus && !isFocused) return [];
      if (!filterActive) return allFilePaths;
      const re = globToRegex(filterToPattern(filterTrimmed));
      return allFilePaths.filter((p) => re.test(p));
    }, [
      openDropdownOnFocus,
      isFocused,
      filterActive,
      allFilePaths,
      filterTrimmed,
    ]);

    return (
      <div className="relative z-10 flex min-h-[30px] flex-1 items-center gap-2">
        <Search
          size={14}
          className="shrink-0 text-gray-7 th-highcontrast:text-white th-dark:text-gray-5"
        />
        <input
          ref={setRefs}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && filterActive) handleAddExpression();
            if (e.key === 'Escape') {
              setIsFocused(false);
              inputRef.current?.blur();
              onChange('');
            }
          }}
          placeholder="Filter or add expression, e.g. *.yml, src/**/*.ts"
          className="flex-1 border-0 bg-transparent text-sm text-gray-11 outline-none placeholder:text-gray-6 th-highcontrast:text-white th-dark:text-white"
          data-cy="command-palette-search-input"
        />
        {filterActive && (
          <>
            <Button
              color="primary"
              onClick={() => handleAddExpression()}
              className="shrink-0 border-0 bg-transparent text-gray-7 hover:text-gray-11 th-highcontrast:text-white th-dark:text-gray-5"
              aria-label="Add expression"
              data-cy="command-palette-search-add-expression"
            >
              Add expression
            </Button>
            <span className="shrink-0 text-xs text-gray-7 th-highcontrast:text-gray-5 th-dark:text-gray-5">
              {matchingPaths.length}{' '}
              {pluralize(matchingPaths.length, 'match', 'matches')}
            </span>
          </>
        )}
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="shrink-0 border-0 bg-transparent text-gray-7 hover:text-gray-11 th-highcontrast:text-white th-dark:text-gray-5"
            aria-label="Clear search"
            data-cy="command-palette-search-clear-expression"
          >
            <X size={12} />
          </button>
        )}
        {(isFocused || !openDropdownOnFocus) &&
          (openDropdownOnFocus || filterActive) &&
          (renderDropdown
            ? renderDropdown(matchingPaths)
            : matchingPaths.length > 0 && (
                <ul
                  style={{ top: 'calc(100% + 8px)' }}
                  className="absolute -left-2 -right-2 z-10 max-h-48 overflow-y-auto rounded-b-md border border-solid border-gray-4 bg-white px-0 th-highcontrast:border-white th-highcontrast:bg-black th-dark:border-gray-7 th-dark:bg-gray-iron-10"
                >
                  {matchingPaths.map((path) => (
                    <li
                      key={path}
                      className="list-none px-3 py-1.5 font-mono text-xs text-gray-11 th-highcontrast:text-white th-dark:text-white"
                    >
                      /{path}
                    </li>
                  ))}
                </ul>
              ))}
      </div>
    );

    function handleAddExpression() {
      onCompletion(filterToPattern(filterTrimmed));
      setIsFocused(false);
      inputRef.current?.blur();
      onChange('');
    }
  }
);
