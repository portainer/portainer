export default function KubernetesDefaultLimitRangeModel(namespace) {
  this.Name = KubernetesPortainerLimitRangeSuffix + namespace;
  this.Namespace = namespace;
  this.Limits = [
    {
      default: {
        memory: '64Mi',
        cpu: '100m'
      },
      type: 'Container'
    }
  ];
}

export function KubernetesLimitRangeViewModel(data) {
  this.Id = data.metadata.uid;
  this.Namespace = data.metadata.namespace;
  this.Name = data.metadata.name;
}

export const KubernetesLimitRangeDefaults = {
  CpuLimit: 0.10,
  MemoryLimit: 64 // MB
};

export const KubernetesPortainerLimitRangeSuffix = 'portainer-lr-';