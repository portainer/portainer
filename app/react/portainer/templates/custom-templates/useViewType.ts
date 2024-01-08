import { useCurrentStateAndParams } from '@uirouter/react';

export type TemplateViewType = 'kube' | 'docker' | 'edge';

export function useViewType(): TemplateViewType {
  const {
    state: { name },
  } = useCurrentStateAndParams();
  if (name?.includes('kubernetes')) {
    return 'kube';
  }

  if (name?.includes('docker')) {
    return 'docker';
  }

  return 'edge';
}
