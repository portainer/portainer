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

    const ready = _.find(data.status.conditions, { type: 'Ready' });
    const memoryPressure = _.find(data.status.conditions, { type: 'MemoryPressure' });
    const PIDPressure = _.find(data.status.conditions, { type: 'PIDPressure' });
    const diskPressure = _.find(data.status.conditions, { type: 'DiskPressure' });
    const networkUnavailable = _.find(data.status.conditions, { type: 'NetworkUnavailable' });

    res.Conditions = {
      MemoryPressure: memoryPressure && memoryPressure.status === 'True' ? true : false,
      PIDPressure: PIDPressure && PIDPressure.status === 'True' ? true : false,
      DiskPressure: diskPressure && diskPressure.status === 'True' ? true : false,
      NetworkUnavailable: networkUnavailable && networkUnavailable.status === 'True' ? true : false
    };

    if (ready.status === 'False') {
      res.Status = 'Unhealthy';
    } else {
      if (
        ready.status === 'Unknown' ||
        res.Conditions.MemoryPressure === 'True' ||
        res.Conditions.PIDPressure === 'True' ||
        res.Conditions.DiskPressure === 'True' ||
        res.Conditions.NetworkUnavailable === 'True'
      ) {
        res.Status = 'Warning';
      } else {
        res.Status = 'Ready';
      }
    }

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
    res.Yaml = yaml;
    return res;
  }
}

export default KubernetesNodeConverter;