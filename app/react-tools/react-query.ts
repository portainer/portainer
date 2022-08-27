import {
  MutationCache,
  MutationOptions,
  QueryCache,
  QueryClient,
  QueryKey,
  QueryOptions,
} from 'react-query';

import { notifyError } from '@/portainer/services/notifications';

export function withError(fallbackMessage?: string, title = 'Failure') {
  return {
    onError(error: unknown) {
      notifyError(title, error as Error, fallbackMessage);
    },
  };
}

export function withGlobalError(fallbackMessage?: string, title = 'Failure') {
  return {
    meta: {
      error: { message: fallbackMessage, title },
    },
  };
}

type OptionalReadonly<T> = T | Readonly<T>;

export function withInvalidate(
  queryClient: QueryClient,
  queryKeysToInvalidate: OptionalReadonly<string[]>[]
) {
  return {
    onSuccess() {
      return Promise.all(
        queryKeysToInvalidate.map((keys) => queryClient.invalidateQueries(keys))
      );
    },
  };
}

export function mutationOptions<
  TData = unknown,
  TError = unknown,
  TVariables = void,
  TContext = unknown
>(...options: MutationOptions<TData, TError, TVariables, TContext>[]) {
  return mergeOptions(options);
}

export function queryOptions<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey
>(...options: QueryOptions<TQueryFnData, TError, TData, TQueryKey>[]) {
  return mergeOptions(options);
}

function mergeOptions<T>(options: T[]) {
  return options.reduce(
    (acc, option) => ({
      ...acc,
      ...option,
    }),
    {}
  );
}

export function createQueryClient() {
  return new QueryClient({
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
  if (errorMeta && typeof errorMeta === 'object') {
    const { title = 'Failure', message } = errorMeta as {
      title?: string;
      message?: string;
    };

    notifyError(title, error as Error, message);
  }
}

export const queryClient = createQueryClient();
