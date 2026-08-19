import {
  MutationCache,
  MutationOptions,
  QueryCache,
  QueryClient,
  QueryKey,
  QueryOptions,
} from '@tanstack/react-query';

import { notifyError } from '@/portainer/services/notifications';
import { isAxiosError } from '@/react/portainer/services/axios/utils/isAxiosError';
import { parseAxiosError } from '@/react/portainer/services/axios/utils/parseAxiosError';

export function withError(fallbackMessage?: string, title = 'Failure') {
  return {
    meta: {
      error: { message: fallbackMessage, title },
    },
  };
}

type OptionalReadonly<T> = T | Readonly<T>;

export function withInvalidate(
  queryClient: QueryClient,
  queryKeysToInvalidate: Array<OptionalReadonly<Array<unknown>>>,
  // skipRefresh will set the mutation state to success without waiting for the invalidated queries to refresh
  // see the following for info: https://tkdodo.eu/blog/mastering-mutations-in-react-query#awaited-promises
  { skipRefresh }: { skipRefresh?: boolean } = {}
) {
  return {
    onSuccess() {
      const promise = Promise.all(
        queryKeysToInvalidate.map((keys) => queryClient.invalidateQueries(keys))
      );
      return skipRefresh
        ? undefined // don't wait for queries to refresh before setting state to success
        : promise; // stay loading until all queries are refreshed
    },
  };
}

export function mutationOptions<
  TData = unknown,
  TError = unknown,
  TVariables = void,
  TContext = unknown,
>(...options: MutationOptions<TData, TError, TVariables, TContext>[]) {
  return mergeOptions(options);
}

export function queryOptions<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(...options: QueryOptions<TQueryFnData, TError, TData, TQueryKey>[]) {
  return mergeOptions(options);
}

function mergeOptions<T>(options: T[]) {
  return options.reduce(
    (acc, option) => ({
      ...acc,
      ...option,
    }),
    {} as T
  );
}

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        networkMode: 'offlineFirst',
        staleTime: 20,
      },
    },
    mutationCache: new MutationCache({
      onError: (error, variable, context, mutation) => {
        handleError(error, mutation.meta?.error);
      },
    }),
    queryCache: new QueryCache({
      onError: (error, mutation) => {
        handleError(error, mutation.meta?.error);
      },
    }),
  });
}

function handleError(error: unknown, errorMeta?: unknown) {
  const meta = extractErrorMeta(errorMeta);

  // suppress error when `meta.error` is falsy
  if (!meta) {
    return;
  }

  const parsedError = isAxiosError(error)
    ? parseAxiosError(error, meta?.message ?? '')
    : error;

  notifyError(meta?.title || 'Failure', parsedError, meta?.message);
}

function extractErrorMeta(errorMeta?: unknown) {
  if (!errorMeta || typeof errorMeta !== 'object') {
    return undefined;
  }

  let title = '';
  if ('title' in errorMeta && typeof errorMeta.title === 'string') {
    title = errorMeta.title;
  }
  let message = '';
  if ('message' in errorMeta && typeof errorMeta.message === 'string') {
    message = errorMeta.message;
  }

  return { title, message };
}

export const queryClient = createQueryClient();
