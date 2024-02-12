import _ from 'lodash-es';
import { KubernetesServiceHeadlessPrefix } from 'Kubernetes/models/service/models';

class KubernetesServiceHelper {
  static generateHeadlessServiceName(name) {
    return KubernetesServiceHeadlessPrefix + name;
  }

  static findApplicationBoundService(services, rawApp) {
    if (!rawApp.spec.template) {
      return undefined;
    }
    return _.find(services, (item) => item.spec.selector && _.isMatch(rawApp.spec.template.metadata.labels, item.spec.selector));
  }

  static findApplicationBoundServices(services, rawApp) {
    // if the app is a naked pod (doesn't have a template), then get the pod labels
    const appLabels = rawApp.spec.template ? rawApp.spec.template.metadata.labels : rawApp.metadata.labels;
    if (!appLabels) {
      return undefined;
    }
    return _.filter(services, (item) => item.spec.selector && _.isMatch(appLabels, item.spec.selector));
  }
}
export default KubernetesServiceHelper;
