import i18n from '@/i18n';
import { FeatureId } from '@/react/portainer/feature-flags/enums';
import Docker from '@/assets/ico/vendor/docker.svg?c';
import Podman from '@/assets/ico/vendor/podman.svg?c';
import Kubernetes from '@/assets/ico/vendor/kubernetes.svg?c';
import Azure from '@/assets/ico/vendor/azure.svg?c';
import KaaS from '@/assets/ico/vendor/kaas-icon.svg?c';
import InstallK8s from '@/assets/ico/vendor/install-kubernetes.svg?c';

import { BoxSelectorOption } from '@@/BoxSelector';

export type EnvironmentOptionValue =
  | 'dockerStandalone'
  | 'dockerSwarm'
  | 'podman'
  | 'kubernetes'
  | 'aci'
  | 'kaas'
  | 'k8sInstall';

export interface EnvironmentOption
  extends BoxSelectorOption<EnvironmentOptionValue> {
  id: EnvironmentOptionValue;
  value: EnvironmentOptionValue;
}

export function getExistingEnvironmentTypes(): EnvironmentOption[] {
  return [
    {
      id: 'dockerStandalone',
      value: 'dockerStandalone',
      label: i18n.t('wizard_env_types.docker_standalone_label'),
      icon: Docker,
      iconType: 'logo',
      description: i18n.t('wizard_env_types.docker_standalone_description'),
    },
    {
      id: 'dockerSwarm',
      value: 'dockerSwarm',
      label: i18n.t('wizard_env_types.docker_swarm_label'),
      icon: Docker,
      iconType: 'logo',
      description: i18n.t('wizard_env_types.docker_swarm_description'),
    },
    {
      id: 'podman',
      value: 'podman',
      label: i18n.t('wizard_env_types.podman_label'),
      icon: Podman,
      iconType: 'logo',
      description: i18n.t('wizard_env_types.podman_description'),
    },
    {
      id: 'kubernetes',
      value: 'kubernetes',
      label: i18n.t('wizard_env_types.kubernetes_label'),
      icon: Kubernetes,
      iconType: 'logo',
      description: i18n.t('wizard_env_types.kubernetes_description'),
    },
    {
      id: 'aci',
      value: 'aci',
      label: i18n.t('wizard_env_types.aci_label'),
      description: i18n.t('wizard_env_types.aci_description'),
      iconType: 'logo',
      icon: Azure,
    },
  ];
}

export function getNewEnvironmentTypes(): EnvironmentOption[] {
  return [
    {
      id: 'kaas',
      value: 'kaas',
      label: i18n.t('wizard_env_types.kaas_label'),
      description: i18n.t('wizard_env_types.kaas_description'),
      icon: KaaS,
      iconType: 'logo',
      feature: FeatureId.KAAS_PROVISIONING,
      disabledWhenLimited: true,
    },
    {
      id: 'k8sInstall',
      value: 'k8sInstall',
      label: i18n.t('wizard_env_types.k8s_install_label'),
      description: i18n.t('wizard_env_types.k8s_install_description'),
      icon: InstallK8s,
      iconType: 'logo',
      feature: FeatureId.K8SINSTALL,
      disabledWhenLimited: true,
    },
  ];
}

export function getEnvironmentTypes(): EnvironmentOption[] {
  return [...getExistingEnvironmentTypes(), ...getNewEnvironmentTypes()];
}

export function getFormTitles(): Record<EnvironmentOptionValue, string> {
  return {
    dockerStandalone: i18n.t('wizard_env_types.form_title_docker_standalone'),
    dockerSwarm: i18n.t('wizard_env_types.form_title_docker_swarm'),
    podman: i18n.t('wizard_env_types.form_title_podman'),
    kubernetes: i18n.t('wizard_env_types.form_title_kubernetes'),
    aci: i18n.t('wizard_env_types.form_title_aci'),
    kaas: i18n.t('wizard_env_types.form_title_kaas'),
    k8sInstall: i18n.t('wizard_env_types.form_title_k8s_install'),
  };
}
