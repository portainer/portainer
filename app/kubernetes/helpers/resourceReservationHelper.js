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
}
export default KubernetesResourceReservationHelper;
