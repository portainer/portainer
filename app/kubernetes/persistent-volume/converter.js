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
    pv.NFSVersion = fv.NFSVersion;
    pv.NFSMountPoint = fv.NFSMountPoint;
    pv.NFSOptions = _.split(fv.NFSOptions, ',');
    return pv;
  }

  static apiToPersistentVolume(data, storageClasses) {
    const pv = new KubernetesPersistentVolume();
    pv.Name = data.metadata.name;
    pv.StorageClass = _.find(storageClasses, { Name: data.spec.storageClassName });
    pv.Size = data.spec.capacity.storage;
    pv.NFSAddress = data.spec.nfs.server;
    const nfsVersion = _.remove(data.spec.mountOptions, (opt) => {
      return _.startsWith(opt, 'nfsvers=');
    });
    pv.NFSVersion = nfsVersion[0] || '';
    pv.NFSMountPoint = data.spec.nfs.path;
    pv.NFSOptions = data.spec.mountOptions;
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
    res.spec.mountOptions = pv.NFSOptions;
    res.spec.mountOptions.push('nfsvers=' + pv.NFSVersion);
    return res;
  }
}

export default KubernetesPersistentVolumeConverter;
