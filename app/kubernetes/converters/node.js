import _ from 'lodash-es';

import { KubernetesNode, KubernetesNodeDetails } from "Kubernetes/models/node/models";

class KubernetesNodeConverter {
  static apiToNode(data, res) {
    if (!res) {
      res = new KubernetesNode();
    }
    res.Id = data.metadata.uid;
    const hostName = _.find(data.status.addresses, { type: 'Hostname' });
    res.Name = hostName ? hostName.address : data.metadata.Name;
    res.Role = _.has(data.metadata.labels, 'node-role.kubernetes.io/master') ? 'Manager' : 'Worker';
    const readyStatus = _.find(data.status.conditions, { type: 'Ready' });
    res.Status = readyStatus && readyStatus.status === "True" ? 'Ready' : 'Warning';
    res.CPU = parseInt(data.status.allocatable.cpu);
    res.Memory = data.status.allocatable.memory;
    res.Version = data.status.nodeInfo.kubeletVersion;
    const internalIP = _.find(data.status.addresses, { type: 'InternalIP' });
    res.IPAddress = internalIP ? internalIP.address : '-';
    return res;
  }

  static apiToNodeDetails(data, yaml) {
    let res = new KubernetesNodeDetails();
    res = KubernetesNodeConverter.apiToNode(data, res);
    res.CreatedAt = data.metadata.creationTimestamp;
    res.OS.Architecture = data.status.nodeInfo.architecture;
    res.OS.Platform = data.status.nodeInfo.operatingSystem;
    res.OS.Image = data.status.nodeInfo.osImage;
    res.Conditions = data.status.conditions;
    res.Yaml = yaml;
    return res;
  }
}

export default KubernetesNodeConverter;