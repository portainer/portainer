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
  
  var config = null;
  // See Api-Spec: https://github.com/moby/moby/blob/master/image/image.go
  if ("Config" in data && data.Config != null) {
    // First try get image configuration received from the client
    config = data.Config;
  } else if ("ContainerConfig" in data && data.ContainerConfig != null) {
    // Second try get image configuration that is committed into the image
    config = data.ContainerConfig;
  }
  
  if (config) {
    this.Entrypoint = config.Entrypoint ? config.Entrypoint : '';
    this.ExposedPorts = config.ExposedPorts ? Object.keys(config.ExposedPorts) : [];
    this.Volumes = config.Volumes ? Object.keys(config.Volumes) : [];
    this.Env = config.Env ? config.Env : [];
    this.Labels = config.Labels;
  } else {
    this.Entrypoint = '';
    this.ExposedPorts = [];
    this.Volumes = [];
    this.Env = [];
    this.Labels = null;
  }
}
