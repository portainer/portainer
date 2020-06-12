import _ from 'lodash-es';
import angular from 'angular';
import { KubernetesSystem_DefaultDeploymentUniqueLabelKey, KubernetesSystem_RevisionAnnotation } from 'Kubernetes/models/history/models';

class KubernetesDeploymentHistoryHelper {
  static _isControlledBy(deployment) {
    return (item) => _.find(item.metadata.ownerReferences, { uid: deployment.metadata.uid }) !== undefined;
  }

  static filterOwnedRevisions(rsList, deployment) {
    // filter RS that has the same selector as the Deployment
    // NOTE : this should be done in HTTP request based on deployment.spec.selector
    // instead of getting all RS and filtering them here
    const sameLabelsRS = _.filter(rsList, ['spec.selector', deployment.spec.selector]);
    // Only include the RS whose ControllerRef matches the Deployment.
    const controlledRS = _.filter(sameLabelsRS, KubernetesDeploymentHistoryHelper._isControlledBy(deployment));
    // sorts the list of ReplicaSet by creation timestamp, using the names as a tie breaker (old to new)
    const sortedList = _.sortBy(controlledRS, ['metadata.creationTimestamp', 'metadata.name']);
    return sortedList;
  }

  // getCurrentRS returns the new RS the given deployment targets (the one with the same pod template).
  static getCurrentRevision(rsListOriginal, deployment) {
    const rsList = angular.copy(rsListOriginal);

    // In rare cases, such as after cluster upgrades, Deployment may end up with
    // having more than one new ReplicaSets that have the same template as its template,
    // see https://github.com/kubernetes/kubernetes/issues/40415
    // We deterministically choose the oldest new ReplicaSet (first match)
    const current = _.find(rsList, (item) => {
      // returns true if two given template.spec are equal, ignoring the diff in value of Labels[pod-template-hash]
      // We ignore pod-template-hash because:
      // 1. The hash result would be different upon podTemplateSpec API changes
      //    (e.g. the addition of a new field will cause the hash code to change)
      // 2. The deployment template won't have hash labels
      delete item.spec.template.metadata.labels[KubernetesSystem_DefaultDeploymentUniqueLabelKey];
      return _.isEqual(deployment.spec.template, item.spec.template);
    });
    current.revision = current.metadata.annotations[KubernetesSystem_RevisionAnnotation];
    return current;
  }

  // filters the RSList to drop all RS that have never been a version of the Deployment
  // also add the revision as a field inside the RS
  // Note: this should not impact rollback process as we only patch
  // metadata.annotations and spec.template
  static filterVersionedRevisions(rsList) {
    const filteredRS = _.filter(rsList, (item) => item.metadata.annotations[KubernetesSystem_RevisionAnnotation] !== undefined);
    return _.map(filteredRS, (item) => {
      item.revision = item.metadata.annotations[KubernetesSystem_RevisionAnnotation];
      return item;
    });
  }
}

export default KubernetesDeploymentHistoryHelper;
