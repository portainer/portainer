export type Rule = {
  verbs: string[];
  apiGroups: string[];
  resources: string[];
};

export type Role = {
  name: string;
  uid: string;
  namespace: string;
  creationDate: string;
  isSystem: boolean;
};

export type RoleRowData = Role & {
  isUnused: boolean;
};
