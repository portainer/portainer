import { KaaSIcon } from './KaaSIcon';

export const environmentTypes = [
  {
    id: 'docker',
    title: 'Docker',
    icon: 'fab fa-docker',
    description:
      'Connect to Docker Standalone / Swarm via URL/IP, API or Socket',
  },
  {
    id: 'kubernetes',
    title: 'Kubernetes',
    icon: 'fas fa-dharmachakra',
    description: 'Connect to a kubernetes environment via URL/IP',
  },
  {
    id: 'kaas',
    title: 'KaaS',
    description: 'Provision a Kubernetes environment with a cloud provider',
    icon: KaaSIcon,
  },
  {
    id: 'aci',
    title: 'ACI',
    description: 'Connect to ACI environment via API',
    icon: 'fab fa-microsoft',
  },
  {
    id: 'nomad',
    title: 'Nomad',
    description: 'Connect to HashiCorp Nomad environment via API',
    icon: 'nomad-icon',
  },
] as const;
