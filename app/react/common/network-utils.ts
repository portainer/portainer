export function getSchemeFromPort(port: number | undefined): string {
  if (!port) {
    return 'http';
  }

  const hostPort: string = String(port);
  return hostPort.endsWith('443') ? 'https' : 'http';
}
