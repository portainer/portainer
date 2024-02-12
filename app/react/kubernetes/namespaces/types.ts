export interface Namespaces {
  [key: string]: DefaultOrSystemNamespace;
}

export interface DefaultOrSystemNamespace {
  IsDefault: boolean;
  IsSystem: boolean;
}
