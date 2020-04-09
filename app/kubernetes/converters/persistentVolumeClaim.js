import _ from 'lodash-es';

import { KubernetesPersistentVolumeClaim } from 'Kubernetes/models/volume/models';
import KubernetesApplicationHelper from 'Kubernetes/helpers/applicationHelper';
import { KubernetesPersistentVolumClaimCreatePayload } from 'Kubernetes/models/volume/payloads';
import { KubernetesPortainerApplicationOwnerLabel } from 'Kubernetes/models/application/models';

class KubernetesPersistentVolumeClaimConverter {

  static apiToPersistentVolumeClaim(data, storageClasses, yaml) {
    const res = new KubernetesPersistentVolumeClaim();
    res.Id = data.metadata.uid;
    res.Name = data.metadata.name;
    res.Namespace = data.metadata.namespace;
    res.CreationDate = data.metadata.creationTimestamp;
    res.Storage = data.spec.resources.requests.storage + 'B';
    res.StorageClass = _.find(storageClasses, {Name: data.spec.storageClassName});
    res.Yaml = yaml ? yaml.data : '';
    res.ApplicationOwner = data.metadata.labels ? data.metadata.labels[KubernetesPortainerApplicationOwnerLabel] : '';
    return res;
  }

  /**
   * Generate KubernetesPersistentVolumeClaim list from KubernetesApplicationFormValues
   * @param {KubernetesApplicationFormValues} formValues
   */
  static applicationFormValuesToVolumeClaims(formValues) {
    const res = _.map(formValues.PersistedFolders, (item) => {
      const pvc = new KubernetesPersistentVolumeClaim();
      pvc.Name = KubernetesApplicationHelper.generateApplicationVolumeName(formValues.Name, item.ContainerPath);
      pvc.Namespace = formValues.ResourcePool.Namespace.Name;
      pvc.Storage = '' + item.Size + item.SizeUnit.charAt(0);
      pvc.StorageClass = item.StorageClass;
      pvc.ApplicationOwner = formValues.ApplicationOwner;
      return pvc;
    });
    return res;
  }

  static createPayload(data) {
    const res = new KubernetesPersistentVolumClaimCreatePayload();
    res.metadata.name = data.Name;
    res.metadata.namespace = data.Namespace;
    res.spec.resources.requests.storage = data.Storage;
    res.spec.storageClassName = data.StorageClass.Name;
    res.metadata.labels[KubernetesPortainerApplicationOwnerLabel] = data.ApplicationOwner;
    return res;
  }
}

export default KubernetesPersistentVolumeClaimConverter;
