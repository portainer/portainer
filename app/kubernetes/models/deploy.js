export const KubernetesDeployManifestTypes = Object.freeze({
  KUBERNETES: 1,
});

export const KubernetesDeployBuildMethods = Object.freeze({
  GIT: 1,
  WEB_EDITOR: 2,
  CUSTOM_TEMPLATE: 3,
  URL: 4,
  HELM: 5,
});

export const KubernetesDeployRequestMethods = Object.freeze({
  REPOSITORY: 'repository',
  STRING: 'string',
  URL: 'url',
});

export const RepositoryMechanismTypes = Object.freeze({
  WEBHOOK: 'Webhook',
  INTERVAL: 'Interval',
});
