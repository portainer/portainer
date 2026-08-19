export function getSchemeFromPort(port?: number): 'http' | 'https' {
  if (!port) {
    return 'http';
  }

  const hostPort = String(port);
  return hostPort.endsWith('443') ? 'https' : 'http';
}
