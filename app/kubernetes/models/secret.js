export default function KubernetesSecretViewModel(data) {
  this.Id = data.metadata.uid;
  this.Name = data.metadata.name;
  this.Namespace = data.metadata.namespace;
  this.Type = data.type;
  this.CreatedAt = data.metadata.creationTimestamp;
}
