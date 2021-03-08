export function ImageDetailsViewModel(data) {
  this.Id = data.Id;
  this.Tag = data.Tag;
  this.Parent = data.Parent;
  this.Repository = data.Repository;
  this.Created = data.Created;
  this.Checked = false;
  this.RepoTags = data.RepoTags;
  this.VirtualSize = data.VirtualSize;
  this.DockerVersion = data.DockerVersion;
  this.Os = data.Os;
  this.Architecture = data.Architecture;
  this.Author = data.Author;
  this.Command = data.Config.Cmd;
  this.Entrypoint = data.ContainerConfig.Entrypoint ? data.ContainerConfig.Entrypoint : '';
  this.ExposedPorts = data.ContainerConfig.ExposedPorts ? Object.keys(data.ContainerConfig.ExposedPorts) : [];
  this.Volumes = data.ContainerConfig.Volumes ? Object.keys(data.ContainerConfig.Volumes) : [];
  this.Env = data.ContainerConfig.Env ? data.ContainerConfig.Env : [];
  this.Labels = data.ContainerConfig.Labels;
}
