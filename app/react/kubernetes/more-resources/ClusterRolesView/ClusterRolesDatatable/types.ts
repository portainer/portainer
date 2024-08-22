export type Rule = {
  verbs: string[];
  apiGroups: string[];
  resources: string[];
};

export type ClusterRole = {
  name: string;
  uid: string;
  namespace: string;
  resourceVersion: string;
  creationDate: string;
  annotations?: Record<string, string>;

  rules: Rule[];

  isUnused: boolean;
  isSystem: boolean;
};

export type DeleteRequestPayload = {
  clusterRoles: string[];
};
