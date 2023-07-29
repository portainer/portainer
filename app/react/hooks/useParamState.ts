import { useCurrentStateAndParams, useRouter } from '@uirouter/react';

export function useParamState<T>(
  param: string,
  parseParam: (param: string | undefined) => T | undefined
) {
  const {
    params: { [param]: paramValue },
  } = useCurrentStateAndParams();
  const router = useRouter();
  const state = parseParam(paramValue);

  return [
    state,
    (value: T | undefined) => {
      router.stateService.go('.', { [param]: value });
    },
  ] as const;
}
