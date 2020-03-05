import { KubernetesLimitRange } from 'Kubernetes/models/limit-range/models';
import { KubernetesLimitRangeCreatePayload } from 'Kubernetes/models/limit-range/payloads';

class KubernetesLimitRangeConverter {
  static apiToLimitRange(data, yaml) {
    const res = new KubernetesLimitRange();
    res.Id = data.metadata.uid;
    res.Namespace = data.metadata.namespace;
    res.Name = data.metadata.name;
    res.Yaml = yaml ? yaml.data : '';
    return res;
  }

  static createPayload(limitRange) {
    const res = new KubernetesLimitRangeCreatePayload();
    res.metadata.name = limitRange.Name;
    res.metadata.namespace = limitRange.Namespace;
    res.spec.limits[0].default.cpu = limitRange.CPU;
    res.spec.limits[0].default.memory = limitRange.Memory;
    if (!limitRange.CPU || limitRange.CPU === 0) {
      delete res.spec.limits[0].default.cpu;
    }
    if (!limitRange.Memory || limitRange.Memory === 0) {
      delete res.spec.limits[0].default.memory;
    }
    return res;
  }
}

export default KubernetesLimitRangeConverter;