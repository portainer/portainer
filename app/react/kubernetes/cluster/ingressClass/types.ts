type SupportedIngControllerNames = 'nginx' | 'traefik' | 'unknown' | 'custom';

export interface IngressControllerClassMap extends Record<string, unknown> {
  Name: string;
  ClassName: string;
  Type: SupportedIngControllerNames;
  Availability: boolean;
  New: boolean;
  Used: boolean; // if the controller is used by any ingress in the cluster
}
