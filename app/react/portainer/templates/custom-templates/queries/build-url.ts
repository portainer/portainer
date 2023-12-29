import { CustomTemplate } from '../types';

export function buildUrl({
  id,
  action,
}: {
  id?: CustomTemplate['Id'];
  action?: string;
} = {}) {
  let base = '/custom_templates';

  if (id) {
    base = `${base}/${id}`;
  }

  if (action) {
    base = `${base}/${action}`;
  }

  return base;
}
