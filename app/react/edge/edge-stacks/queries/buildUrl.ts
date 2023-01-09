import { EdgeStack } from '../types';

export function buildUrl(id?: EdgeStack['Id'], action?: string) {
  const baseUrl = '/edge_stacks';
  const url = id ? `${baseUrl}/${id}` : baseUrl;
  return action ? `${url}/${action}` : url;
}
