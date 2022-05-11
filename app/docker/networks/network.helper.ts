const systemNetworks = ['host', 'bridge', 'none'];

export function isSystemNetwork(networkName: string) {
  return systemNetworks.includes(networkName);
}
