import * as JsonPatch from 'fast-json-patch';
import { KubernetesDaemonSet } from 'Kubernetes/models/daemon-set/models';
import { KubernetesDaemonSetCreatePayload } from 'Kubernetes/models/daemon-set/payloads';
import {
  KubernetesPortainerApplicationStackNameLabel,
  KubernetesPortainerApplicationNameLabel,
  KubernetesPortainerApplicationNote,
  KubernetesPortainerApplicationOwnerLabel,
} from 'Kubernetes/models/application/models';
import KubernetesApplicationHelper from 'Kubernetes/helpers/application';
import KubernetesResourceReservationHelper from 'Kubernetes/helpers/resourceReservationHelper';
import KubernetesCommonHelper from 'Kubernetes/helpers/commonHelper';
import { buildImageFullURI } from 'Docker/helpers/imageHelper';

class KubernetesDaemonSetConverter {
  /**
   * Generate KubernetesDaemonSet from KubernetesApplicationFormValues
   * @param {KubernetesApplicationFormValues} formValues
   */
  static applicationFormValuesToDaemonSet(formValues, volumeClaims) {
    const res = new KubernetesDaemonSet();
    res.Namespace = formValues.ResourcePool.Namespace.Name;
    res.Name = formValues.Name;
    res.StackName = formValues.StackName ? formValues.StackName : formValues.Name;
    res.ApplicationOwner = formValues.ApplicationOwner;
    res.ApplicationName = formValues.Name;
    res.ImageModel = formValues.ImageModel;
    res.CpuLimit = formValues.CpuLimit;
    res.MemoryLimit = KubernetesResourceReservationHelper.bytesValue(formValues.MemoryLimit);
    res.Env = KubernetesApplicationHelper.generateEnvFromEnvVariables(formValues.EnvironmentVariables);
    KubernetesApplicationHelper.generateVolumesFromPersistentVolumClaims(res, volumeClaims);
    KubernetesApplicationHelper.generateEnvOrVolumesFromConfigurations(res, formValues.Configurations);
    KubernetesApplicationHelper.generateAffinityFromPlacements(res, formValues);
    return res;
  }

  /**
   * Generate CREATE payload from DaemonSet
   * @param {KubernetesDaemonSetPayload} model DaemonSet to generate payload from
   */
  static createPayload(daemonSet) {
    const payload = new KubernetesDaemonSetCreatePayload();
    payload.metadata.name = daemonSet.Name;
    payload.metadata.namespace = daemonSet.Namespace;
    payload.metadata.labels[KubernetesPortainerApplicationStackNameLabel] = daemonSet.StackName;
    payload.metadata.labels[KubernetesPortainerApplicationNameLabel] = daemonSet.ApplicationName;
    payload.metadata.labels[KubernetesPortainerApplicationOwnerLabel] = daemonSet.ApplicationOwner;
    payload.metadata.annotations[KubernetesPortainerApplicationNote] = daemonSet.Note;
    payload.spec.replicas = daemonSet.ReplicaCount;
    payload.spec.selector.matchLabels.app = daemonSet.Name;
    payload.spec.template.metadata.labels.app = daemonSet.Name;
    payload.spec.template.metadata.labels[KubernetesPortainerApplicationNameLabel] = daemonSet.ApplicationName;
    payload.spec.template.spec.containers[0].name = daemonSet.Name;
    payload.spec.template.spec.containers[0].image = buildImageFullURI(daemonSet.ImageModel);
    if (daemonSet.ImageModel.Registry && daemonSet.ImageModel.Registry.Authentication) {
      payload.spec.template.spec.imagePullSecrets = [{ name: `registry-${daemonSet.ImageModel.Registry.Id}` }];
    }
    payload.spec.template.spec.affinity = daemonSet.Affinity;
    KubernetesCommonHelper.assignOrDeleteIfEmpty(payload, 'spec.template.spec.containers[0].env', daemonSet.Env);
    KubernetesCommonHelper.assignOrDeleteIfEmpty(payload, 'spec.template.spec.containers[0].volumeMounts', daemonSet.VolumeMounts);
    KubernetesCommonHelper.assignOrDeleteIfEmpty(payload, 'spec.template.spec.volumes', daemonSet.Volumes);
    if (daemonSet.MemoryLimit) {
      payload.spec.template.spec.containers[0].resources.limits.memory = daemonSet.MemoryLimit;
      payload.spec.template.spec.containers[0].resources.requests.memory = daemonSet.MemoryLimit;
    }
    if (daemonSet.CpuLimit) {
      payload.spec.template.spec.containers[0].resources.limits.cpu = daemonSet.CpuLimit;
      payload.spec.template.spec.containers[0].resources.requests.cpu = daemonSet.CpuLimit;
    }
    if (!daemonSet.CpuLimit && !daemonSet.MemoryLimit) {
      delete payload.spec.template.spec.containers[0].resources;
    }
    return payload;
  }

  static patchPayload(oldDaemonSet, newDaemonSet) {
    const oldPayload = KubernetesDaemonSetConverter.createPayload(oldDaemonSet);
    const newPayload = KubernetesDaemonSetConverter.createPayload(newDaemonSet);
    const payload = JsonPatch.compare(oldPayload, newPayload);
    return payload;
  }
}

export default KubernetesDaemonSetConverter;
