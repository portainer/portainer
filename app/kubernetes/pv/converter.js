import _ from 'lodash-es';
import { KubernetesPV } from 'Kubernetes/models/volume/models';
import { KubernetesPVCreatePayload } from 'Kubernetes/pv/payloads';
class KubernetesPVConverter {
  static apiToPV(data) {
    const res = new KubernetesPV();
    res.Name = data.metadata.name;
    res.ResourcePool = {};
    res.StorageClass = {};
    res.Size = '';
    res.isNFSVolume = false;
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
    pv.Size = formValues.Size + formValues.SizeUnit;
    if (formValues.isNFSVolume) {
      pv.isNFSVolume = formValues.isNFSVolume;
      pv.NFSAddress = formValues.NFSAddress;
      pv.NFSVersion = formValues.NFSVersion;
      pv.NFSMountPoint = formValues.NFSMountPoint;
      pv.NFSOptions = _.split(formValues.NFSOptions, ',');
    } else {
      pv.isNFSVolume = formValues.isNFSVolume;
    }
    return pv;
  }

  static createPayload(pv) {
    const res = new KubernetesPVCreatePayload();
    res.metadata.name = pv.Name;
    res.spec.storageClassName = pv.StorageClass.Name;
    res.spec.capacity = {
      storage: pv.Size.replace('B', 'i'),
    };
    if (pv.isNFSVolume) {
      res.spec.nfs = {
        path: pv.NFSMountPoint,
        server: pv.NFSAddress,
      };
      res.spec.mountOptions = pv.NFSOptions;
      res.spec.mountOptions.push('nfsvers=' + pv.NFSVersion);
    } else {
      // res.spec.
    }
    return res;
  }
}

export default KubernetesPVConverter;
