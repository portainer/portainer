export function buildUrl(subResource?: string, action?: string) {
  let url = 'backup';
  if (subResource) {
    url += `/${subResource}`;
  }

  if (action) {
    url += `/${action}`;
  }

  return url;
}
