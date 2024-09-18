export type RoleRef = {
  name: string;
  kind: string;
  apiGroup?: string;
};

export type RoleSubject = {
  name: string;
  kind: string;
  apiGroup?: string;
  namespace?: string;
};

export type RoleBinding = {
  name: string;
  uid: string;
  namespace: string;
  resourceVersion: string;
  creationDate: string;
  annotations: Record<string, string> | null;

  roleRef: RoleRef;
  subjects: RoleSubject[] | null;

  isSystem: boolean;
};
