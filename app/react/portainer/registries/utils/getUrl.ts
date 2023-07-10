import { Registry, RegistryTypes } from '../types/registry';

export function getURL(registry: Registry) {
  switch (registry.Type) {
    case RegistryTypes.GITLAB:
      return `${registry.URL}/${registry.Gitlab.ProjectPath}`;

    case RegistryTypes.QUAY:
      return getQuayUrl(registry);

    case RegistryTypes.GITHUB:
      return getGithubUrl(registry);

    default:
      return registry.URL;
  }

  function getGithubUrl(registry: Registry) {
    const name = registry.Github.UseOrganisation
      ? registry.Github.OrganisationName
      : registry.Username;
    return `${registry.URL}/${name}`;
  }

  function getQuayUrl(registry: Registry) {
    const name = registry.Quay.UseOrganisation
      ? registry.Quay.OrganisationName
      : registry.Username;
    return `${registry.URL}/${name}`;
  }
}
