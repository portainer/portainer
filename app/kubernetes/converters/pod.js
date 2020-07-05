import _ from 'lodash-es';
import { KubernetesPod } from 'Kubernetes/models/pod/models';
class KubernetesPodConverter {
  static computeStatus(statuses) {
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

  static apiToPod(data) {
    const res = new KubernetesPod();
    res.Id = data.metadata.uid;
    res.Name = data.metadata.name;
    res.Namespace = data.metadata.namespace;
    res.Images = _.map(data.spec.containers, 'image');
    res.Status = KubernetesPodConverter.computeStatus(data.status.containerStatuses);
    res.Restarts = _.sumBy(data.status.containerStatuses, 'restartCount');
    res.Node = data.spec.nodeName;
    res.CreationDate = data.status.startTime;
    res.Containers = data.spec.containers;
    res.Labels = data.metadata.labels;
    return res;
  }
}

export default KubernetesPodConverter;
