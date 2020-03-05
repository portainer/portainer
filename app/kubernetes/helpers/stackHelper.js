import _ from 'lodash-es';
import { KubernetesStack } from 'Kubernetes/models/stack/models';

class KubernetesStackHelper {
  static stacksFromApplications(applications) {
    const res = _.reduce(applications, (acc, app) => {
      if (app.Stack !== '-') {
        const stack = _.find(acc, {Name: app.Stack});
        if (stack) {
          stack.ApplicationCount += 1;
        } else {
          const item = new KubernetesStack();
          item.Name = app.Stack;
          item.ResourcePool = app.ResourcePool;
          item.ApplicationCount = 1;
          acc.push(item);
        }
      }
      return acc;
    }, []);
    return res;
  }
}
export default KubernetesStackHelper;