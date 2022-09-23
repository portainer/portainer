import KubernetesResourcePoolConverter from 'kubernetes/converters/resourcePool';
import { KubernetesResourcePoolFormValues } from 'kubernetes/models/resource-pool/formValues';
import { KubernetesResourceQuotaDefaults } from 'kubernetes/models/resource-quota/models';
import { KubernetesResourceTypes } from 'kubernetes/models/resource-types/models';
import { getResourcesSummary } from 'kubernetes/views/summary/resources/helpers';

export default function (newFormValues, oldFormValues) {
  const [newNamespace, newQuota, newIngresses] = KubernetesResourcePoolConverter.formValuesToResourcePool(newFormValues);

  if (!(oldFormValues instanceof KubernetesResourcePoolFormValues)) {
    oldFormValues = new KubernetesResourcePoolFormValues(KubernetesResourceQuotaDefaults);
  }

  const [oldNamespace, oldQuota, oldIngresses] = KubernetesResourcePoolConverter.formValuesToResourcePool(oldFormValues);

  const resources = [
    ...getResourcesSummary(newNamespace, oldNamespace, KubernetesResourceTypes.NAMESPACE),
    ...getResourcesSummary(newQuota, oldQuota, KubernetesResourceTypes.RESOURCEQUOTA),
    ...getResourcesSummary(newIngresses, oldIngresses, KubernetesResourceTypes.INGRESS),
  ];

  return resources;
}
