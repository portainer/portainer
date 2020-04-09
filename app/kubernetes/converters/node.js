import _ from 'lodash-es';

import {KubernetesNode, KubernetesNodeDetails} from 'Kubernetes/models/node/models';
import KubernetesResourceReservationHelper from 'Kubernetes/helpers/resourceReservationHelper';

class KubernetesNodeConverter {
  static apiToNode(data, res) {
    if (!res) {
      res = new KubernetesNode();
    }
    res.Id = data.metadata.uid;
    const hostName = _.find(data.status.addresses, { type: 'Hostname' });
    res.Name = hostName ? hostName.address : data.metadata.Name;
    res.Role = _.has(data.metadata.labels, 'node-role.kubernetes.io/master') ? 'Manager' : 'Worker';

    const ready = _.find(data.status.conditions, { type: KubernetesNodeConditionTypes.READY });
    const memoryPressure = _.find(data.status.conditions, { type: KubernetesNodeConditionTypes.MEMORY_PRESSURE });
    const PIDPressure = _.find(data.status.conditions, { type: KubernetesNodeConditionTypes.PID_PRESSURE });
    const diskPressure = _.find(data.status.conditions, { type: KubernetesNodeConditionTypes.DISK_PRESSURE });
    const networkUnavailable = _.find(data.status.conditions, { type: KubernetesNodeConditionTypes.NETWORK_UNAVAILABLE });

    res.Conditions = {
      MemoryPressure: memoryPressure && memoryPressure.status === 'True',
      PIDPressure: PIDPressure && PIDPressure.status === 'True',
      DiskPressure: diskPressure && diskPressure.status === 'True',
      NetworkUnavailable: networkUnavailable && networkUnavailable.status === 'True'
    };

    if (ready.status === 'False') {
      res.Status = 'Unhealthy';
    } else if (ready.status === 'Unknown' || res.Conditions.MemoryPressure || res.Conditions.PIDPressure || res.Conditions.DiskPressure || res.Conditions.NetworkUnavailable) {
        res.Status = 'Warning';
    } else {
      res.Status = 'Ready';
    }

    res.CPU = KubernetesResourceReservationHelper.parseCPU(data.status.allocatable.cpu);
    res.Memory = data.status.allocatable.memory;
    res.Version = data.status.nodeInfo.kubeletVersion;
    const internalIP = _.find(data.status.addresses, { type: 'InternalIP' });
    res.IPAddress = internalIP ? internalIP.address : '-';
    return res;
  }

  static apiToNodeDetails(data, yaml) {
    let res = new KubernetesNodeDetails();
    res = KubernetesNodeConverter.apiToNode(data, res);
    res.CreationDate = data.metadata.creationTimestamp;
    res.OS.Architecture = data.status.nodeInfo.architecture;
    res.OS.Platform = data.status.nodeInfo.operatingSystem;
    res.OS.Image = data.status.nodeInfo.osImage;
    res.Yaml = yaml ? yaml.data : '';
    return res;
  }
}

export const KubernetesNodeConditionTypes = Object.freeze({
  READY: 'Ready',
  MEMORY_PRESSURE: 'MemoryPressure',
  PID_PRESSURE: 'PIDPressure',
  DISK_PRESSURE: 'DiskPressure',
  NETWORK_UNAVAILABLE: 'NetworkUnavailable'
});

export default KubernetesNodeConverter;