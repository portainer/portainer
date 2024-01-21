import { FormikErrors } from 'formik';

import { FormSection } from '@@/form-components/FormSection';
import { TextTip } from '@@/Tip/TextTip';
import { SliderWithInput } from '@@/form-components/Slider/SliderWithInput';
import { FormControl } from '@@/form-components/FormControl';
import { FormError } from '@@/form-components/FormError';
import { Slider } from '@@/form-components/Slider';

import { ResourceQuotaFormValues } from './types';

type Props = {
  values: ResourceQuotaFormValues;
  onChange: (values: ResourceQuotaFormValues) => void;
  errors: FormikErrors<ResourceQuotaFormValues>;
  namespaceHasQuota: boolean;
  resourceQuotaCapacityExceeded: boolean;
  minMemoryLimit: number;
  minCpuLimit: number;
  maxMemoryLimit: number;
  maxCpuLimit: number;
};

export function ResourceReservationFormSection({
  values,
  onChange,
  errors,
  namespaceHasQuota,
  resourceQuotaCapacityExceeded,
  minMemoryLimit,
  minCpuLimit,
  maxMemoryLimit,
  maxCpuLimit,
}: Props) {
  return (
    <FormSection title="Resource reservations" titleSize="md">
      {!namespaceHasQuota && (
        <TextTip color="blue">
          Resource reservations are applied per instance of the application.
        </TextTip>
      )}
      {namespaceHasQuota && !resourceQuotaCapacityExceeded && (
        <TextTip color="blue">
          A resource quota is set on this namespace, you must specify resource
          reservations. Resource reservations are applied per instance of the
          application. Maximums are inherited from the namespace quota.
        </TextTip>
      )}
      <FormControl
        className="flex flex-row"
        label="Memory limit (MB)"
        tooltip="An instance of this application will reserve this amount of memory. If the instance memory usage exceeds the reservation, it might be subject to OOM."
      >
        <div className="col-xs-10">
          {maxMemoryLimit > 0 && (
            <SliderWithInput
              value={Number(values.memoryLimit) ?? 0}
              onChange={(value) => onChange({ ...values, memoryLimit: value })}
              min={minMemoryLimit}
              max={maxMemoryLimit}
              step={128}
              dataCy="k8sAppCreate-memoryLimit"
              visibleTooltip
            />
          )}
          {errors?.memoryLimit && (
            <FormError className="pt-1">{errors.memoryLimit}</FormError>
          )}
        </div>
      </FormControl>
      <FormControl
        className="flex flex-row"
        label="CPU limit"
        tooltip="An instance of this application will reserve this amount of CPU. If the instance CPU usage exceeds the reservation, it might be subject to CPU throttling."
      >
        <div className="col-xs-10">
          {maxCpuLimit > 0 && (
            <Slider
              onChange={(value) =>
                onChange(
                  typeof value === 'number'
                    ? { ...values, cpuLimit: value }
                    : { ...values, cpuLimit: value[0] ?? 0 }
                )
              }
              value={values.cpuLimit}
              min={minCpuLimit}
              max={maxCpuLimit}
              step={0.1}
              dataCy="k8sAppCreate-cpuLimitSlider"
              visibleTooltip
            />
          )}
          {errors?.cpuLimit && (
            <FormError className="pt-1">{errors.cpuLimit}</FormError>
          )}
        </div>
      </FormControl>
    </FormSection>
  );
}
