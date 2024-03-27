export interface VolumeViewModel {
  Applications: Array<{
    Name: string;
  }>;
  PersistentVolumeClaim: {
    Name: string;
    storageClass: {
      Name: string;
    };
    Storage?: unknown;
    CreationDate: number;
    ApplicationOwner?: string;
  };
  ResourcePool: {
    Namespace: {
      Name: string;
    };
  };
}
