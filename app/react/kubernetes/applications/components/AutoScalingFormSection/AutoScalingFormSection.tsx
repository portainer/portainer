import { FormikErrors } from 'formik';

import { useIsEdgeAdmin } from '@/react/hooks/useUser';

import { SwitchField } from '@@/form-components/SwitchField';
import { Link } from '@@/Link';
import { TextTip } from '@@/Tip/TextTip';
import { Input } from '@@/form-components/Input';
import { FormError } from '@@/form-components/FormError';
import { Tooltip } from '@@/Tip/Tooltip';

import { AutoScalingFormValues } from './types';

type Props = {
  values: AutoScalingFormValues;
  onChange: (values: AutoScalingFormValues) => void;
  errors: FormikErrors<AutoScalingFormValues>;
  isMetricsEnabled: boolean;
};

export function AutoScalingFormSection({
  values,
  onChange,
  errors,
  isMetricsEnabled,
}: Props) {
  return (
    <>
      {!isMetricsEnabled && <NoMetricsServerWarning />}
      <SwitchField
        disabled={!isMetricsEnabled}
        label="Enable auto scaling for this application"
        labelClass="col-sm-3 col-lg-2"
        checked={values.isUsed}
        onChange={(value: boolean) => {
          // when enabling the auto scaler, set the default values
          const newValues =
            !values.isUsed && value
              ? {
                  minReplicas: 1,
                  maxReplicas: 3,
                  targetCpuUtilizationPercentage: 50,
                }
              : {};
          onChange({
            ...values,
            ...newValues,
            isUsed: value,
          });
        }}
      />
      {values.isUsed && (
        <div className="grid grid-cols-1 md:grid-cols-3 w-full gap-x-4 gap-y-2 my-3">
          <div className="flex flex-col min-w-fit">
            <label htmlFor="min-instances" className="font-normal text-xs">
              Minimum instances
            </label>
            <Input
              id="min-instances"
              type="number"
              min="1"
              value={values.minReplicas}
              max={values.maxReplicas || 1}
              onChange={(e) =>
                onChange({
                  ...values,
                  minReplicas: e.target.valueAsNumber,
                })
              }
              data-cy="k8sAppCreate-autoScaleMin"
            />
            {errors?.minReplicas && <FormError>{errors.minReplicas}</FormError>}
          </div>
          <div className="flex flex-col min-w-fit">
            <label htmlFor="max-instances" className="font-normal text-xs">
              Maximum instances
            </label>
            <Input
              id="max-instances"
              type="number"
              value={values.maxReplicas}
              min={values.minReplicas || 1}
              onChange={(e) =>
                onChange({
                  ...values,
                  maxReplicas: e.target.valueAsNumber,
                })
              }
              data-cy="k8sAppCreate-autoScaleMax"
            />
            {errors?.maxReplicas && <FormError>{errors.maxReplicas}</FormError>}
          </div>
          <div className="flex flex-col min-w-fit">
            <label
              htmlFor="cpu-threshold"
              className="font-normal text-xs flex items-center"
            >
              Target CPU usage (<b>%</b>)
              <Tooltip message="The autoscaler will ensure enough instances are running to maintain an average CPU usage across all instances." />
            </label>
            <Input
              id="cpu-threshold"
              type="number"
              value={values.targetCpuUtilizationPercentage}
              min="1"
              max="100"
              onChange={(e) =>
                onChange({
                  ...values,
                  targetCpuUtilizationPercentage: e.target.valueAsNumber,
                })
              }
              data-cy="k8sAppCreate-targetCPUInput"
            />
            {errors?.targetCpuUtilizationPercentage && (
              <FormError>{errors.targetCpuUtilizationPercentage}</FormError>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function NoMetricsServerWarning() {
  const isAdminQuery = useIsEdgeAdmin();
  if (isAdminQuery.isLoading) {
    return null;
  }

  const { isAdmin } = isAdminQuery;

  return (
    <TextTip color="orange">
      {isAdmin && (
        <>
          Server metrics features must be enabled in the{' '}
          <Link to="kubernetes.cluster.setup">
            environment configuration view
          </Link>
          .
        </>
      )}
      {!isAdmin &&
        'This feature is currently disabled and must be enabled by an administrator user.'}
    </TextTip>
  );
}
