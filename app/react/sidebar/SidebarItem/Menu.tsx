import { useCurrentStateAndParams } from '@uirouter/react';
import {
  Children,
  PropsWithChildren,
  ReactNode,
  useMemo,
  useReducer,
} from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

import { useSidebarState } from '../useSidebarState';

import { getPaths } from './utils';

interface Props {
  head: ReactNode;
  openOnPaths?: string[];
}

export function Menu({
  children,
  head,
  openOnPaths = [],
}: PropsWithChildren<Props>) {
  const { isOpen: isSidebarOpen } = useSidebarState();

  const paths = useMemo(
    () => [...getPaths(head, []), ...openOnPaths],
    [openOnPaths, head]
  );

  const { isOpen, toggleOpen } = useIsOpen(isSidebarOpen, paths);

  const CollapseButtonIcon = isOpen ? ChevronUp : ChevronDown;

  if (!isSidebarOpen) {
    return head as JSX.Element;
  }

  return (
    <div className="flex-1">
      <div className="relative flex w-full items-center justify-between ">
        {head}
        {isSidebarOpen && Children.count(children) > 0 && (
          <button
            className="absolute right-2 flex h-6 w-6 items-center justify-center border-0 bg-transparent text-gray-5"
            onClick={handleClickArrow}
            type="button"
            aria-label="Collapse button"
          >
            <CollapseButtonIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      {isOpen && <ul className="!pl-11">{children}</ul>}
    </div>
  );

  function handleClickArrow(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    toggleOpen();
  }
}

function useIsOpen(
  isSidebarOpen: boolean,

  paths: string[] = []
) {
  const { state } = useCurrentStateAndParams();
  const currentStateName = state.name || '';
  const isOpenByState = paths.some((path) => currentStateName.startsWith(path));

  const [forceOpen, toggleForceOpen] = useReducer((state) => !state, false);

  const isOpen = checkIfOpen();

  return { isOpen, toggleOpen };

  function toggleOpen() {
    if (!isOpenByState) {
      toggleForceOpen();
    }
  }

  function checkIfOpen() {
    if (!isSidebarOpen) {
      return false;
    }

    if (forceOpen) {
      return true;
    }

    return isOpenByState;
  }
}
