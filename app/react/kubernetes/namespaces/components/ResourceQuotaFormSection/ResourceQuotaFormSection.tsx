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

import { useClusterResourceLimitsQuery } from '../../CreateView/queries/useResourceLimitsQuery';

import { ResourceQuotaFormValues } from './types';

interface Props {
  values: ResourceQuotaFormValues;
  onChange: (value: ResourceQuotaFormValues) => void;
  enableResourceOverCommit?: boolean;
  errors?: FormikErrors<ResourceQuotaFormValues>;
}

export function ResourceQuotaFormSection({
  values,
  onChange,
  errors,
  enableResourceOverCommit,
}: Props) {
  const environmentId = useEnvironmentId();
  const resourceLimitsQuery = useClusterResourceLimitsQuery(environmentId);
  const cpuLimit = resourceLimitsQuery.data?.CPU ?? 0;
  const memoryLimit = resourceLimitsQuery.data?.Memory ?? 0;

  return (
    <FormSection title="Resource Quota">
      <TextTip color="blue">
        A resource quota sets boundaries on the compute resources a namespace
        can use. It&apos;s good practice to set a quota for a namespace to
        manage resources effectively. Alternatively, you can disable assigning a
        quota for unrestricted access (not recommended).
      </TextTip>

      <SwitchField
        data-cy="k8sNamespaceCreate-resourceAssignmentToggle"
        disabled={!enableResourceOverCommit}
        label="Resource assignment"
        labelClass="col-sm-3 col-lg-2"
        fieldClass="pt-2"
        checked={values.enabled || !enableResourceOverCommit}
        onChange={(enabled) => onChange({ ...values, enabled })}
      />

      {(values.enabled || !enableResourceOverCommit) && (
        <div className="pt-5">
          <div className="flex flex-row">
            <FormSectionTitle>Resource Limits</FormSectionTitle>
          </div>

          {(!cpuLimit || !memoryLimit) && (
            <FormError>
              Not enough resources available in the cluster to apply a resource
              reservation.
            </FormError>
          )}

          {/* keep the FormError component present, but invisible to avoid layout shift */}
          {cpuLimit && memoryLimit ? (
            <FormError
              className={typeof errors === 'string' ? 'visible' : 'invisible'}
            >
              {/* 'error' keeps the formerror the exact same height while hidden so there is no layout shift */}
              {typeof errors === 'string' ? errors : 'error'}
            </FormError>
          ) : null}

          <FormControl
            className="flex flex-row"
            label="Memory limit (MB)"
            inputId="memory-limit"
          >
            <div className="col-xs-8">
              {memoryLimit >= 0 && (
                <SliderWithInput
                  value={Number(values.memory) ?? 0}
                  onChange={(value) =>
                    onChange({ ...values, memory: `${value}` })
                  }
                  max={memoryLimit}
                  step={128}
                  dataCy="k8sNamespaceCreate-memoryLimit"
                  visibleTooltip
                  inputId="memory-limit"
                />
              )}
              {errors?.memory && (
                <FormError className="pt-1">{errors.memory}</FormError>
              )}
            </div>
          </FormControl>

          <FormControl className="flex flex-row" label="CPU limit">
            <div className="col-xs-8">
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
            </div>
          </FormControl>
        </div>
      )}
    </FormSection>
  );
}
