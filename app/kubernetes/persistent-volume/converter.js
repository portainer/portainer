import _ from 'lodash-es';
import { KubernetesPersistentVolume } from 'Kubernetes/models/volume/models';
import { KubernetesPersistentVolumeCreatePayload } from 'Kubernetes/persistent-volume/payloads';
import KubernetesVolumeHelper from 'Kubernetes/helpers/volumeHelper';

class KubernetesPersistentVolumeConverter {
  /**
   * Converts KubernetesVolumeFormValues to KubernetesPersistentVolume
   * @param {KubernetesVolumeFormValues} fv
   */
  static formValuesToPersistentVolume(fv) {
    const pv = new KubernetesPersistentVolume();
    pv.Name = KubernetesVolumeHelper.generateVolumeName(fv.Name);
    pv.Size = fv.Size + fv.SizeUnit;
    pv.NFSAddress = fv.NFSAddress;
    pv.NFSMountPoint = fv.NFSMountPoint;
    return pv;
  }

  static apiToPersistentVolume(data, storageClasses) {
    const pv = new KubernetesPersistentVolume();
    pv.Id = data.metadata.id;
    pv.Name = data.metadata.name;
    pv.Size = data.spec.capacity.storage.replace('i', 'B');
    if (data.spec.storageClassName) {
      pv.StorageClass = _.find(storageClasses, { Name: data.spec.storageClassName });
    }
    if (data.spec.nfs) {
      pv.NFSAddress = data.spec.nfs.server;
      pv.NFSMountPoint = data.spec.nfs.path;
    }
    return pv;
  }

  static createPayload(pv) {
    const res = new KubernetesPersistentVolumeCreatePayload();
    res.metadata.name = pv.Name;
    res.spec.capacity.storage = pv.Size.replace('B', 'i');
    res.spec.nfs.path = pv.NFSMountPoint;
    res.spec.nfs.server = pv.NFSAddress;
    return res;
  }
}

export default KubernetesPersistentVolumeConverter;
