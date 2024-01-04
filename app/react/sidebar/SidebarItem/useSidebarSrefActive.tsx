import {
  TransitionOptions,
  useCurrentStateAndParams,
  useSrefActive,
} from '@uirouter/react';

export type PathOptions = {
  ignorePaths?: string[];
  includePaths?: string[];
};

/**
 * Extends useSrefActive by ignoring or including paths and updating the classNames field returned when a child route is active.
 * @param to The route to match
 * @param activeClassName The active class names to return
 * @param params The route params
 * @param options The transition options
 * @param pathOptions The paths to ignore/include
 */
export function useSidebarSrefActive(
  to: string,
  // default values are the classes used in the sidebar for an active item
  activeClassName: string = 'bg-blue-5/25 be:bg-gray-5/25 th-dark:bg-gray-true-5/25',
  params: Partial<Record<string, string>> = {},
  options: TransitionOptions = {},
  pathOptions: PathOptions = {
    ignorePaths: [],
    includePaths: [],
  }
) {
  const { state: { name: stateName = '' } = {} } = useCurrentStateAndParams();
  const anchorProps = useSrefActive(to, params || {}, activeClassName, options);

  // overwrite the className to '' if the the current route is in ignorePaths
  const isIgnorePathInRoute = pathOptions.ignorePaths?.some((path) =>
    stateName.includes(path)
  );
  if (isIgnorePathInRoute) {
    return { ...anchorProps, className: '' };
  }

  // overwrite the className to activeClassName if the the current route is in includePaths
  const isIncludePathInRoute = pathOptions.includePaths?.some((path) =>
    stateName.includes(path)
  );
  if (isIncludePathInRoute) {
    return { ...anchorProps, className: activeClassName };
  }

  return anchorProps;
}
