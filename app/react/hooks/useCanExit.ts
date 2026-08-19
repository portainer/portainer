/**
 * Copied from https://github.com/ui-router/react/blob/master/src/hooks/useCanExit.ts
 * TODO: Use package version of this hook when it becomes available: https://github.com/ui-router/react/pull/1227
 */
import { useParentView, useTransitionHook } from '@uirouter/react';

/**
 * A hook that can stop the router from exiting the state the hook is used in.
 * If the callback returns true/undefined (or a Promise that resolves to true/undefined), the Transition will be allowed to continue.
 * If the callback returns false (or a Promise that resolves to false), the Transition will be cancelled.
 */
export function useCanExit(
  canExitCallback: () => boolean | undefined | Promise<boolean | undefined>
) {
  const stateName = useParentView().context.name;
  useTransitionHook('onBefore', { exiting: stateName }, canExitCallback);
}
