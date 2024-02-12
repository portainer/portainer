import _ from 'lodash-es';
import * as JsonPatch from 'fast-json-patch';

import { KubernetesPersistentVolumeClaim } from 'Kubernetes/models/volume/models';
import { KubernetesPersistentVolumClaimCreatePayload } from 'Kubernetes/models/volume/payloads';
import { KubernetesPortainerApplicationOwnerLabel, KubernetesPortainerApplicationNameLabel } from 'Kubernetes/models/application/models';

const storageClassToPVCAccessModes = {
  RWO: 'ReadWriteOnce',
  RWX: 'ReadWriteMany',
};

class KubernetesPersistentVolumeClaimConverter {
  static apiToPersistentVolumeClaim(data, storageClasses, yaml) {
    const res = new KubernetesPersistentVolumeClaim();
    res.Id = data.metadata.uid;
    res.Name = data.metadata.name;
    res.Namespace = data.metadata.namespace;
    res.CreationDate = data.metadata.creationTimestamp;
    res.Storage = `${data.spec.resources.requests.storage}B`;
    res.AccessModes = data.spec.accessModes || [];
    res.storageClass = _.find(storageClasses, { Name: data.spec.storageClassName });
    res.Yaml = yaml ? yaml.data : '';
    res.ApplicationOwner = data.metadata.labels ? data.metadata.labels[KubernetesPortainerApplicationOwnerLabel] : '';
    res.ApplicationName = data.metadata.labels ? data.metadata.labels[KubernetesPortainerApplicationNameLabel] : '';
    return res;
  }

  /**
   * Generate KubernetesPersistentVolumeClaim list from KubernetesApplicationFormValues
   * @param {KubernetesApplicationFormValues} formValues
   */
  static applicationFormValuesToVolumeClaims(formValues) {
    _.remove(formValues.PersistedFolders, (item) => item.needsDeletion);
    const res = _.map(formValues.PersistedFolders, (item) => {
      const pvc = new KubernetesPersistentVolumeClaim();
      if (!_.isEmpty(item.existingVolume)) {
        const existantPVC = item.existingVolume.PersistentVolumeClaim;
        pvc.Name = existantPVC.Name;
        if (item.persistentVolumeClaimName) {
          pvc.PreviousName = item.persistentVolumeClaimName;
        }
        pvc.storageClass = existantPVC.storageClass;
        pvc.Storage = existantPVC.Storage.charAt(0);
        pvc.CreationDate = existantPVC.CreationDate;
        pvc.Id = existantPVC.Id;
      } else {
        if (item.persistentVolumeClaimName) {
          pvc.Name = item.persistentVolumeClaimName;
          if (!item.useNewVolume) {
            pvc.PreviousName = item.persistentVolumeClaimName;
          }
        } else {
          pvc.Name = formValues.Name + '-' + pvc.Name;
        }
        pvc.Storage = '' + item.size + item.sizeUnit.charAt(0);
        pvc.storageClass = item.storageClass;
      }
      pvc.MountPath = item.containerPath;
      pvc.Namespace = formValues.ResourcePool.Namespace.Name;
      pvc.ApplicationOwner = formValues.ApplicationOwner;
      pvc.ApplicationName = formValues.Name;
      return pvc;
    });
    return res;
  }

  static createPayload(pvc) {
    const res = new KubernetesPersistentVolumClaimCreatePayload();
    res.metadata.name = pvc.Name;
    res.metadata.namespace = pvc.Namespace;
    res.spec.resources.requests.storage = pvc.Storage;
    res.spec.storageClassName = pvc.storageClass ? pvc.storageClass.Name : '';
    const accessModes = pvc.storageClass && pvc.storageClass.AccessModes ? pvc.storageClass.AccessModes.map((accessMode) => storageClassToPVCAccessModes[accessMode]) : [];
    res.spec.accessModes = accessModes;
    res.metadata.labels.app = pvc.ApplicationName;
    res.metadata.labels[KubernetesPortainerApplicationOwnerLabel] = pvc.ApplicationOwner;
    res.metadata.labels[KubernetesPortainerApplicationNameLabel] = pvc.ApplicationName;
    return res;
  }

  static patchPayload(oldPVC, newPVC) {
    const oldPayload = KubernetesPersistentVolumeClaimConverter.createPayload(oldPVC);
    const newPayload = KubernetesPersistentVolumeClaimConverter.createPayload(newPVC);
    const payload = JsonPatch.compare(oldPayload, newPayload);
    return payload;
  }
}

export default KubernetesPersistentVolumeClaimConverter;
