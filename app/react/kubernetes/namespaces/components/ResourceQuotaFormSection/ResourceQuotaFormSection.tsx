import { FormikErrors } from 'formik';

import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';

import { FormControl } from '@@/form-components/FormControl';
import { FormError } from '@@/form-components/FormError';
import { FormSection } from '@@/form-components/FormSection';
import { FormSectionTitle } from '@@/form-components/FormSectionTitle';
import { Input } from '@@/form-components/Input/Input';
import { Slider } from '@@/form-components/Slider';
import { SwitchField } from '@@/form-components/SwitchField';
import { TextTip } from '@@/Tip/TextTip';

import { useResourceLimits } from '../../CreateView/queries';

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
  const resourceLimitsQuery = useResourceLimits(environmentId);
  const cpuLimit = resourceLimitsQuery.data?.CPU ?? 0;
  const memoryLimit = resourceLimitsQuery.data?.Memory ?? 0;

  return (
    <FormSection title="Resource Quota">
      {values.enabled ? (
        <TextTip color="blue">
          A namespace is a logical abstraction of a Kubernetes cluster, to
          provide for more flexible management of resources. Best practice is to
          set a quota assignment as this ensures greatest security/stability;
          alternatively, you can disable assigning a quota for unrestricted
          access (not recommended).
        </TextTip>
      ) : (
        <TextTip color="blue">
          A namespace is a logical abstraction of a Kubernetes cluster, to
          provide for more flexible management of resources. Resource
          over-commit is disabled, please assign a capped limit of resources to
          this namespace.
        </TextTip>
      )}

      <SwitchField
        data-cy="k8sNamespaceCreate-resourceAssignmentToggle"
        disabled={enableResourceOverCommit}
        label="Resource assignment"
        labelClass="col-sm-3 col-lg-2"
        fieldClass="pt-2"
        checked={values.enabled || !!enableResourceOverCommit}
        onChange={(enabled) => onChange({ ...values, enabled })}
      />

      {(values.enabled || !!enableResourceOverCommit) && (
        <div className="pt-5">
          <div className="flex flex-row">
            <FormSectionTitle>Resource Limits</FormSectionTitle>
          </div>
          <FormError
            className={typeof errors === 'string' ? 'visible' : 'invisible'}
          >
            {typeof errors === 'string' ? errors : ''}
          </FormError>
          <FormControl
            className="flex flex-row"
            label="Memory limit (MB)"
            inputId="memory-limit"
          >
            <div className="col-xs-6">
              <Slider
                min={0}
                max={memoryLimit}
                step={128}
                value={Number(values.memory) ?? 0}
                onChange={(memory) => {
                  if (Array.isArray(memory)) {
                    return;
                  }
                  onChange({ ...values, memory: memory.toString() });
                }}
                dataCy="k8sNamespaceCreate-memoryLimitSlider"
                visibleTooltip
              />
              {errors?.memory && (
                <FormError className="pt-1">{errors.memory}</FormError>
              )}
            </div>
            <div className="col-sm-2 vertical-center pt-6">
              <Input
                id="memory-limit"
                type="number"
                min="0"
                max={memoryLimit}
                onChange={(event) =>
                  onChange({ ...values, memory: event.target.value })
                }
                value={values.memory}
                data-cy="k8sNamespaceCreate-memoryLimitInput"
              />
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
