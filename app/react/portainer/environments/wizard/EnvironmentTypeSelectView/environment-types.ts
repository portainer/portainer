import { FeatureId } from '@/portainer/feature-flags/enums';

import KaaSIcon from './kaas-icon.svg?c';

export const environmentTypes = [
  {
    id: 'dockerStandalone',
    title: 'Docker Standalone',
    icon: 'fab fa-docker',
    description: 'Connect to Docker Standalone via URL/IP, API or Socket',
    featureId: undefined,
  },
  {
    id: 'dockerSwarm',
    title: 'Docker Swarm',
    icon: 'fab fa-docker',
    description: 'Connect to Docker Swarm via URL/IP, API or Socket',
    featureId: undefined,
  },
  {
    id: 'kubernetes',
    title: 'Kubernetes',
    icon: 'fas fa-dharmachakra',
    description: 'Connect to a kubernetes environment via URL/IP',
    featureId: undefined,
  },
  {
    id: 'aci',
    title: 'ACI',
    description: 'Connect to ACI environment via API',
    icon: 'fab fa-microsoft',
    featureId: undefined,
  },
  {
    id: 'nomad',
    title: 'Nomad',
    description: 'Connect to HashiCorp Nomad environment via API',
    icon: 'nomad-icon',
    featureId: FeatureId.NOMAD,
  },
  {
    id: 'kaas',
    title: 'KaaS',
    description: 'Provision a Kubernetes environment with a cloud provider',
    icon: KaaSIcon,
    featureId: FeatureId.KAAS_PROVISIONING,
  },
] as const;
