export const CONTAINER_MODE = 'container';

export interface Values {
  networkMode: string;
  hostname: string;
  domain: string;
  macAddress: string;
  ipv4Address: string;
  ipv6Address: string;
  primaryDns: string;
  secondaryDns: string;
  hostsFileEntries: Array<string>;
  container: string;
}
