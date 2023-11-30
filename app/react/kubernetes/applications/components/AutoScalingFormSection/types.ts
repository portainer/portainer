export type AutoScalingFormValues = {
  isUsed: boolean;
  minReplicas?: number;
  maxReplicas?: number;
  targetCpuUtilizationPercentage?: number;
};
