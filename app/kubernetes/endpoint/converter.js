import { KubernetesEndpoint, KubernetesEndpointAnnotationLeader, KubernetesEndpointSubset } from 'Kubernetes/endpoint/models';
import _ from 'lodash-es';

class KubernetesEndpointConverter {
  static apiToEndpoint(data) {
    const res = new KubernetesEndpoint();
    res.Id = data.metadata.uid;
    res.Name = data.metadata.name;
    res.Namespace = data.metadata.namespace;
    const leaderAnnotation = data.metadata.annotations ? data.metadata.annotations[KubernetesEndpointAnnotationLeader] : '';
    if (leaderAnnotation) {
      const parsedJson = JSON.parse(leaderAnnotation);
      const split = _.split(parsedJson.holderIdentity, '_');
      res.HolderIdentity = split[0];
    }

    if (data.subsets) {
      res.Subsets = _.map(data.subsets, (item) => {
        const subset = new KubernetesEndpointSubset();
        subset.Ip = item.addresses ? item.addresses[0].ip : '';
        subset.Port = item.ports ? item.ports[0].port : '';
        return subset;
      });
    }

    return res;
  }
}

export default KubernetesEndpointConverter;
