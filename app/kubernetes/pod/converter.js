import * as JsonPatch from 'fast-json-patch';
import _ from 'lodash-es';

import KubernetesCommonHelper from 'Kubernetes/helpers/commonHelper';
import {
  KubernetesPortainerApplicationStackNameLabel,
  KubernetesPortainerApplicationNameLabel,
  KubernetesPortainerApplicationOwnerLabel,
  KubernetesPortainerApplicationNote,
} from 'Kubernetes/models/application/models';

import KubernetesResourceReservationHelper from 'Kubernetes/helpers/resourceReservationHelper';
import { KubernetesPod, KubernetesPodToleration, KubernetesPodAffinity, KubernetesPodContainer, KubernetesPodContainerTypes, KubernetesPodEviction } from 'Kubernetes/pod/models';
import KubernetesApplicationHelper from 'Kubernetes/helpers/application';
import { createPayloadFactory } from './payloads/create';

function computeStatus(statuses) {
  const containerStatuses = _.map(statuses, 'state');
  const running = _.filter(containerStatuses, (s) => s.running).length;
  const waiting = _.filter(containerStatuses, (s) => s.waiting).length;
  if (waiting) {
    return 'Waiting';
  } else if (!running) {
    return 'Terminated';
  }
  return 'Running';
}

function computeContainerStatus(statuses, name) {
  const status = _.find(statuses, { name: name });
  if (!status) {
    return 'Terminated';
  }
  const state = status.state;
  if (state.waiting) {
    return 'Waiting';
  }
  if (!state.running) {
    return 'Terminated';
  }
  return 'Running';
}

function computeAffinity(affinity) {
  const res = new KubernetesPodAffinity();
  if (affinity) {
    res.nodeAffinity = affinity.nodeAffinity || {};
  }
  return res;
}

function computeTolerations(tolerations) {
  return _.map(tolerations, (item) => {
    const res = new KubernetesPodToleration();
    res.Key = item.key;
    res.Operator = item.operator;
    res.Value = item.value;
    res.TolerationSeconds = item.tolerationSeconds;
    res.Effect = item.effect;
    return res;
  });
}

function computeContainers(data) {
  const containers = data.spec.containers;
  const initContainers = data.spec.initContainers;

  return _.concat(
    _.map(containers, (item) => {
      const res = new KubernetesPodContainer();
      res.Type = KubernetesPodContainerTypes.APP;
      res.PodName = data.metadata.name;
      res.PodIP = data.status.podIP;
      res.Name = item.name;
      res.Image = item.image;
      res.ImagePullPolicy = item.imagePullPolicy;
      res.Node = data.spec.nodeName;
      res.CreationDate = data.status.startTime;
      res.Status = computeContainerStatus(data.status.containerStatuses, item.name);
      res.Limits = item.resources.limits;
      res.Requests = item.resources.requests;
      res.VolumeMounts = item.volumeMounts;
      res.Env = item.env;
      return res;
    }),
    _.map(initContainers, (item) => {
      const res = new KubernetesPodContainer();
      res.Type = KubernetesPodContainerTypes.INIT;
      res.PodName = data.metadata.name;
      res.Name = item.name;
      res.Image = item.image;
      res.Node = data.spec.nodeName;
      res.CreationDate = data.status.startTime;
      res.Status = computeContainerStatus(data.status.containerStatuses, item.name);
      res.Limits = item.resources.limits;
      res.Requests = item.resources.requests;
      res.VolumeMounts = item.volumeMounts;
      res.Env = item.env;
      return res;
    })
  );
}

export default class KubernetesPodConverter {
  static applicationFormValuesToPod(formValues, volumeClaims) {
    let serviceSelector = {};
    if (formValues.Services.length) {
      serviceSelector = formValues.Services[0].Selector || { app: formValues.Name };
    }

    const res = new KubernetesPod();
    res.Namespace = formValues.ResourcePool.Namespace.Name;
    res.Name = formValues.Name;
    res.StackName = formValues.StackName ? formValues.StackName : formValues.Name;
    res.ApplicationOwner = formValues.ApplicationOwner;
    res.ApplicationName = formValues.Name;
    res.ImageModel = formValues.ImageModel;
    res.CpuLimit = formValues.CpuLimit;
    res.MemoryLimit = KubernetesResourceReservationHelper.bytesValue(formValues.MemoryLimit);
    res.Env = KubernetesApplicationHelper.generateEnvFromEnvVariables(formValues.EnvironmentVariables);
    res.Containers = formValues.Containers;
    res.ApplicationType = formValues.ApplicationType;
    res.ServiceSelector = serviceSelector;
    res.Labels = formValues.Labels;
    KubernetesApplicationHelper.generateVolumesFromPersistentVolumClaims(res, volumeClaims);
    KubernetesApplicationHelper.generateEnvOrVolumesFromConfigurations(res, formValues.ConfigMaps, formValues.Secrets);
    KubernetesApplicationHelper.generateAffinityFromPlacements(res, formValues);
    return res;
  }

  static apiToModel(data) {
    const res = new KubernetesPod();
    res.Id = data.metadata.uid;
    res.Name = data.metadata.name;
    res.Namespace = data.metadata.namespace;
    res.Images = _.map(data.spec.containers, 'image');
    res.Status = computeStatus(data.status.containerStatuses);
    res.Restarts = _.sumBy(data.status.containerStatuses, 'restartCount');
    res.Node = data.spec.nodeName;
    res.CreationDate = data.status.startTime;
    res.Containers = computeContainers(data);
    res.Labels = data.metadata.labels;
    res.Affinity = computeAffinity(data.spec.affinity);
    res.NodeSelector = data.spec.nodeSelector;
    res.Tolerations = computeTolerations(data.spec.tolerations);
    res.Labels = data.metadata.labels;
    return res;
  }

  static evictionPayload(pod) {
    const res = new KubernetesPodEviction();
    res.metadata.name = pod.Name;
    res.metadata.namespace = pod.Namespace;
    return res;
  }

  static patchPayload(oldPod, newPod) {
    const oldPayload = createPayload(oldPod);
    const newPayload = createPayload(newPod);
    const payload = JsonPatch.compare(oldPayload, newPayload);
    return payload;
  }
}

function createPayload(pod) {
  const payload = createPayloadFactory();
  payload.metadata.name = pod.Name;
  payload.metadata.namespace = pod.Namespace;
  // it's possible for pods not to have labels. Keep labels empty in the oldpayload if there aren't any, otherwise patch will fail
  // TODO: when migrating to react, the oldValues should just be the fetched manifest directly from the kube api
  if (Object.keys(pod.Labels || {}).length || Object.keys(pod.ServiceSelector || {}).length) {
    payload.metadata.labels[KubernetesPortainerApplicationStackNameLabel] = pod.StackName;
    payload.metadata.labels[KubernetesPortainerApplicationNameLabel] = pod.ApplicationName;
    payload.metadata.labels[KubernetesPortainerApplicationOwnerLabel] = pod.ApplicationOwner;
    payload.metadata.labels = { ...(pod.Labels || {}), ...(pod.ServiceSelector || {}), ...payload.metadata.labels };
  } else {
    payload.metadata.labels = undefined;
  }
  if (pod.Note) {
    payload.metadata.annotations[KubernetesPortainerApplicationNote] = pod.Note;
  } else {
    payload.metadata.annotations = undefined;
  }

  payload.spec.replicas = pod.ReplicaCount;
  payload.spec.selector.matchLabels.app = pod.Name;
  payload.spec.template.metadata.labels.app = pod.Name;
  payload.spec.template.metadata.labels[KubernetesPortainerApplicationNameLabel] = pod.ApplicationName;
  payload.spec.template.spec.containers[0].name = pod.Name;
  payload.spec.template.spec.containers[0].image = pod.Image;
  payload.spec.template.spec.affinity = pod.Affinity;
  KubernetesCommonHelper.assignOrDeleteIfEmpty(payload, 'spec.template.spec.containers[0].env', pod.Env);
  KubernetesCommonHelper.assignOrDeleteIfEmpty(payload, 'spec.template.spec.containers[0].volumeMounts', pod.VolumeMounts);
  KubernetesCommonHelper.assignOrDeleteIfEmpty(payload, 'spec.template.spec.volumes', pod.Volumes);
  if (pod.MemoryLimit) {
    payload.spec.template.spec.containers[0].resources.limits.memory = pod.MemoryLimit;
    payload.spec.template.spec.containers[0].resources.requests.memory = pod.MemoryLimit;
  }
  if (pod.CpuLimit) {
    payload.spec.template.spec.containers[0].resources.limits.cpu = pod.CpuLimit;
    payload.spec.template.spec.containers[0].resources.requests.cpu = pod.CpuLimit;
  }
  if (!pod.CpuLimit && !pod.MemoryLimit) {
    delete payload.spec.template.spec.containers[0].resources;
  }
  return payload;
}
