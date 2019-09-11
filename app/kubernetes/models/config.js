export default function KubernetesConfigViewModel(data) {
  this.Id = data.metadata.uid;
  this.Name = data.metadata.name;
  this.Namespace = data.metadata.namespace;
  this.CreatedAt = data.metadata.creationTimestamp;
}
