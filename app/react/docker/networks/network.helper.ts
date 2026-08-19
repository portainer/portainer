const systemNetworks = ['host', 'bridge', 'ingress', 'nat', 'none'];

export function isSystemNetwork(networkName: string) {
  return systemNetworks.includes(networkName);
}
