import _ from 'lodash-es';
import { KubernetesComponentStatus } from './models';

export class KubernetesComponentStatusConverter {
  /**
   * Convert API data to KubernetesComponentStatus model
   */
  static apiToModel(data) {
    const res = new KubernetesComponentStatus();
    res.ComponentName = data.metadata.name;

    const healthyCondition = _.find(data.conditions, { type: 'Healthy' });
    if (healthyCondition && healthyCondition.status === 'True') {
      res.Healthy = true;
    } else if (healthyCondition && healthyCondition.status === 'False') {
      res.ErrorMessage = healthyCondition.message;
    }

    return res;
  }
}
