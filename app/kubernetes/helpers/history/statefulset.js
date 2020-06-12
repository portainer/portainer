import _ from 'lodash-es';

class KubernetesStatefulSetHistoryHelper {
  static _isControlledBy(statefulSet) {
    return (item) => _.find(item.metadata.ownerReferences, { uid: statefulSet.metadata.uid }) !== undefined;
  }

  static filterOwnedRevisions(crList, statefulSet) {
    // filter ControllerRevisions that has the same selector as the StatefulSet
    // NOTE : this should be done in HTTP request based on statefulSet.spec.selector.matchLabels
    // instead of getting all CR and filtering them here
    const sameLabelsCR = _.filter(crList, ['metadata.labels', statefulSet.spec.selector.matchLabels]);
    // Only include the RS whose ControllerRef matches the StatefulSet.
    const controlledCR = _.filter(sameLabelsCR, KubernetesStatefulSetHistoryHelper._isControlledBy(statefulSet));
    // sorts the list of ControllerRevisions by revision, using the creationTimestamp as a tie breaker (old to new)
    const sortedList = _.sortBy(controlledCR, ['revision', 'metadata.creationTimestamp']);
    return sortedList;
  }

  // getCurrentRS returns the newest CR the given statefulSet targets (latest version)
  static getCurrentRevision(crList) {
    const current = _.last(crList);
    return current;
  }
}

export default KubernetesStatefulSetHistoryHelper;
