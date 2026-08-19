import Kubernetes from '@/assets/ico/vendor/kubernetes.svg?c';
import DockerCompose from '@/assets/ico/vendor/docker-compose.svg?c';

import { BoxSelectorOption } from '../types';

export const kubernetes: BoxSelectorOption<'kubernetes'> = {
  id: 'method_kubernetes',
  icon: Kubernetes,
  label: 'Kubernetes',
  description: 'Kubernetes manifest format',
  value: 'kubernetes',
  iconType: 'logo',
};

export const compose: BoxSelectorOption<'compose'> = {
  id: 'method_compose',
  icon: DockerCompose,
  label: 'Compose',
  description: 'docker-compose format',
  value: 'compose',
  iconType: 'logo',
};
