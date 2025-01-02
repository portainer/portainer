import { useCurrentStateAndParams, useRouter } from '@uirouter/react';

/** Only use when you need to use/update a single param at a time. Using this to update multiple params will cause the state to get out of sync. */
export function useParamState<T>(
  param: string,
  parseParam: (param: string | undefined) => T | undefined = (param) =>
    param as unknown as T
) {
  const {
    params: { [param]: paramValue },
  } = useCurrentStateAndParams();
  const router = useRouter();
  const state = parseParam(paramValue);

  return [
    state,
    (value?: T) => {
      router.stateService.go('.', { [param]: value }, { reload: false });
    },
  ] as const;
}

/** Use this when you need to use/update multiple params at once. */
export function useParamsState<T extends Record<string, unknown>>(
  params: string[],
  parseParams: (params: Record<string, string | undefined>) => T
) {
  const { params: stateParams } = useCurrentStateAndParams();
  const router = useRouter();

  const state = parseParams(
    params.reduce(
      (acc, param) => {
        acc[param] = stateParams[param];
        return acc;
      },
      {} as Record<string, string | undefined>
    )
  );

  function setState(newState: Partial<T>) {
    const newStateParams = Object.entries(newState).reduce(
      (acc, [key, value]) => {
        acc[key] = value;
        return acc;
      },
      {} as Record<string, unknown>
    );

    router.stateService.go('.', newStateParams, { reload: false });
  }

  return [state, setState] as const;
}
