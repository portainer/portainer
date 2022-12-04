export type Application = {
  Name: string;
  ResourcePool: string;
};

export type KubernetesStack = {
  Name: string;
  ResourcePool: string;
  Applications: Array<Application>;
  Highlighted: boolean;
};
