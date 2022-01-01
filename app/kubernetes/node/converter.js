import _ from 'lodash-es';

import * as JsonPatch from 'fast-json-patch';
import { KubernetesNode, KubernetesNodeDetails, KubernetesNodeTaint, KubernetesNodeAvailabilities, KubernetesPortainerNodeDrainLabel } from 'Kubernetes/node/models';
import KubernetesResourceReservationHelper from 'Kubernetes/helpers/resourceReservationHelper';
import { KubernetesNodeFormValues, KubernetesNodeTaintFormValues, KubernetesNodeLabelFormValues } from 'Kubernetes/node/formValues';
import { KubernetesNodeCreatePayload, KubernetesNodeTaintPayload } from 'Kubernetes/node/payload';

class KubernetesNodeConverter {
  static apiToNode(data, res) {
    if (!res) {
      res = new KubernetesNode();
    }
    res.Id = data.metadata.uid;
    const hostName = _.find(data.status.addresses, { type: 'Hostname' });
    res.Name = hostName ? hostName.address : data.metadata.Name;
    res.Labels = data.metadata.labels;
    res.Role = _.has(data.metadata.labels, 'node-role.kubernetes.io/master') ? 'Master' : 'Worker';

    const ready = _.find(data.status.conditions, { type: KubernetesNodeConditionTypes.READY });
    const memoryPressure = _.find(data.status.conditions, { type: KubernetesNodeConditionTypes.MEMORY_PRESSURE });
    const PIDPressure = _.find(data.status.conditions, { type: KubernetesNodeConditionTypes.PID_PRESSURE });
    const diskPressure = _.find(data.status.conditions, { type: KubernetesNodeConditionTypes.DISK_PRESSURE });
    const networkUnavailable = _.find(data.status.conditions, { type: KubernetesNodeConditionTypes.NETWORK_UNAVAILABLE });

    res.Conditions = {
      MemoryPressure: memoryPressure && memoryPressure.status === 'True',
      PIDPressure: PIDPressure && PIDPressure.status === 'True',
      DiskPressure: diskPressure && diskPressure.status === 'True',
      NetworkUnavailable: networkUnavailable && networkUnavailable.status === 'True',
    };

    res.Availability = KubernetesNodeAvailabilities.ACTIVE;
    if (data.spec.unschedulable === true) {
      res.Availability = _.has(data.metadata.labels, KubernetesPortainerNodeDrainLabel) ? KubernetesNodeAvailabilities.DRAIN : KubernetesNodeAvailabilities.PAUSE;
    }

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
    res.Taints = _.map(data.spec.taints, (taint) => {
      const res = new KubernetesNodeTaint();
      res.Key = taint.key;
      res.Value = taint.value;
      res.Effect = taint.effect;
      return res;
    });
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

  static nodeToFormValues(node) {
    const res = new KubernetesNodeFormValues();

    res.Availability = node.Availability;

    res.Taints = _.map(node.Taints, (taint) => {
      const res = new KubernetesNodeTaintFormValues();
      res.Key = taint.Key;
      res.Value = taint.Value;
      res.Effect = taint.Effect;
      res.NeedsDeletion = false;
      res.IsNew = false;
      return res;
    });

    res.Labels = _.map(node.Labels, (value, key) => {
      const res = new KubernetesNodeLabelFormValues();
      res.Key = key;
      res.Value = value;
      res.NeedsDeletion = false;
      res.IsNew = false;
      return res;
    });

    return res;
  }

  static formValuesToNode(node, formValues) {
    const res = angular.copy(node);

    res.Availability = formValues.Availability;

    const filteredTaints = _.filter(formValues.Taints, (taint) => !taint.NeedsDeletion);
    res.Taints = _.map(filteredTaints, (item) => {
      const taint = new KubernetesNodeTaint();
      taint.Key = item.Key;
      taint.Value = item.Value;
      taint.Effect = item.Effect;
      return taint;
    });

    const filteredLabels = _.filter(formValues.Labels, (label) => !label.NeedsDeletion);
    res.Labels = _.reduce(
      filteredLabels,
      (acc, item) => {
        acc[item.Key] = item.Value ? item.Value : '';
        return acc;
      },
      {}
    );

    return res;
  }

  static createPayload(node) {
    const payload = new KubernetesNodeCreatePayload();
    payload.metadata.name = node.Name;

    const taints = _.map(node.Taints, (taint) => {
      const res = new KubernetesNodeTaintPayload();
      res.key = taint.Key;
      res.value = taint.Value;
      res.effect = taint.Effect;
      return res;
    });

    payload.spec.taints = taints.length ? taints : undefined;

    payload.metadata.labels = node.Labels;

    if (node.Availability !== KubernetesNodeAvailabilities.ACTIVE) {
      payload.spec.unschedulable = true;
      if (node.Availability === KubernetesNodeAvailabilities.DRAIN) {
        payload.metadata.labels[KubernetesPortainerNodeDrainLabel] = '';
      } else {
        delete payload.metadata.labels[KubernetesPortainerNodeDrainLabel];
      }
    }

    return payload;
  }

  static patchPayload(oldNode, newNode) {
    const oldPayload = KubernetesNodeConverter.createPayload(oldNode);
    const newPayload = KubernetesNodeConverter.createPayload(newNode);
    const payload = JsonPatch.compare(oldPayload, newPayload);
    return payload;
  }
}

export const KubernetesNodeConditionTypes = Object.freeze({
  READY: 'Ready',
  MEMORY_PRESSURE: 'MemoryPressure',
  PID_PRESSURE: 'PIDPressure',
  DISK_PRESSURE: 'DiskPressure',
  NETWORK_UNAVAILABLE: 'NetworkUnavailable',
});

export default KubernetesNodeConverter;
