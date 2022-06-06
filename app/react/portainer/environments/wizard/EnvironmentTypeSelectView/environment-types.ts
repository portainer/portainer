import { FeatureId } from '@/portainer/feature-flags/enums';

import { KaaSIcon, Props as KaaSIconProps } from './KaaSIcon';

export enum WizardTileType {
  FEATURE = 'feature',
  TEASER = 'teaser',
}

interface WizardEnvironmentOption {
  id: string;
  title: string;
  icon: string | { ({ selected, className }: KaaSIconProps): JSX.Element };
  description: string;
  type: WizardTileType;
  featureId?: FeatureId;
}

export const environmentTypes: WizardEnvironmentOption[] = [
  {
    id: 'docker',
    title: 'Docker',
    icon: 'fab fa-docker',
    description:
      'Connect to Docker Standalone / Swarm via URL/IP, API or Socket',
    type: WizardTileType.FEATURE,
    featureId: undefined,
  },
  {
    id: 'kubernetes',
    title: 'Kubernetes',
    icon: 'fas fa-dharmachakra',
    description: 'Connect to a kubernetes environment via URL/IP',
    type: WizardTileType.FEATURE,
    featureId: undefined,
  },
  {
    id: 'aci',
    title: 'ACI',
    description: 'Connect to ACI environment via API',
    icon: 'fab fa-microsoft',
    type: WizardTileType.FEATURE,
    featureId: undefined,
  },
  {
    id: 'nomad',
    title: 'Nomad',
    description: 'Connect to HashiCorp Nomad environment via API',
    icon: 'nomad-icon',
    type: WizardTileType.TEASER,
    featureId: FeatureId.NOMAD,
  },
  {
    id: 'kaas',
    title: 'KaaS',
    description: 'Provision a Kubernetes environment with a cloud provider',
    icon: KaaSIcon,
    type: WizardTileType.TEASER,
    featureId: FeatureId.KAAS_PROVISIONING,
  },
];
