import _ from 'lodash-es';

class KubernetesResourcePoolHelper {
  static bindQuotaToResourcePool(pool, quotas) {
    const quota = _.find(quotas, (item) => item.Namespace === pool.Namespace.Name);
    if (quota) {
      pool.Quota = quota;
    }
  }  
}
export default KubernetesResourcePoolHelper;