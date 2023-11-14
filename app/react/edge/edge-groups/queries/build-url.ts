import { EdgeGroup } from '../types';

export function buildUrl({
  action,
  id,
}: { id?: EdgeGroup['Id']; action?: string } = {}) {
  const baseUrl = '/edge_groups';
  const url = id ? `${baseUrl}/${id}` : baseUrl;
  return action ? `${url}/${action}` : url;
}
