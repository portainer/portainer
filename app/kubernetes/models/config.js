export function KubernetesConfigViewModel(data) {
  this.Id = data.metadata.uid;
  this.Name = data.metadata.name;
  this.Namespace = data.metadata.namespace;
  this.CreatedAt = data.metadata.creationTimestamp;
}

export function KubernetesConfigDetailsViewModel(data, yaml) {
  Object.assign(this, new KubernetesConfigViewModel(data));
  this.Labels = data.metadata.labels;
  this.Data = data.data;
  this.Yaml = yaml;
}