import { EdgeJob } from '../types';

export function buildUrl({
  action,
  id,
}: { id?: EdgeJob['Id']; action?: string } = {}) {
  const baseUrl = '/edge_jobs';
  const url = id ? `${baseUrl}/${id}` : baseUrl;
  return action ? `${url}/${action}` : url;
}
