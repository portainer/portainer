import { FeatureId } from '@/react/portainer/feature-flags/enums';
import Docker from '@/assets/ico/vendor/docker.svg?c';
import Kubernetes from '@/assets/ico/vendor/kubernetes.svg?c';
import Azure from '@/assets/ico/vendor/azure.svg?c';
import Nomad from '@/assets/ico/vendor/nomad.svg?c';

import KaaSIcon from './kaas-icon.svg?c';

export const environmentTypes = [
  {
    id: 'dockerStandalone',
    value: 'dockerStandalone',
    label: 'Docker Standalone',
    icon: Docker,
    iconType: 'logo',
    description: 'Connect to Docker Standalone via URL/IP, API or Socket',
  },
  {
    id: 'dockerSwarm',
    value: 'dockerSwarm',
    label: 'Docker Swarm',
    icon: Docker,
    iconType: 'logo',
    description: 'Connect to Docker Swarm via URL/IP, API or Socket',
  },
  {
    id: 'kubernetes',
    value: 'kubernetes',
    label: 'Kubernetes',
    icon: Kubernetes,
    iconType: 'logo',
    description: 'Connect to a kubernetes environment via URL/IP',
  },
  {
    id: 'aci',
    value: 'aci',
    label: 'ACI',
    description: 'Connect to ACI environment via API',
    iconType: 'logo',
    icon: Azure,
  },
  {
    id: 'nomad',
    value: 'nomad',
    label: 'Nomad',
    description: 'Connect to HashiCorp Nomad environment via API',
    icon: Nomad,
    iconType: 'logo',
    feature: FeatureId.NOMAD,
    disabledWhenLimited: true,
  },
  {
    id: 'kaas',
    value: 'kaas',
    label: 'KaaS',
    description: 'Provision a Kubernetes environment with a cloud provider',
    icon: KaaSIcon,
    iconType: 'logo',
    feature: FeatureId.KAAS_PROVISIONING,
    disabledWhenLimited: true,
  },
] as const;

export const formTitles = {
  dockerStandalone: 'Connect to your Docker Standalone environment',
  dockerSwarm: 'Connect to your Docker Swarm environment',
  kubernetes: 'Connect to your Kubernetes environment',
  aci: 'Connect to your ACI environment',
  nomad: 'Connect to your Nomad environment',
  kaas: 'Provision a KaaS environment',
};
