import { Edit } from 'lucide-react';

import Docker from '@/assets/ico/vendor/docker.svg?c';
import Ecr from '@/assets/ico/vendor/ecr.svg?c';
import Quay from '@/assets/ico/vendor/quay.svg?c';
import Proget from '@/assets/ico/vendor/proget.svg?c';
import Azure from '@/assets/ico/vendor/azure.svg?c';
import Gitlab from '@/assets/ico/vendor/gitlab.svg?c';

import { RegistryTypes } from '../types/registry';

export const registryLabelMap: Record<RegistryTypes, string> = {
  [RegistryTypes.ANONYMOUS]: 'Anonymous',
  [RegistryTypes.DOCKERHUB]: 'DockerHub',
  [RegistryTypes.ECR]: 'AWS ECR',
  [RegistryTypes.QUAY]: 'Quay.io',
  [RegistryTypes.PROGET]: 'ProGet',
  [RegistryTypes.AZURE]: 'Azure',
  [RegistryTypes.GITLAB]: 'GitLab',
  [RegistryTypes.CUSTOM]: 'Custom registry',
  [RegistryTypes.GITHUB]: 'GitHub',
};

export const registryIconMap = {
  [RegistryTypes.DOCKERHUB]: Docker,
  [RegistryTypes.ECR]: Ecr,
  [RegistryTypes.QUAY]: Quay,
  [RegistryTypes.PROGET]: Proget,
  [RegistryTypes.AZURE]: Azure,
  [RegistryTypes.GITLAB]: Gitlab,
  [RegistryTypes.CUSTOM]: Edit,
  // github and anonymous don't have an icon
  [RegistryTypes.GITHUB]: null,
  [RegistryTypes.ANONYMOUS]: null,
};
