import _ from 'lodash-es';
import { KubernetesComponentStatus } from './models';

export class KubernetesComponentStatusConverter {
  /**
   * Convert API data to KubernetesComponentStatus model
   */
  static apiToModel(data) {
    const res = new KubernetesComponentStatus();
    res.ComponentName = data.metadata.name;

    _.forEach(data.conditions, (condition) => {
      // if (condition.type === "Healthy" && condition.status === "True") {
      //   res.Healthy = true;
      //   return;
      // }

      if (condition.type === 'Healthy') {
        if (condition.status === 'True') {
          res.Healthy = true;
        } else {
          res.ErrorMessage = condition.message;
        }

        return;
      }
    });

    return res;
  }
}
