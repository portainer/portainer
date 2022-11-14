export * from './v1IngressClass';
export * from './v1ObjectMeta';

export type KubernetesApiListResponse<T> = {
  apiVersion: string;
  kind: string;
  items: T;
  metadata: {
    resourceVersion?: string;
  };
};
