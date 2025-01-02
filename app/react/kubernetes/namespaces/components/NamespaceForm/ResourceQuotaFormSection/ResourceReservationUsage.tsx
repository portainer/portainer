import { round } from 'lodash';

import { EnvironmentId } from '@/react/portainer/environments/types';
import { useMetricsForNamespace } from '@/react/kubernetes/metrics/queries/useMetricsForNamespace';
import { PodMetrics } from '@/react/kubernetes/metrics/types';

import { TextTip } from '@@/Tip/TextTip';
import { FormSectionTitle } from '@@/form-components/FormSectionTitle';

import { megaBytesValue, parseCPU } from '../../../resourceQuotaUtils';
import { ResourceUsageItem } from '../../ResourceUsageItem';

import { useResourceQuotaUsed } from './useResourceQuotaUsed';
import { ResourceQuotaFormValues } from './types';

export function ResourceReservationUsage({
  namespaceName,
  environmentId,
  resourceQuotaValues,
}: {
  namespaceName: string;
  environmentId: EnvironmentId;
  resourceQuotaValues: ResourceQuotaFormValues;
}) {
  const namespaceMetricsQuery = useMetricsForNamespace(
    environmentId,
    namespaceName,
    {
      select: aggregatePodUsage,
    }
  );
  const usedResourceQuotaQuery = useResourceQuotaUsed(
    environmentId,
    namespaceName
  );
  const { data: namespaceMetrics } = namespaceMetricsQuery;
  const { data: usedResourceQuota } = usedResourceQuotaQuery;

  const memoryQuota = Number(resourceQuotaValues.memory) ?? 0;
  const cpuQuota = Number(resourceQuotaValues.cpu) ?? 0;

  if (!resourceQuotaValues.enabled) {
    return null;
  }
  return (
    <>
      <FormSectionTitle>Resource reservation</FormSectionTitle>
      <TextTip color="blue" className="mb-2">
        Resource reservation represents the total amount of resource assigned to
        all the applications deployed inside this namespace.
      </TextTip>
      {!!usedResourceQuota && memoryQuota > 0 && (
        <ResourceUsageItem
          value={usedResourceQuota.memory}
          total={getSafeValue(memoryQuota)}
          label="Memory reservation"
          annotation={`${usedResourceQuota.memory} / ${getSafeValue(
            memoryQuota
          )} MB ${getPercentageString(usedResourceQuota.memory, memoryQuota)}`}
        />
      )}
      {!!namespaceMetrics && memoryQuota > 0 && (
        <ResourceUsageItem
          value={namespaceMetrics.memory}
          total={getSafeValue(memoryQuota)}
          label="Memory used"
          annotation={`${namespaceMetrics.memory} / ${getSafeValue(
            memoryQuota
          )} MB ${getPercentageString(namespaceMetrics.memory, memoryQuota)}`}
        />
      )}
      {!!usedResourceQuota && cpuQuota > 0 && (
        <ResourceUsageItem
          value={usedResourceQuota.cpu}
          total={cpuQuota}
          label="CPU reservation"
          annotation={`${
            usedResourceQuota.cpu
          } / ${cpuQuota} ${getPercentageString(
            usedResourceQuota.cpu,
            cpuQuota
          )}`}
        />
      )}
      {!!namespaceMetrics && cpuQuota > 0 && (
        <ResourceUsageItem
          value={namespaceMetrics.cpu}
          total={cpuQuota}
          label="CPU used"
          annotation={`${
            namespaceMetrics.cpu
          } / ${cpuQuota} ${getPercentageString(
            namespaceMetrics.cpu,
            cpuQuota
          )}`}
        />
      )}
    </>
  );
}

function getSafeValue(value: number | string) {
  const valueNumber = Number(value);
  if (Number.isNaN(valueNumber)) {
    return 0;
  }
  return valueNumber;
}

/**
 * Returns the percentage of the value over the total.
 * @param value - The value to calculate the percentage for.
 * @param total - The total value to compare the percentage to.
 * @returns The percentage of the value over the total, with the '- ' string prefixed, for example '- 50%'.
 */
function getPercentageString(value: number, total?: number | string) {
  const totalNumber = Number(total);
  if (
    totalNumber === 0 ||
    total === undefined ||
    total === '' ||
    Number.isNaN(totalNumber)
  ) {
    return '';
  }
  if (value > totalNumber) {
    return '- Exceeded';
  }
  return `- ${Math.round((value / totalNumber) * 100)}%`;
}

/**
 * Aggregates the resource usage of all the containers in the namespace.
 * @param podMetricsList - List of pod metrics
 * @returns Aggregated resource usage. CPU cores are rounded to 3 decimal places. Memory is in MB.
 */
function aggregatePodUsage(podMetricsList: PodMetrics) {
  const containerResourceUsageList = podMetricsList.items.flatMap((i) =>
    i.containers.map((c) => c.usage)
  );
  const namespaceResourceUsage = containerResourceUsageList.reduce(
    (total, usage) => ({
      cpu: total.cpu + parseCPU(usage.cpu),
      memory: total.memory + megaBytesValue(usage.memory),
    }),
    { cpu: 0, memory: 0 }
  );
  namespaceResourceUsage.cpu = round(namespaceResourceUsage.cpu, 3);
  return namespaceResourceUsage;
}
