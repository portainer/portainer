import { FeatureId } from '@/react/portainer/feature-flags/enums';
import Docker from '@/assets/ico/vendor/docker.svg?c';
import Podman from '@/assets/ico/vendor/podman.svg?c';
import Kubernetes from '@/assets/ico/vendor/kubernetes.svg?c';
import Kubesolo from '@/assets/ico/vendor/kubesolo.svg?c';
import Azure from '@/assets/ico/vendor/azure.svg?c';
import InstallK8s from '@/assets/ico/vendor/install-kubernetes.svg?c';

import { BoxSelectorOption } from '@@/BoxSelector';

export type EnvironmentOptionValue =
  | 'dockerStandalone'
  | 'dockerSwarm'
  | 'podman'
  | 'kubernetes'
  | 'aci'
  | 'kubesolo'
  | 'k8sInstall';

export interface EnvironmentOption extends BoxSelectorOption<EnvironmentOptionValue> {
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
    id: 'podman',
    value: 'podman',
    label: 'Podman',
    icon: Podman,
    iconType: 'logo',
    description: 'Connect to Podman via URL/IP or Socket',
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
];

export const newEnvironmentTypes: EnvironmentOption[] = [
  {
    id: 'kubesolo',
    value: 'kubesolo',
    label: 'KubeSolo (Edge)',
    description:
      'Deploy a single-node Kubernetes edge environment with KubeSolo',
    icon: Kubesolo,
    iconType: 'logo',
    feature: FeatureId.KUBESOLO,
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

export const environmentTypes: EnvironmentOption[] = [
  ...existingEnvironmentTypes,
  ...newEnvironmentTypes,
];

export const formTitles: Record<EnvironmentOptionValue, string> = {
  dockerStandalone: 'Connect to your Docker Standalone environment',
  dockerSwarm: 'Connect to your Docker Swarm environment',
  podman: 'Connect to your Podman environment',
  kubernetes: 'Connect to your Kubernetes environment',
  aci: 'Connect to your ACI environment',
  kubesolo: 'Deploy a KubeSolo edge environment',
  k8sInstall: 'Create a Kubernetes cluster',
};
