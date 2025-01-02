import { buildStackUrl } from '../buildUrl';

export function buildCreateUrl(
  stackType: 'kubernetes',
  method: 'repository' | 'url' | 'string'
): string;

export function buildCreateUrl(
  stackType: 'swarm' | 'standalone',
  method: 'repository' | 'string' | 'file'
): string;
export function buildCreateUrl(stackType: string, method: string) {
  return buildStackUrl(undefined, `create/${stackType}/${method}`);
}
