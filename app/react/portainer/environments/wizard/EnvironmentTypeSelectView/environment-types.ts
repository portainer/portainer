import { FeatureId } from '@/react/portainer/feature-flags/enums';
import Docker from '@/assets/ico/vendor/docker.svg?c';
import Kubernetes from '@/assets/ico/vendor/kubernetes.svg?c';
import Azure from '@/assets/ico/vendor/azure.svg?c';
import Nomad from '@/assets/ico/vendor/nomad.svg?c';
import KaaS from '@/assets/ico/vendor/kaas-icon.svg?c';
import InstallK8s from '@/assets/ico/vendor/install-kubernetes.svg?c';

import { BoxSelectorOption } from '@@/BoxSelector';

export type EnvironmentOptionValue =
  | 'dockerStandalone'
  | 'dockerSwarm'
  | 'kubernetes'
  | 'aci'
  | 'nomad'
  | 'kaas'
  | 'k8sInstall';

export interface EnvironmentOption
  extends BoxSelectorOption<EnvironmentOptionValue> {
  id: EnvironmentOptionValue;
  value: EnvironmentOptionValue;
}

export const existingEnvironmentTypes: EnvironmentOption[] = [
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
    description: 'Connect to a Kubernetes environment via URL/IP',
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
];

export const newEnvironmentTypes: EnvironmentOption[] = [
  {
    id: 'kaas',
    value: 'kaas',
    label: 'Provision KaaS Cluster',
    description:
      "Provision a Kubernetes cluster via a cloud provider's Kubernetes as a Service",
    icon: KaaS,
    iconType: 'logo',
    feature: FeatureId.KAAS_PROVISIONING,
    disabledWhenLimited: true,
  },
  {
    id: 'k8sInstall',
    value: 'k8sInstall',
    label: 'Create Kubernetes cluster',
    description: 'Create a Kubernetes cluster on existing infrastructure',
    icon: InstallK8s,
    iconType: 'logo',
    feature: FeatureId.K8SINSTALL,
    disabledWhenLimited: true,
  },
];

export const environmentTypes = [
  ...existingEnvironmentTypes,
  ...newEnvironmentTypes,
];

export const formTitles: Record<EnvironmentOptionValue, string> = {
  dockerStandalone: 'Connect to your Docker Standalone environment',
  dockerSwarm: 'Connect to your Docker Swarm environment',
  kubernetes: 'Connect to your Kubernetes environment',
  aci: 'Connect to your ACI environment',
  nomad: 'Connect to your Nomad environment',
  kaas: 'Provision a KaaS environment',
  k8sInstall: 'Create a Kubernetes cluster',
};
