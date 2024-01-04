export type SupportedIngControllerTypes =
  | 'nginx'
  | 'traefik'
  | 'other'
  | 'custom';

export interface IngressControllerClassMap {
  Name: string;
  ClassName: string;
  Type: string;
  Availability: boolean;
  New: boolean;
  Used: boolean; // if the controller is used by any ingress in the cluster
}
