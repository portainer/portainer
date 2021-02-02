import _ from 'lodash-es';
import { KubernetesPersistentVolume } from 'Kubernetes/models/volume/models';
import { KubernetesPersistentVolumeCreatePayload } from 'Kubernetes/persistent-volume/payloads';

class KubernetesPersistentVolumeConverter {
  static formValuesToPersistentVolume(fv) {
    const pv = new KubernetesPersistentVolume();
    pv.Name = fv.Name;
    pv.StorageClass = fv.StorageClass;
    pv.Size = fv.Size + fv.SizeUnit;
    pv.isNFSVolume = fv.isNFSVolume;
    pv.NFSAddress = fv.NFSAddress;
    pv.NFSMountPoint = fv.NFSMountPoint;
    return pv;
  }

  static apiToPersistentVolume(data, storageClasses) {
    const pv = new KubernetesPersistentVolume();
    pv.Name = data.metadata.name;
    pv.StorageClass = _.find(storageClasses, { Name: data.spec.storageClassName });
    pv.Size = data.spec.capacity.storage;
    if (data.spec.nfs) {
      pv.NFSAddress = data.spec.nfs.server;
      pv.NFSMountPoint = data.spec.nfs.path;
    }
    return pv;
  }

  static createPayload(pv) {
    const res = new KubernetesPersistentVolumeCreatePayload();
    res.metadata.name = pv.Name;
    res.spec.storageClassName = pv.StorageClass.Name;
    res.spec.capacity = {
      storage: pv.Size.replace('B', 'i'),
    };
    res.spec.nfs = {
      path: pv.NFSMountPoint,
      server: pv.NFSAddress,
    };
    return res;
  }
}

export default KubernetesPersistentVolumeConverter;
