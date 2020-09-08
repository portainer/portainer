export function RegistryImageDetailsViewModel(data) {
  this.Id = data.id;
  this.Parent = data.parent;
  this.Created = data.created;
  this.DockerVersion = data.docker_version;
  this.Os = data.os;
  this.Architecture = data.architecture;
  this.Author = data.author;
  this.Command = data.config.Cmd;
  this.Entrypoint = data.container_config.Entrypoint ? data.container_config.Entrypoint : '';
  this.ExposedPorts = data.container_config.ExposedPorts ? Object.keys(data.container_config.ExposedPorts) : [];
  this.Volumes = data.container_config.Volumes ? Object.keys(data.container_config.Volumes) : [];
  this.Env = data.container_config.Env ? data.container_config.Env : [];
}
