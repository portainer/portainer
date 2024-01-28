import { CustomTemplate } from '../types';

export const queryKeys = {
  base: () => ['custom-templates'] as const,
  list: (params: unknown) => [...queryKeys.base(), { params }] as const,
  item: (id: CustomTemplate['Id']) => [...queryKeys.base(), id] as const,
  file: (id: CustomTemplate['Id'], options: { git: boolean }) =>
    [...queryKeys.item(id), 'file', options] as const,
};
