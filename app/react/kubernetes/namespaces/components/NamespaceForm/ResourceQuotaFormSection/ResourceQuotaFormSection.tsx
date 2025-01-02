import { FormikErrors } from 'formik';

import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';

import { FormControl } from '@@/form-components/FormControl';
import { FormError } from '@@/form-components/FormError';
import { FormSection } from '@@/form-components/FormSection';
import { FormSectionTitle } from '@@/form-components/FormSectionTitle';
import { Slider } from '@@/form-components/Slider';
import { SwitchField } from '@@/form-components/SwitchField';
import { TextTip } from '@@/Tip/TextTip';
import { SliderWithInput } from '@@/form-components/Slider/SliderWithInput';

import { useClusterResourceLimitsQuery } from '../../../queries/useResourceLimitsQuery';

import { ResourceReservationUsage } from './ResourceReservationUsage';
import { ResourceQuotaFormValues } from './types';

interface Props {
  values: ResourceQuotaFormValues;
  onChange: (value: ResourceQuotaFormValues) => void;
  enableResourceOverCommit?: boolean;
  errors?: FormikErrors<ResourceQuotaFormValues>;
  namespaceName?: string;
  isEdit?: boolean;
  isEditingDisabled?: boolean;
}

export function ResourceQuotaFormSection({
  values,
  onChange,
  errors,
  isEdit,
  enableResourceOverCommit,
  namespaceName,
  isEditingDisabled,
}: Props) {
  const environmentId = useEnvironmentId();
  const resourceLimitsQuery = useClusterResourceLimitsQuery(environmentId);
  const cpuLimit = resourceLimitsQuery.data?.CPU ?? 0;
  const memoryLimit = resourceLimitsQuery.data?.Memory ?? 0;

  return (
    <FormSection title="Resource Quota">
      {!isEditingDisabled && (
        <>
          <TextTip color="blue" className="mb-2">
            A resource quota sets boundaries on the compute resources a
            namespace can use. It&apos;s good practice to set a quota for a
            namespace to manage resources effectively. Alternatively, you can
            disable assigning a quota for unrestricted access (not recommended).
          </TextTip>

          <div className="form-group">
            <div className="col-sm-12">
              <SwitchField
                data-cy="k8sNamespaceCreate-resourceAssignmentToggle"
                disabled={!enableResourceOverCommit}
                label="Resource assignment"
                labelClass="col-sm-3 col-lg-2"
                checked={values.enabled || !enableResourceOverCommit}
                onChange={(enabled) => onChange({ ...values, enabled })}
              />
            </div>
          </div>
        </>
      )}

      {(values.enabled || !enableResourceOverCommit) && !isEditingDisabled && (
        <div>
          <FormSectionTitle>Resource Limits</FormSectionTitle>
          {(!cpuLimit || !memoryLimit) && (
            <FormError>
              Not enough resources available in the cluster to apply a resource
              reservation.
            </FormError>
          )}

          <FormControl
            label="Memory limit (MB)"
            inputId="memory-limit"
            className="[&>label]:mt-8"
            errors={errors?.memory}
          >
            {memoryLimit >= 0 && (
              <SliderWithInput
                value={Number(values.memory) ?? 0}
                onChange={(value) =>
                  onChange({ ...values, memory: `${value}` })
                }
                max={memoryLimit}
                min={0}
                step={128}
                dataCy="k8sNamespaceCreate-memoryLimit"
                visibleTooltip
                inputId="memory-limit"
              />
            )}
          </FormControl>

          <FormControl
            label="CPU limit"
            inputId="cpu-limit"
            className="[&>label]:mt-8"
            errors={errors?.cpu}
          >
            {cpuLimit >= 0 && (
              <Slider
                min={0}
                max={cpuLimit / 1000}
                step={0.1}
                value={Number(values.cpu) ?? 0}
                onChange={(cpu) => {
                  if (Array.isArray(cpu)) {
                    return;
                  }
                  onChange({ ...values, cpu: cpu.toString() });
                }}
                dataCy="k8sNamespaceCreate-cpuLimitSlider"
                visibleTooltip
              />
            )}
          </FormControl>

          {cpuLimit && memoryLimit && typeof errors === 'string' ? (
            <FormError>{errors}</FormError>
          ) : null}
        </div>
      )}
      {namespaceName && isEdit && (
        <ResourceReservationUsage
          namespaceName={namespaceName}
          environmentId={environmentId}
          resourceQuotaValues={values}
        />
      )}
    </FormSection>
  );
}
