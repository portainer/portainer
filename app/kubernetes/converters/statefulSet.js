import _ from 'lodash-es';
import * as JsonPatch from 'fast-json-patch';

import { KubernetesStatefulSet } from 'Kubernetes/models/stateful-set/models';
import { KubernetesStatefulSetCreatePayload } from 'Kubernetes/models/stateful-set/payloads';
import {
  KubernetesPortainerApplicationStackNameLabel,
  KubernetesPortainerApplicationNameLabel,
  KubernetesPortainerApplicationOwnerLabel,
  KubernetesPortainerApplicationNote,
} from 'Kubernetes/models/application/models';
import KubernetesApplicationHelper from 'Kubernetes/helpers/application';
import KubernetesResourceReservationHelper from 'Kubernetes/helpers/resourceReservationHelper';
import KubernetesCommonHelper from 'Kubernetes/helpers/commonHelper';
import { buildImageFullURI } from 'Docker/helpers/imageHelper';
import KubernetesPersistentVolumeClaimConverter from './persistentVolumeClaim';

class KubernetesStatefulSetConverter {
  /**
   * Generate KubernetesStatefulSet from KubernetesApplicationFormValues
   * @param {KubernetesApplicationFormValues} formValues
   */
  static applicationFormValuesToStatefulSet(formValues, volumeClaims) {
    const res = new KubernetesStatefulSet();
    res.Namespace = formValues.ResourcePool.Namespace.Name;
    res.Name = formValues.Name;
    res.StackName = formValues.StackName ? formValues.StackName : formValues.Name;
    res.ApplicationOwner = formValues.ApplicationOwner;
    res.ApplicationName = formValues.Name;
    res.ReplicaCount = formValues.ReplicaCount;
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
   * Generate CREATE payload from StatefulSet
   * @param {KubernetesStatefulSetPayload} model StatefulSet to genereate payload from
   */
  static createPayload(statefulSet) {
    const payload = new KubernetesStatefulSetCreatePayload();
    payload.metadata.name = statefulSet.Name;
    payload.metadata.namespace = statefulSet.Namespace;
    payload.metadata.labels[KubernetesPortainerApplicationStackNameLabel] = statefulSet.StackName;
    payload.metadata.labels[KubernetesPortainerApplicationNameLabel] = statefulSet.ApplicationName;
    payload.metadata.labels[KubernetesPortainerApplicationOwnerLabel] = statefulSet.ApplicationOwner;
    payload.metadata.annotations[KubernetesPortainerApplicationNote] = statefulSet.Note;
    payload.spec.replicas = statefulSet.ReplicaCount;
    payload.spec.serviceName = statefulSet.ServiceName;
    payload.spec.selector.matchLabels.app = statefulSet.Name;
    payload.spec.volumeClaimTemplates = _.map(statefulSet.VolumeClaims, (item) => KubernetesPersistentVolumeClaimConverter.createPayload(item));
    payload.spec.template.metadata.labels.app = statefulSet.Name;
    payload.spec.template.metadata.labels[KubernetesPortainerApplicationNameLabel] = statefulSet.ApplicationName;
    payload.spec.template.spec.containers[0].name = statefulSet.Name;
    if (statefulSet.ImageModel.Image) {
      payload.spec.template.spec.containers[0].image = buildImageFullURI(statefulSet.ImageModel);
      if (statefulSet.ImageModel.Registry && statefulSet.ImageModel.Registry.Authentication) {
        payload.spec.template.spec.imagePullSecrets = [{ name: `registry-${statefulSet.ImageModel.Registry.Id}` }];
      }
    }
    payload.spec.template.spec.affinity = statefulSet.Affinity;
    KubernetesCommonHelper.assignOrDeleteIfEmpty(payload, 'spec.template.spec.containers[0].env', statefulSet.Env);
    KubernetesCommonHelper.assignOrDeleteIfEmpty(payload, 'spec.template.spec.containers[0].volumeMounts', statefulSet.VolumeMounts);
    KubernetesCommonHelper.assignOrDeleteIfEmpty(payload, 'spec.template.spec.volumes', statefulSet.Volumes);
    if (statefulSet.MemoryLimit) {
      payload.spec.template.spec.containers[0].resources.limits.memory = statefulSet.MemoryLimit;
      payload.spec.template.spec.containers[0].resources.requests.memory = statefulSet.MemoryLimit;
    }
    if (statefulSet.CpuLimit) {
      payload.spec.template.spec.containers[0].resources.limits.cpu = statefulSet.CpuLimit;
      payload.spec.template.spec.containers[0].resources.requests.cpu = statefulSet.CpuLimit;
    }
    if (!statefulSet.CpuLimit && !statefulSet.MemoryLimit) {
      delete payload.spec.template.spec.containers[0].resources;
    }
    return payload;
  }

  static patchPayload(oldSFS, newSFS) {
    const oldPayload = KubernetesStatefulSetConverter.createPayload(oldSFS);
    const newPayload = KubernetesStatefulSetConverter.createPayload(newSFS);
    const payload = JsonPatch.compare(oldPayload, newPayload);
    return payload;
  }
}

export default KubernetesStatefulSetConverter;
