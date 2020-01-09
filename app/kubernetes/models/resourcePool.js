export default function KubernetesResourcePoolViewModel(data) {
  this.Id = data.metadata.uid;
  this.Name = data.metadata.name;
  this.CreatedAt = data.metadata.creationTimestamp;
  this.Quotas = [];
}