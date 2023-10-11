/**
 * @property enabled - Whether resource quota is enabled
 * @property memory - Memory limit in bytes
 * @property cpu - CPU limit in cores
 * @property loadBalancer - Load balancer limit in number of load balancers
 */
export type ResourceQuotaFormValues = {
  enabled: boolean;
  memory?: string;
  cpu?: string;
};

export type ResourceQuotaPayload = {
  enabled: boolean;
  memory?: string;
  cpu?: string;
  loadBalancerLimit?: string;
};
