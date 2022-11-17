import { FeatureId } from '@/react/portainer/feature-flags/enums';
import DockerIcon from '@/assets/ico/vendor/docker-icon.svg?c';
import Kube from '@/assets/ico/kube.svg?c';
import MicrosoftIcon from '@/assets/ico/vendor/microsoft-icon.svg?c';
import NomadIcon from '@/assets/ico/vendor/nomad-icon.svg?c';

import KaaSIcon from './kaas-icon.svg?c';

export const environmentTypes = [
  {
    id: 'dockerStandalone',
    title: 'Docker Standalone',
    icon: DockerIcon,
    description: 'Connect to Docker Standalone via URL/IP, API or Socket',
    featureId: undefined,
  },
  {
    id: 'dockerSwarm',
    title: 'Docker Swarm',
    icon: DockerIcon,
    description: 'Connect to Docker Swarm via URL/IP, API or Socket',
    featureId: undefined,
  },
  {
    id: 'kubernetes',
    title: 'Kubernetes',
    icon: Kube,
    description: 'Connect to a kubernetes environment via URL/IP',
    featureId: undefined,
  },
  {
    id: 'aci',
    title: 'ACI',
    description: 'Connect to ACI environment via API',
    icon: MicrosoftIcon,
    featureId: undefined,
  },
  {
    id: 'nomad',
    title: 'Nomad',
    description: 'Connect to HashiCorp Nomad environment via API',
    icon: NomadIcon,
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
