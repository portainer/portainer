import _ from 'lodash-es';
import filesizeParser from 'filesize-parser';
import { KubernetesResourceReservation } from 'Kubernetes/models/resource-reservation/models';

class KubernetesResourceReservationHelper {
  static computeResourceReservation(pods) {
    const containers = _.reduce(pods, (acc, pod) => _.concat(acc, pod.Containers), []);

    return _.reduce(containers, (acc, container) => {
      if (container.resources && container.resources.limits) {

        if (container.resources.limits.memory) {
          acc.Memory += filesizeParser(
            container.resources.limits.memory,
            { base: 10 }
          );
        }

        if (container.resources.limits.cpu) {
          acc.CPU += KubernetesResourceReservationHelper.parseCPU(container.resources.limits.cpu);
        }
      }

      return acc;
    }, new KubernetesResourceReservation());
  }

  static parseCPU(cpu) {
    let res = parseInt(cpu);
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
}
export default KubernetesResourceReservationHelper;