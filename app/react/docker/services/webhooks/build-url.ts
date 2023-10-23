export function buildUrl(webhookId?: string) {
  const baseUrl = '/webhooks';
  return webhookId ? `${baseUrl}/${webhookId}` : baseUrl;
}
