import _ from 'lodash-es';
import PortainerError from 'Portainer/error';
import { KubernetesApplication, KubernetesApplicationTypes, KubernetesApplicationTypeStrings } from 'Kubernetes/models/application/models';
import { KubernetesDeployment } from 'Kubernetes/models/deployment/models';
import { KubernetesStatefulSet } from 'Kubernetes/models/stateful-set/models';
import { KubernetesDaemonSet } from 'Kubernetes/models/daemon-set/models';

function _getApplicationTypeString(app) {
  if ((app instanceof KubernetesApplication && app.ApplicationType === KubernetesApplicationTypes.DEPLOYMENT) || app instanceof KubernetesDeployment) {
    return KubernetesApplicationTypeStrings.DEPLOYMENT;
  } else if ((app instanceof KubernetesApplication && app.ApplicationType === KubernetesApplicationTypes.DAEMONSET) || app instanceof KubernetesDaemonSet) {
    return KubernetesApplicationTypeStrings.DAEMONSET;
  } else if ((app instanceof KubernetesApplication && app.ApplicationType === KubernetesApplicationTypes.STATEFULSET) || app instanceof KubernetesStatefulSet) {
    return KubernetesApplicationTypeStrings.STATEFULSET;
    // } else if () { ---> TODO: refactor - handle bare pod type !
  } else {
    throw new PortainerError('Unable to determine application type');
  }
}

export class KubernetesHorizontalPodAutoScalerHelper {
  static findApplicationBoundScaler(sList, app) {
    const kind = _getApplicationTypeString(app);
    return _.find(sList, (item) => item.TargetEntity.Kind === kind && item.TargetEntity.Name === app.Name);
  }
}
