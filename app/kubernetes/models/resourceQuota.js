export default function KubernetesResourceQuotaViewModel(data) {
  this.Namespace = data.metadata.namespace;
  this.raw = data;
}
