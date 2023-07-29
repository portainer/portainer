export interface Configuration {
  Id: string;
  Name: string;
  Type: number;
  Namespace: string;
  CreationDate: Date;

  ConfigurationOwner: string;

  Used: boolean;
  Data: Document;
  Yaml: string;

  SecretType?: string;
  IsRegistrySecret?: boolean;
}

// Workaround for the TS error `Type 'ConfigMap' does not satisfy the constraint 'Record<string, unknown>'` for the datatable
// https://github.com/microsoft/TypeScript/issues/15300#issuecomment-1320480061
export type IndexOptional<T> = Pick<T, keyof T>;
