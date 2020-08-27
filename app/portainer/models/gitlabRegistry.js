export function RegistryGitlabProject(project) {
  this.Id = project.id;
  this.Description = project.description;
  this.Name = project.name;
  this.Namespace = project.namespace ? project.namespace.name : '';
  this.PathWithNamespace = project.path_with_namespace;
  this.RegistryEnabled = project.container_registry_enabled;
}
