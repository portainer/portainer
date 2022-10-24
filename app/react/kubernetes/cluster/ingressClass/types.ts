export type SupportedIngControllerTypes =
  | 'nginx'
  | 'traefik'
  | 'other'
  | 'custom';

export interface IngressControllerClassMap extends Record<string, unknown> {
  Name: string;
  ClassName: string;
  Type: SupportedIngControllerTypes;
  Availability: boolean;
  New: boolean;
  Used: boolean; // if the controller is used by any ingress in the cluster
}
