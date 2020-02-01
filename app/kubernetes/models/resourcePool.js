/**
 * ResourcePool is a composite model that includes
 * A Namespace, a list of quotas (most of the time only 1 resource quotas)
 * and a LimitRange if it contains a resource quota
 * @param {KubernetesNamespaceViewModel} namespace
 */
export default function KubernetesResourcePoolViewModel(namespace) {
  this.Namespace = namespace;
  // TODO: review
  // @alapenna: In my opinion we should only support a single quota (see Portainer naming convention, portainer-rq-<namespace>)
  this.Quotas = [];
  this.LimitRange = {};
}
