export default function KubernetesServiceViewModel(data) {
  this.Id = data.metadata.uid;
  this.Namespace = data.metadata.namespace || '';
  this.Name = data.metadata.name || '';
  this.Type = data.spec.type || '';
  this.ClusterIP = data.spec.clusterIP || '';
  this.ExternalIPs = data.spec.externalIPs || [];
  this.Ports = data.spec.ports || [];
  this.CreatedAt = data.metadata.creationTimestamp || '';
}