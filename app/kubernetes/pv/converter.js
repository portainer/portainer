import { KubernetesPV } from 'Kubernetes/models/volume/models';
import { KubernetesPVCreatePayload } from 'Kubernetes/pv/payloads';
class KubernetesPVConverter {
  static apiToPV(data) {
    const res = new KubernetesPV();
    res.Name = data.metadata.name;
    res.ResourcePool = {};
    res.StorageClass = {};
    res.Size = '';
    res.NFS = false;
    res.NFSAddress = '';
    res.NFSVersion = '';
    res.NFSMountPoint = '';
    res.NFSOptions = '';
    return res;
  }

  static formValuesToPV(formValues) {
    const pv = new KubernetesPV();
    pv.Name = formValues.Name;
    pv.ResourcePool = formValues.ResourcePool;
    pv.StorageClass = formValues.StorageClass;
    pv.NFS = formValues.NFS;

    /*
    Name: '',
  ResourcePool: {}, // KubernetesResourcePool
  StorageClass: {}, // KubernetesStorageClass
  Size: '',
  NFS: false,
  NFSAddress: '',
  NFSVersion: '',
  NFSMountPoint: '',
  NFSOptions: '',
    */
    return pv;
  }

  static createPayload(pv) {
    const res = new KubernetesPVCreatePayload();
    res.metadata.name = pv.Name;
    res.spec.storageClassName = pv.StorageClass.Name;
    return res;
  }
}

export default KubernetesPVConverter;
