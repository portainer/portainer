import _ from 'lodash-es';

import { KubernetesApplicationStackAnnotationKey } from 'Kubernetes/models/application/models';
import { KubernetesPersistentVolumeClaim } from 'Kubernetes/models/volume/models';
import KubernetesApplicationHelper from 'Kubernetes/helpers/applicationHelper';
import { KubernetesPersistentVolumClaimCreatePayload } from 'Kubernetes/models/volume/payloads';

class KubernetesPersistentVolumeClaimConverter {
  /**
   * Generate KubernetesPersistentVolumeClaim list from KubernetesApplicationFormValues
   * @param {KubernetesApplicationFormValues} formValues 
   */
  static applicationFormValuesToVolumeClaims(formValues) {
    const res = _.map(formValues.PersistedFolders, (item) => {
      const pvc = new KubernetesPersistentVolumeClaim();
      pvc.Name = KubernetesApplicationHelper.generateApplicationVolumeName(formValues.Name, item.ContainerPath);
      pvc.Namespace = formValues.ResourcePool.Namespace.Name;
      pvc.StackName = formValues.StackName ? formValues.StackName : formValues.Name;
      pvc.Storage = item.Size;
      pvc.StorageClass = item.StorageClass;
      return pvc;
    });
    return res;
  }

  static createPayload(data) {
    const res = new KubernetesPersistentVolumClaimCreatePayload();
    res.metadata.name = data.Name;
    res.metadata.namespace = data.Namespace;
    res.metadata.annotations[KubernetesApplicationStackAnnotationKey] = data.StackName;
    res.spec.resources.requests.storage = data.Storage;
    res.spec.storageClassName = data.StorageClass.Name;
    return res;
  }
}

export default KubernetesPersistentVolumeClaimConverter;