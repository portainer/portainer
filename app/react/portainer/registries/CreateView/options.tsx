import { BadgeIcon } from '@@/BadgeIcon';

import { RegistryTypes } from '../types/registry';
import { registryIconMap, registryLabelMap } from '../utils/constants';

export const options = [
  {
    id: 'registry_dockerhub',
    icon: registryIconMap[RegistryTypes.DOCKERHUB],
    label: registryLabelMap[RegistryTypes.DOCKERHUB],
    description: 'DockerHub authenticated account',
    value: String(RegistryTypes.DOCKERHUB),
  },
  {
    id: 'registry_aws_ecr',
    icon: registryIconMap[RegistryTypes.ECR],
    label: registryLabelMap[RegistryTypes.ECR],
    description: 'Amazon elastic container registry',
    value: String(RegistryTypes.ECR),
  },
  {
    id: 'registry_quay',
    icon: registryIconMap[RegistryTypes.QUAY],
    label: registryLabelMap[RegistryTypes.QUAY],
    description: 'Quay container registry',
    value: String(RegistryTypes.QUAY),
  },
  {
    id: 'registry_proget',
    icon: registryIconMap[RegistryTypes.PROGET],
    label: registryLabelMap[RegistryTypes.PROGET],
    description: 'ProGet container registry',
    value: String(RegistryTypes.PROGET),
  },
  {
    id: 'registry_azure',
    icon: registryIconMap[RegistryTypes.AZURE],
    label: registryLabelMap[RegistryTypes.AZURE],
    description: 'Azure container registry',
    value: String(RegistryTypes.AZURE),
  },
  {
    id: 'registry_gitlab',
    icon: registryIconMap[RegistryTypes.GITLAB],
    label: registryLabelMap[RegistryTypes.GITLAB],
    description: 'GitLab container registry',
    value: String(RegistryTypes.GITLAB),
  },
  {
    id: 'registry_custom',
    icon: <BadgeIcon icon={registryIconMap[RegistryTypes.CUSTOM]} />,
    label: registryLabelMap[RegistryTypes.CUSTOM],
    description: 'Define your own registry',
    value: String(RegistryTypes.CUSTOM),
  },
];
