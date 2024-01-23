export interface NamespaceViewModel {
  Namespace: {
    Id: string;
    Name: string;
    Status: string;
    CreationDate: number;
    ResourcePoolOwner: string;
    IsSystem: boolean;
  };
  Quota: number;
}
