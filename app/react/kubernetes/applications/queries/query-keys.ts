import { EnvironmentId } from '@/react/portainer/environments/types';

export type GetAppsParams = {
  namespace?: string;
  nodeName?: string;
};

export const queryKeys = {
  applications: (environmentId: EnvironmentId, params?: GetAppsParams) =>
    [
      'environments',
      environmentId,
      'kubernetes',
      'applications',
      params,
    ] as const,
  application: (
    environmentId: EnvironmentId,
    namespace: string,
    name: string,
    yaml?: boolean
  ) =>
    [
      'environments',
      environmentId,
      'kubernetes',
      'applications',
      namespace,
      name,
      yaml,
    ] as const,
  applicationRevisions: (
    environmentId: EnvironmentId,
    namespace: string,
    name: string,
    labelSelector?: string
  ) =>
    [
      'environments',
      environmentId,
      'kubernetes',
      'applications',
      namespace,
      name,
      'revisions',
      labelSelector,
    ] as const,
  applicationServices: (
    environmentId: EnvironmentId,
    namespace: string,
    name: string
  ) =>
    [
      'environments',
      environmentId,
      'kubernetes',
      'applications',
      namespace,
      name,
      'services',
    ] as const,
  ingressesForApplication: (
    environmentId: EnvironmentId,
    namespace: string,
    name: string
  ) =>
    [
      'environments',
      environmentId,
      'kubernetes',
      'applications',
      namespace,
      name,
      'ingresses',
    ] as const,
  applicationHorizontalPodAutoscalers: (
    environmentId: EnvironmentId,
    namespace: string,
    name: string
  ) =>
    [
      'environments',
      environmentId,
      'kubernetes',
      'applications',
      namespace,
      name,
      'horizontalpodautoscalers',
    ] as const,
  applicationPods: (
    environmentId: EnvironmentId,
    namespace: string,
    name: string
  ) =>
    [
      'environments',
      environmentId,
      'kubernetes',
      'applications',
      namespace,
      name,
      'pods',
    ] as const,
};
