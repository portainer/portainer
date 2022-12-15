export function buildUrl(action?: string) {
  let url = '/system';

  if (action) {
    url += `/${action}`;
  }

  return url;
}
