import { KubernetesEvent } from 'Kubernetes/models/event/models';

class KubernetesEventConverter {
  static apiToEvent(data) {
    const res = new KubernetesEvent();
    res.Id = data.metadata.uid;
    res.Date = data.lastTimestamp || data.eventTime;
    res.Type = data.type;
    res.Message = data.message;
    res.Involved = data.involvedObject;
    return res;
  }
}

export default KubernetesEventConverter;
