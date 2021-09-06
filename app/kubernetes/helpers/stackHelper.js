import _ from 'lodash-es';
import { KubernetesStack } from 'Kubernetes/models/stack/models';

class KubernetesStackHelper {
  static stacksFromApplications(applications) {
    const res = _.reduce(
      applications,
      (acc, app) => {
        if (app.StackName) {
          let stack = _.find(acc, { Name: app.StackName, ResourcePool: app.ResourcePool });
          if (!stack) {
            stack = new KubernetesStack();
            stack.Name = app.StackName;
            stack.ResourcePool = app.ResourcePool;
            acc.push(stack);
          }
          stack.Applications.push(app);
        }
        return acc;
      },
      []
    );
    return res;
  }
}
export default KubernetesStackHelper;
