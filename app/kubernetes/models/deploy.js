export const KubernetesDeployManifestTypes = Object.freeze({
  KUBERNETES: 1,
  COMPOSE: 2,
});

export const KubernetesDeployBuildMethods = Object.freeze({
  GIT: 1,
  WEB_EDITOR: 2,
});

export const KubernetesDeployRequestMethods = Object.freeze({
  REPOSITORY: 'repository',
  STRING: 'string',
});
