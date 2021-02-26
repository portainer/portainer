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
      var holderIdentity = parsedJson.holderIdentity || '';
      const idx = holderIdentity.indexOf('_');
      if (idx < 0) {
        res.HolderIdentity = holderIdentity;
      } else {
        res.HolderIdentity = holderIdentity.substring(0, idx);
      }
    }

    if (data.subsets) {
      res.Subsets = _.map(data.subsets, (item) => {
        const subset = new KubernetesEndpointSubset();
        subset.Ips = _.map(item.addresses, 'ip');
        const port = _.find(item.ports, { name: 'https' });
        subset.Port = port ? port.port : undefined;
        return subset;
      });
    }
    return res;
  }
}

export default KubernetesEndpointConverter;
