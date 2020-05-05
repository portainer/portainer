import _ from 'lodash-es';
import {KubernetesStatefulSet} from 'Kubernetes/models/stateful-set/models';
import {KubernetesStatefulSetCreatePayload, KubernetesStatefulSetPatchPayload} from 'Kubernetes/models/stateful-set/payloads';
import {KubernetesPortainerApplicationStackNameLabel, KubernetesPortainerApplicationNameLabel, KubernetesPortainerApplicationOwnerLabel, KubernetesPortainerApplicationNote } from 'Kubernetes/models/application/models';
import KubernetesApplicationHelper from 'Kubernetes/helpers/applicationHelper';
import KubernetesPersistentVolumeClaimConverter from './persistentVolumeClaim';

function bytesValue(mem) {
  return mem * 1000 * 1000;
}

class KubernetesStatefulSetConverter {
  /**
   * Generate KubernetesStatefulSet from KubernetesApplicationFormValues
   * @param {KubernetesApplicationFormValues} formValues
   */
  static applicationFormValuesToStatefulSet(formValues) {
    const res = new KubernetesStatefulSet();
    res.Namespace = formValues.ResourcePool.Namespace.Name;
    res.Name = formValues.Name;
    res.StackName = formValues.StackName ? formValues.StackName : formValues.Name;
    res.ApplicationOwner = formValues.ApplicationOwner;
    res.ReplicaCount = formValues.ReplicaCount;
    res.Image = formValues.Image;
    res.Env = [];
    res.CpuLimit = formValues.CpuLimit;
    res.MemoryLimit = bytesValue(formValues.MemoryLimit);
    KubernetesApplicationHelper.generateEnvFromEnvVariables(res, formValues.EnvironmentVariables);
    KubernetesApplicationHelper.generateVolumesFromPersistedFolders(res, formValues.PersistedFolders);
    KubernetesApplicationHelper.generateEnvOrVolumesFromConfigurations(res, formValues.Configurations);
    return res;
  }

  /**
   * Generate CREATE payload from StatefulSet
   * @param {KubernetesStatefulSetPayload} model StatefulSet to genereate payload from
   */
  static createPayload(statefulSet) {
    const payload = new KubernetesStatefulSetCreatePayload();
    payload.metadata.name = statefulSet.Name;
    payload.metadata.namespace = statefulSet.Namespace;
    payload.metadata.labels[KubernetesPortainerApplicationStackNameLabel] = statefulSet.StackName;
    payload.metadata.labels[KubernetesPortainerApplicationNameLabel] = statefulSet.Name;
    payload.metadata.labels[KubernetesPortainerApplicationOwnerLabel] = statefulSet.ApplicationOwner;
    payload.spec.replicas = statefulSet.ReplicaCount;
    payload.spec.serviceName = statefulSet.ServiceName;
    payload.spec.selector.matchLabels.app = statefulSet.Name;
    payload.spec.volumeClaimTemplates = _.map(statefulSet.VolumeClaims, (item) => KubernetesPersistentVolumeClaimConverter.createPayload(item));
    payload.spec.template.metadata.labels.app = statefulSet.Name;
    payload.spec.template.spec.containers[0].name = statefulSet.Name;
    payload.spec.template.spec.containers[0].image = statefulSet.Image;
    payload.spec.template.spec.containers[0].env = statefulSet.Env;
    payload.spec.template.spec.containers[0].volumeMounts = statefulSet.VolumeMounts;
    payload.spec.template.spec.volumes = statefulSet.Volumes;
    if (statefulSet.MemoryLimit) {
      payload.spec.template.spec.containers[0].resources.limits.memory = statefulSet.MemoryLimit;
      payload.spec.template.spec.containers[0].resources.requests.memory = statefulSet.MemoryLimit;
    }
    if (statefulSet.CpuLimit) {
      payload.spec.template.spec.containers[0].resources.limits.cpu = statefulSet.CpuLimit;
      payload.spec.template.spec.containers[0].resources.requests.cpu = statefulSet.CpuLimit;
    }
    return payload;
  }

  static patchPayload(statefulSet) {
    const payload = new KubernetesStatefulSetPatchPayload();
    delete payload.metadata.uid;
    delete payload.metadata.name;
    delete payload.metadata.namespace;
    payload.metadata.labels[KubernetesPortainerApplicationStackNameLabel] = statefulSet.StackName;
    payload.metadata.annotations[KubernetesPortainerApplicationNote] = statefulSet.Note;
    return payload;
  }
}

export default KubernetesStatefulSetConverter;