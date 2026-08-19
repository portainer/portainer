import _ from 'lodash-es';

export class KubernetesHorizontalPodAutoScalerHelper {
  static findApplicationBoundScaler(sList, app) {
    const kind = app.ApplicationType;
    return _.find(sList, (item) => item.TargetEntity.Kind === kind && item.TargetEntity.Name === app.Name);
  }
}
