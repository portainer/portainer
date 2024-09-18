export type ServiceAccount = {
  name: string;
  namespace: string;
  resourceVersion: string;
  uid: string;
  creationDate: string;

  isSystem: boolean;
  isUnused: boolean;
};
