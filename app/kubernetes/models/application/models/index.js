export * from './constants';

export { Application as KubernetesApplication } from './Application';
export { ConfigurationVolume as KubernetesApplicationConfigurationVolume } from './ConfigurationVolume';
export { PersistedFolder as KubernetesApplicationPersistedFolder } from './PersistedFolder';

/**
 * HelmApplication Model (Composite)
 */
export class HelmApplication {
  constructor() {
    this.Id = '';
    this.Name = '';
    this.KubernetesApplications = [];
    this.ApplicationOwner = '';
    this.CreationDate = 0;
    this.ApplicationType = 'Unknown';
    this.Status = '';
    this.StackName = '-';
    this.ResourcePool = '-';
    this.Image = '-';
    this.PublishedPorts = [];
  }
}

/**
 * KubernetesApplicationPort Model
 */
const _KubernetesApplicationPort = Object.freeze({
  IngressRules: [], // KubernetesIngressRule[]
  NodePort: 0,
  TargetPort: 0,
  Port: 0,
  Protocol: '',
});

export class KubernetesApplicationPort {
  constructor() {
    Object.assign(this, JSON.parse(JSON.stringify(_KubernetesApplicationPort)));
  }
}

export const KubernetesDeploymentTypes = Object.freeze({
  GIT: 'git',
  CONTENT: 'content',
  APPLICATION_FORM: 'application form',
  URL: 'url',
});
