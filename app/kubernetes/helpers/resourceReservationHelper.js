import _ from 'lodash-es';
import filesizeParser from 'filesize-parser';
import { KubernetesResourceReservation } from 'Kubernetes/models/resource-reservation/models';

class KubernetesResourceReservationHelper {
  static computeResourceReservation(pods) {
    const containers = _.reduce(pods, (acc, pod) => _.concat(acc, pod.Containers), []);

    return _.reduce(containers, (acc, container) => {
      if (container.resources && container.resources.requests) {

        if (container.resources.requests.memory) {
          acc.Memory += filesizeParser(
            container.resources.requests.memory,
            { base: 10 }
          );
        }

        if (container.resources.requests.cpu) {
          acc.CPU += KubernetesResourceReservationHelper.parseCPU(container.resources.requests.cpu);
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