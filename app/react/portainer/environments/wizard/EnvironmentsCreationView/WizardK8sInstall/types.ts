import { K8sDistributionType, KaasProvider } from '../../../types';

export type ProvisionOption = KaasProvider | K8sDistributionType;

export const providerTitles: Record<KaasProvider, string> = {
  civo: 'Civo',
  linode: 'Linode',
  digitalocean: 'DigitalOcean',
  gke: 'Google Cloud',
  amazon: 'AWS',
  azure: 'Azure',
};

export const k8sInstallTitles: Record<K8sDistributionType, string> = {
  microk8s: 'MicroK8s',
};

export const provisionOptionTitles: Record<ProvisionOption, string> = {
  ...providerTitles,
  ...k8sInstallTitles,
};
