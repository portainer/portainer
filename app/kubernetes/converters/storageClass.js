import { KubernetesStorageClass } from 'Kubernetes/models/storage-class/models';

class KubernetesStorageClassConverter {
  /**
   * API StorageClass to front StorageClass
   */
  static apiToStorageClass(data) {
    const res = new KubernetesStorageClass();
    res.Name = data.metadata.name;
    return res;
  }
}

export default KubernetesStorageClassConverter;