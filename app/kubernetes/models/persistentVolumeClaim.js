import _ from 'lodash-es';
import {KubernetesApplicationVolumeName} from 'Kubernetes/models/application';

export default function KubernetesPersistentVolumeClaimsFromApplication(applicationFormValues) {
    this.Claims = [];

  _.forEach(applicationFormValues.PersistedFolders, (item) => {
    const pvc = {
      Name: KubernetesApplicationVolumeName(applicationFormValues.Name, item.ContainerPath),
      Namespace: applicationFormValues.ResourcePool.Namespace.Name,
      StackName: applicationFormValues.StackName ? applicationFormValues.StackName : applicationFormValues.Name,
      Storage: item.Size,
      StorageClass: item.StorageClass
    };

    this.Claims.push(pvc);
  });
}

