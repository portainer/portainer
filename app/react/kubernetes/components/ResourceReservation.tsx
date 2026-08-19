import { round } from 'lodash';
import { AlertTriangle } from 'lucide-react';

import { FormSectionTitle } from '@/react/components/form-components/FormSectionTitle';
import { TextTip } from '@/react/components/Tip/TextTip';
import { ResourceUsageItem } from '@/react/kubernetes/components/ResourceUsageItem';
import { getPercentageString, getSafeValue } from '@/react/kubernetes/utils';

import { Icon } from '@@/Icon';

interface ResourceMetrics {
  cpu: number;
  memory: number;
}

interface Props {
  displayResourceUsage: boolean;
  resourceReservation: ResourceMetrics;
  resourceUsage: ResourceMetrics;
  cpuLimit: number;
  memoryLimit: number;
  description: string;
  isLoading?: boolean;
  title?: string;
  displayWarning?: boolean;
  warningMessage?: string;
  memoryUnit?: string;
}

export function ResourceReservation({
  displayResourceUsage,
  resourceReservation,
  resourceUsage,
  cpuLimit,
  memoryLimit,
  description,
  title = 'Resource reservation',
  isLoading = false,
  displayWarning = false,
  warningMessage = '',
  memoryUnit = 'MB',
}: Props) {
  const memoryReservationAnnotation = `${getSafeValue(
    resourceReservation.memory
  )} / ${memoryLimit} ${memoryUnit} ${getPercentageString(
    resourceReservation.memory,
    memoryLimit
  )}`;

  const memoryUsageAnnotation = `${getSafeValue(
    resourceUsage.memory
  )} / ${memoryLimit} ${memoryUnit} ${getPercentageString(
    resourceUsage.memory,
    memoryLimit
  )}`;

  const cpuReservationAnnotation = `${round(
    getSafeValue(resourceReservation.cpu),
    2
  )} / ${round(getSafeValue(cpuLimit), 2)} ${getPercentageString(
    resourceReservation.cpu,
    cpuLimit
  )}`;

  const cpuUsageAnnotation = `${round(
    getSafeValue(resourceUsage.cpu),
    2
  )} / ${round(getSafeValue(cpuLimit), 2)} ${getPercentageString(
    resourceUsage.cpu,
    cpuLimit
  )}`;

  return (
    <>
      <FormSectionTitle>{title}</FormSectionTitle>
      <TextTip color="blue" className="mb-2">
        {description}
      </TextTip>
      <div className="form-horizontal">
        {memoryLimit > 0 && (
          <ResourceUsageItem
            value={resourceReservation.memory}
            total={memoryLimit}
            label="Memory reservation"
            annotation={memoryReservationAnnotation}
            isLoading={isLoading}
            dataCy="memory-reservation"
          />
        )}
        {displayResourceUsage && memoryLimit > 0 && (
          <ResourceUsageItem
            value={resourceUsage.memory}
            total={memoryLimit}
            label="Memory usage"
            annotation={memoryUsageAnnotation}
            isLoading={isLoading}
            dataCy="memory-usage"
          />
        )}
        {cpuLimit > 0 && (
          <ResourceUsageItem
            value={resourceReservation.cpu}
            total={cpuLimit}
            label="CPU reservation"
            annotation={cpuReservationAnnotation}
            isLoading={isLoading}
            dataCy="cpu-reservation"
          />
        )}
        {displayResourceUsage && cpuLimit > 0 && (
          <ResourceUsageItem
            value={resourceUsage.cpu}
            total={cpuLimit}
            label="CPU usage"
            annotation={cpuUsageAnnotation}
            isLoading={isLoading}
            dataCy="cpu-usage"
          />
        )}
        {displayWarning && (
          <div className="form-group">
            <span className="col-sm-12 text-warning small vertical-center">
              <Icon icon={AlertTriangle} mode="warning" />
              {warningMessage}
            </span>
          </div>
        )}
      </div>
    </>
  );
}
