import _ from 'lodash-es';
import { KubernetesPod, KubernetesPodToleration, KubernetesPodAffinity, KubernetesPodContainer, KubernetesPodContainerTypes } from 'Kubernetes/pod/models';

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
    res.NodeAffinity = affinity.nodeAffinity || {};
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
    return res;
  }
}
