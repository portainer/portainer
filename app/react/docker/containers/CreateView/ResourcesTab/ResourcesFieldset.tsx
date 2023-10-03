import { FormikErrors } from 'formik';
import { number, object, SchemaOf } from 'yup';

import { useSystemLimits } from '@/react/docker/proxy/queries/useInfo';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';

import { FormControl } from '@@/form-components/FormControl';
import { FormSection } from '@@/form-components/FormSection';
import { Slider } from '@@/form-components/Slider';
import { SliderWithInput } from '@@/form-components/Slider/SliderWithInput';

import { CreateContainerRequest } from '../types';

import { toConfigCpu, toConfigMemory } from './memory-utils';

export interface Values {
  reservation: number;
  limit: number;
  cpu: number;
}

export function ResourceFieldset({
  values,
  onChange,
  errors,
}: {
  values: Values;
  onChange: (values: Values) => void;
  errors: FormikErrors<Values> | undefined;
}) {
  const environmentId = useEnvironmentId();
  const { maxCpu, maxMemory } = useSystemLimits(environmentId);

  return (
    <FormSection title="Resources">
      <FormControl label="Memory reservation (MB)" errors={errors?.reservation}>
        <SliderWithInput
          value={values.reservation}
          onChange={(value) => onChange({ ...values, reservation: value })}
          max={maxMemory}
        />
      </FormControl>

      <FormControl label="Memory limit (MB)" errors={errors?.limit}>
        <SliderWithInput
          value={values.limit}
          onChange={(value) => onChange({ ...values, limit: value })}
          max={maxMemory}
        />
      </FormControl>

      <FormControl label="Maximum CPU usage" errors={errors?.cpu}>
        <Slider
          value={values.cpu}
          onChange={(value) =>
            onChange({
              ...values,
              cpu: typeof value === 'number' ? value : value[0],
            })
          }
          min={0}
          max={maxCpu}
          step={0.1}
        />
      </FormControl>
    </FormSection>
  );
}

export function toRequest(
  oldConfig: CreateContainerRequest['HostConfig'],
  values: Values
): CreateContainerRequest['HostConfig'] {
  return {
    ...oldConfig,
    NanoCpus: toConfigCpu(values.cpu),
    MemoryReservation: toConfigMemory(values.reservation),
    Memory: toConfigMemory(values.limit),
  };
}

export function resourcesValidation({
  maxMemory = Number.POSITIVE_INFINITY,
  maxCpu = Number.POSITIVE_INFINITY,
}: {
  maxMemory?: number;
  maxCpu?: number;
} = {}): SchemaOf<Values> {
  return object({
    reservation: number()
      .min(0)
      .max(maxMemory, `Value must be between 0 and ${maxMemory}`)
      .default(0),
    limit: number()
      .min(0)
      .max(maxMemory, `Value must be between 0 and ${maxMemory}`)
      .default(0),
    cpu: number()
      .min(0)
      .max(maxCpu, `Value must be between 0 and ${maxCpu}`)
      .default(0),
  });
}
