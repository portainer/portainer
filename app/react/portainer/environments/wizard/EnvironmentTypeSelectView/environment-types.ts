import { FeatureId } from '@/react/portainer/feature-flags/enums';

import KaaSIcon from './kaas-icon.svg?c';

export const environmentTypes = [
  {
    id: 'dockerStandalone',
    title: 'Docker Standalone',
    icon: 'svg-dockericon',
    description: 'Connect to Docker Standalone via URL/IP, API or Socket',
    featureId: undefined,
  },
  {
    id: 'dockerSwarm',
    title: 'Docker Swarm',
    icon: 'svg-dockericon',
    description: 'Connect to Docker Swarm via URL/IP, API or Socket',
    featureId: undefined,
  },
  {
    id: 'kubernetes',
    title: 'Kubernetes',
    icon: 'svg-kubernetes2',
    description: 'Connect to a kubernetes environment via URL/IP',
    featureId: undefined,
  },
  {
    id: 'aci',
    title: 'ACI',
    description: 'Connect to ACI environment via API',
    icon: 'svg-microsofticon',
    featureId: undefined,
  },
  {
    id: 'nomad',
    title: 'Nomad',
    description: 'Connect to HashiCorp Nomad environment via API',
    icon: 'svg-nomadicon',
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
