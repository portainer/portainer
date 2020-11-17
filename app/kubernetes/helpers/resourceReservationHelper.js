import _ from 'lodash-es';
import filesizeParser from 'filesize-parser';
import { KubernetesResourceReservation } from 'Kubernetes/models/resource-reservation/models';

class KubernetesResourceReservationHelper {
  static computeResourceReservation(pods) {
    const containers = _.reduce(pods, (acc, pod) => _.concat(acc, pod.Containers), []);

    return _.reduce(
      containers,
      (acc, container) => {
        if (container.Requests) {
          if (container.Requests.memory) {
            acc.Memory += filesizeParser(container.Requests.memory, { base: 10 });
          }

          if (container.Requests.cpu) {
            acc.CPU += KubernetesResourceReservationHelper.parseCPU(container.Requests.cpu);
          }
        }

        return acc;
      },
      new KubernetesResourceReservation()
    );
  }

  static parseCPU(cpu) {
    let res = parseInt(cpu, 10);
    if (_.endsWith(cpu, 'm')) {
      res /= 1000;
    }
    return res;
  }

  static megaBytesValue(value) {
    return Math.floor(filesizeParser(value) / 1000 / 1000);
  }

  static bytesValue(mem) {
    return filesizeParser(mem) * 1000 * 1000;
  }

  static computeSliderMaxResources(nodes, pools, name, resourceOverCommitEnabled, resourceOverCommitPercent) {
    let maxResources = { CPU: 0, Memory: 0 };
    _.forEach(nodes, (item) => {
      maxResources.CPU += item.CPU;
      maxResources.Memory += filesizeParser(item.Memory);
    });
    maxResources.CPU = Math.trunc(maxResources.CPU * 10) / 10;
    maxResources.Memory = KubernetesResourceReservationHelper.megaBytesValue(maxResources.Memory);

    if (!resourceOverCommitEnabled) {
      const reservedResources = _.reduce(
        pools,
        (acc, pool) => {
          if (pool.Quota && pool.Namespace.Name !== name) {
            acc.CPU += pool.Quota.CpuLimit;
            acc.Memory += pool.Quota.MemoryLimit;
          }
          return acc;
        },
        { CPU: 0, Memory: 0 }
      );
      if (reservedResources.Memory) {
        reservedResources.Memory = KubernetesResourceReservationHelper.megaBytesValue(reservedResources.Memory);
      }
      maxResources.CPU = Math.trunc(parseFloat(maxResources.CPU - (maxResources.CPU * resourceOverCommitPercent) / 100 - reservedResources.CPU) * 10) / 10;
      maxResources.Memory = parseInt(maxResources.Memory - (maxResources.Memory * resourceOverCommitPercent) / 100 - reservedResources.Memory, 10);
    }
    return maxResources;
  }
}
export default KubernetesResourceReservationHelper;
