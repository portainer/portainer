export type ClusterRoleRef = {
  name: string;
  kind: string;
  apiGroup?: string;
};

export type ClusterRoleSubject = {
  name: string;
  kind: string;
  apiGroup?: string;
  namespace?: string;
};

export type ClusterRoleBinding = {
  name: string;
  uid: string;
  namespace: string;
  roleRef: ClusterRoleRef;
  subjects: ClusterRoleSubject[] | null;
  creationDate: string;
  isSystem: boolean;
};
