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
  this.Entrypoint = data.Config.Entrypoint ? data.Config.Entrypoint : '';
  this.ExposedPorts = data.Config.ExposedPorts ? Object.keys(data.Config.ExposedPorts) : [];
  this.Volumes = data.Config.Volumes ? Object.keys(data.Config.Volumes) : [];
  this.Env = data.Config.Env ? data.Config.Env : [];
  this.Labels = data.Config.Labels;
}
