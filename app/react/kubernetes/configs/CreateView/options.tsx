import { FileCode, Lock } from 'lucide-react';

import { KubernetesConfigurationKinds } from '@/kubernetes/models/configuration/models';

import { BoxSelectorOption } from '@@/BoxSelector';

export const typeOptions: ReadonlyArray<BoxSelectorOption<number>> = [
  {
    id: 'type_basic',
    value: KubernetesConfigurationKinds.CONFIGMAP,
    icon: FileCode,
    iconType: 'badge',
    label: 'ConfigMap',
    description: 'This kind holds non-sensitive information',
  },
  {
    id: 'type_secret',
    value: KubernetesConfigurationKinds.SECRET,
    icon: Lock,
    iconType: 'badge',
    label: 'Secret',
    description: 'This kind holds sensitive information',
  },
] as const;
