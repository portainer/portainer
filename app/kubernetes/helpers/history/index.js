import _ from 'lodash-es';
import PortainerError from 'Portainer/error';

import KubernetesDeploymentHistoryHelper from 'Kubernetes/helpers/history/deployment';
import KubernetesDaemonSetHistoryHelper from 'Kubernetes/helpers/history/daemonset';
import KubernetesStatefulSetHistoryHelper from 'Kubernetes/helpers/history/statefulset';
import { KubernetesApplicationTypes } from 'Kubernetes/models/application/models';

class KubernetesHistoryHelper {
  static getRevisions(rawRevisions, application) {
    let currentRevision, revisionsList;

    switch (application.ApplicationType) {
      case KubernetesApplicationTypes.DEPLOYMENT:
        [currentRevision, revisionsList] = KubernetesHistoryHelper._getDeploymentRevisions(rawRevisions, application.Raw);
        break;
      case KubernetesApplicationTypes.DAEMONSET:
        [currentRevision, revisionsList] = KubernetesHistoryHelper._getDaemonSetRevisions(rawRevisions, application.Raw);
        break;
      case KubernetesApplicationTypes.STATEFULSET:
        [currentRevision, revisionsList] = KubernetesHistoryHelper._getStatefulSetRevisions(rawRevisions, application.Raw);
        break;
      default:
        throw new PortainerError('Unable to determine which association to use to get revisions');
    }
    revisionsList = _.sortBy(revisionsList, 'revision');
    return [currentRevision, revisionsList];
  }

  static _getDeploymentRevisions(rsList, deployment) {
    const appRS = KubernetesDeploymentHistoryHelper.filterOwnedRevisions(rsList, deployment);
    const currentRS = KubernetesDeploymentHistoryHelper.getCurrentRevision(appRS, deployment);
    const versionedRS = KubernetesDeploymentHistoryHelper.filterVersionedRevisions(appRS);
    return [currentRS, versionedRS];
  }

  static _getDaemonSetRevisions(crList, daemonSet) {
    const appCR = KubernetesDaemonSetHistoryHelper.filterOwnedRevisions(crList, daemonSet);
    const currentCR = KubernetesDaemonSetHistoryHelper.getCurrentRevision(appCR, daemonSet);
    return [currentCR, appCR];
  }

  static _getStatefulSetRevisions(crList, statefulSet) {
    const appCR = KubernetesStatefulSetHistoryHelper.filterOwnedRevisions(crList, statefulSet);
    const currentCR = KubernetesStatefulSetHistoryHelper.getCurrentRevision(appCR, statefulSet);
    return [currentCR, appCR];
  }
}

export default KubernetesHistoryHelper;
