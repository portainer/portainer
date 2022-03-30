const systemNetworks: string[] = ['host', 'bridge', 'none'];

export function isSystemNetwork(networkName: string): boolean {
  return systemNetworks.includes(networkName);
}
