export function buildUrl(action?: string) {
  let url = '/status';

  if (action) {
    url += `/${action}`;
  }

  return url;
}
