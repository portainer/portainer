/**
 * FormValues for CreateVolume view
 */
export function KubernetesVolumeFormValues() {
  return {
    Id: '',
    Name: '',
    ResourcePool: {}, // KubernetesResourcePool
    Size: '',
    SizeUnit: '',
    NFSAddress: '',
    NFSMountPoint: '',
  };
}

export const KubernetesVolumeFormValuesDefaults = {
  Size: '10',
  SizeUnit: 'MB',
};
