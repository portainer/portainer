import _ from 'lodash-es';
import { KubernetesPod, KubernetesPodToleration, KubernetesPodAffinity } from 'Kubernetes/pod/models';

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
    res.Containers = data.spec.containers;
    res.Labels = data.metadata.labels;
    res.Affinity = computeAffinity(data.spec.affinity);
    res.NodeSelector = data.spec.nodeSelector;
    res.Tolerations = computeTolerations(data.spec.tolerations);
    return res;
  }
}
