export function ImageDetailsViewModel(data) {
  this.Id = data.Id;
  this.Tag = data.Tag;
  this.Parent = data.Parent;
  this.Repository = data.Repository;
  this.Created = data.Created;
  this.Checked = false;
  this.RepoTags = data.RepoTags;
  this.Size = data.Size;
  this.DockerVersion = data.DockerVersion;
  this.Os = data.Os;
  this.Architecture = data.Architecture;
  this.Author = data.Author;
  this.Command = data.Config.Cmd;

  let config = {};
  if (data.Config) {
    config = data.Config; // this is part of OCI images-spec
  } else if (data.ContainerConfig != null) {
    config = data.ContainerConfig; // not OCI ; has been removed in Docker 26 (API v1.45) along with .Container
  }
  this.Entrypoint = config.Entrypoint ? config.Entrypoint : '';
  this.ExposedPorts = config.ExposedPorts ? Object.keys(config.ExposedPorts) : [];
  this.Volumes = config.Volumes ? Object.keys(config.Volumes) : [];
  this.Env = config.Env ? config.Env : [];
  this.Labels = config.Labels;
}
