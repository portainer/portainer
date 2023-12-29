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
            acc.Memory += safeFilesizeParser(container.Requests.memory, { base: 10 });
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
      // milli
      res /= 1000;
    } else if (_.endsWith(cpu, 'u')) {
      // micro
      res /= 1000000;
    } else if (_.endsWith(cpu, 'n')) {
      // nano
      res /= 1000000000;
    } else if (_.endsWith(cpu, 'p')) {
      // pico
      res /= 1000000000000;
    }
    return res;
  }

  static megaBytesValue(value) {
    return Math.floor(safeFilesizeParser(value) / 1000 / 1000);
  }

  static bytesValue(mem) {
    return safeFilesizeParser(mem) * 1000 * 1000;
  }
}
export default KubernetesResourceReservationHelper;

function safeFilesizeParser(value, options) {
  if (!value || Number.isNaN(value)) {
    return 0;
  }

  return filesizeParser(value, options);
}
