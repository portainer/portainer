import _ from 'lodash-es';

class KubernetesDaemonSetHistoryHelper {
  static _isControlledBy(daemonSet) {
    return (item) => _.find(item.metadata.ownerReferences, { uid: daemonSet.metadata.uid }) !== undefined;
  }

  static filterOwnedRevisions(crList, daemonSet) {
    // filter ControllerRevisions that has the same selector as the DaemonSet
    // NOTE : this should be done in HTTP request based on daemonSet.spec.selector.matchLabels
    // instead of getting all CR and filtering them here
    const sameLabelsCR = _.filter(crList, ['metadata.labels', daemonSet.spec.selector.matchLabels]);
    // Only include the RS whose ControllerRef matches the DaemonSet.
    const controlledCR = _.filter(sameLabelsCR, KubernetesDaemonSetHistoryHelper._isControlledBy(daemonSet));
    // sorts the list of ControllerRevisions by revision, using the creationTimestamp as a tie breaker (old to new)
    const sortedList = _.sortBy(controlledCR, ['revision', 'metadata.creationTimestamp']);
    return sortedList;
  }

  // getCurrentRS returns the newest CR the given daemonSet targets (latest version)
  static getCurrentRevision(crList) {
    const current = _.last(crList);
    return current;
  }
}

export default KubernetesDaemonSetHistoryHelper;
