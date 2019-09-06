export default function KubernetesNamespaceViewModel(data) {
  this.Id = data.metadata.uid;
  this.Name = data.metadata.name;
  this.CreatedAt = data.metadata.creationTimestamp;
  this.Status = data.status.phase;
}