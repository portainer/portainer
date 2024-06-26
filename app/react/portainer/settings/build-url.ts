export function buildUrl(subResource?: string, action?: string) {
  let url = 'settings';
  if (subResource) {
    url += `/${subResource}`;
  }

  if (action) {
    url += `/${action}`;
  }

  return url;
}
