/**
 * @property enabled - Whether resource quota is enabled
 * @property memory - Memory limit in bytes
 * @property cpu - CPU limit in cores
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
