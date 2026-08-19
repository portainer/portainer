import { useEffect } from 'react';
import { useCurrentStateAndParams, useRouter } from '@uirouter/react';

import { get, set } from './useLocalStorage';

type PersistOptions = {
  storageKey: string;
  persistedKeys: string[];
};

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
      router.stateService.go(
        '.',
        { [param]: value },
        { reload: false, location: 'replace' }
      );
    },
  ] as const;
}

/** Use this when you need to use/update multiple params at once. */
export function useParamsState<T extends Record<string, unknown>>(
  parseParams: (params: Record<string, string | undefined>) => T
) {
  const { params: stateParams } = useCurrentStateAndParams();
  const router = useRouter();

  const state = parseParams(stateParams);

  function setState(newState: Partial<T>) {
    router.stateService.go('.', newState, {
      reload: false,
      location: 'replace',
    });
  }

  return [state, setState] as const;
}

/** Use this when you need to use/update multiple params and persist a subset to session storage. */
export function usePersistedParamsState<T extends Record<string, unknown>>(
  parseParams: (params: Record<string, unknown>) => T,
  persist?: PersistOptions
): [T, (partial: Partial<T>) => void] {
  const { params: stateParams } = useCurrentStateAndParams();
  const router = useRouter();

  const persistedParams = persist ? readPersisted(persist) : null;
  const trackedKeys = persist?.persistedKeys ?? [];

  const shouldHydrateFromStorage =
    !!persistedParams &&
    trackedKeys.length > 0 &&
    trackedKeys.some(
      (k) => persistedParams[k] != null && stateParams[k] == null
    );

  const effectiveParams: Record<string, unknown> = shouldHydrateFromStorage
    ? {
        ...stateParams,
        ...Object.fromEntries(
          trackedKeys
            .filter((k) => stateParams[k] == null)
            .map((k) => [k, persistedParams![k]])
        ),
      }
    : stateParams;

  const state = parseParams(effectiveParams);

  useEffect(() => {
    if (!persist || !shouldHydrateFromStorage) return;
    const stored = readPersisted(persist);
    const toRestore = Object.fromEntries(
      trackedKeys
        .filter((k) => stateParams[k] == null && stored[k] != null)
        .map((k) => [k, stored[k]])
    );
    if (Object.keys(toRestore).length === 0) return;
    router.stateService.go('.', toRestore, {
      reload: false,
      location: 'replace',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldHydrateFromStorage]);

  useEffect(() => {
    if (!persist || shouldHydrateFromStorage) return;
    if (!trackedKeys.some((k) => stateParams[k] != null)) return;
    writePersisted(persist, pickKeys(state, persist.persistedKeys));
  });

  function setState(partial: Partial<T>) {
    if (persist) {
      const stored = readPersisted(persist);
      const updates = Object.fromEntries(
        persist.persistedKeys
          .filter((k) => k in partial)
          .map((k) => [k, (partial as Record<string, unknown>)[k]])
      );
      writePersisted(persist, { ...stored, ...updates });
    }
    router.stateService.go('.', partial, {
      reload: false,
      location: 'replace',
    });
  }

  return [state, setState];
}

function readPersisted(persist: PersistOptions): Record<string, unknown> {
  return get<Record<string, unknown>>(persist.storageKey, {}, localStorage);
}

function writePersisted(
  persist: PersistOptions,
  params: Record<string, unknown>
) {
  set(persist.storageKey, params, localStorage);
}

function pickKeys(
  obj: Record<string, unknown>,
  keys: string[]
): Record<string, unknown> {
  return Object.fromEntries(keys.map((k) => [k, obj[k]]));
}
