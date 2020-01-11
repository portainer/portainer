export default function KubernetesResourceQuotaViewModel(data) {
  this.Namespace = data.metadata.namespace;
  this.CpuLimit = parseInt(data.spec.hard['limits.cpu']) || 0;
  this.MemoryLimit = parseInt(data.spec.hard['limits.memory']) || 0;
}
