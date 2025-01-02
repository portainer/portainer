export type ClusterRole = {
  name: string;
  creationDate: string;
  uid: string;
  isSystem: boolean;
};

export type ClusterRoleRowData = ClusterRole & {
  isUnused: boolean;
};

export type DeleteRequestPayload = {
  clusterRoles: string[];
};
