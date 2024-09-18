export type Rule = {
  verbs: string[];
  apiGroups: string[];
  resources: string[];
};

export type Role = {
  name: string;
  uid: string;
  namespace: string;
  resourceVersion: string;
  creationDate: string;
  annotations?: Record<string, string>;

  rules: Rule[];

  isSystem: boolean;
  isUnused: boolean;
};
