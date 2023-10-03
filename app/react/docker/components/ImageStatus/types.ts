type Status = 'outdated' | 'updated' | 'inprocess' | string;

export enum ResourceType {
  CONTAINER,
  SERVICE,
}

export interface ImageStatus {
  Status: Status;
  Message: string;
}

export type ResourceID = string;
