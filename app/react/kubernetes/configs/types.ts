export interface Configuration {
  Id: string;
  Name: string;
  Type: number;
  Namespace: string;
  CreationDate: Date;

  ConfigurationOwner: string;

  Used: boolean;
  // Applications: any[];
  Data: Document;
  Yaml: string;

  SecretType?: string;
  IsRegistrySecret?: boolean;
}
