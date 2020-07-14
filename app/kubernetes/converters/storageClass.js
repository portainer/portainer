import { KubernetesStorageClass } from 'Kubernetes/models/storage-class/models';

class KubernetesStorageClassConverter {
  /**
   * API StorageClass to front StorageClass
   */
  static apiToStorageClass(data) {
    const res = new KubernetesStorageClass();
    res.Name = data.metadata.name;
    res.Provisioner = data.provisioner;
    return res;
  }
}

export default KubernetesStorageClassConverter;
