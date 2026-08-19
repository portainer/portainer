import { FormikErrors } from 'formik';
import { round } from 'lodash';

import { FormControl } from '@@/form-components/FormControl';
import { Input } from '@@/form-components/Input';
import { TextTip } from '@@/Tip/TextTip';

import { ReplicaCountFormValues } from './types';

type Props = {
  values: ReplicaCountFormValues;
  onChange: (values: ReplicaCountFormValues) => void;
  errors: FormikErrors<ReplicaCountFormValues>;
  cpuLimit: number;
  memoryLimit: number;
  resourceReservationsOverflow: boolean;
  supportScalableReplicaDeployment: boolean;
};

export function ReplicationFormSection({
  values,
  onChange,
  errors,
  supportScalableReplicaDeployment,
  cpuLimit,
  memoryLimit,
  resourceReservationsOverflow,
}: Props) {
  const hasResourceLimit = cpuLimit !== 0 || memoryLimit !== 0;

  return (
    <>
      <FormControl
        label="Instance count"
        required
        errors={errors?.replicaCount}
      >
        <Input
          type="number"
          min="0"
          max="9999"
          value={values.replicaCount}
          disabled={!supportScalableReplicaDeployment}
          onChange={(e) => onChange({ replicaCount: e.target.valueAsNumber })}
          className="w-1/4"
          data-cy="k8sAppCreate-replicaCountInput"
        />
      </FormControl>
      {!resourceReservationsOverflow &&
        values.replicaCount > 1 &&
        hasResourceLimit && (
          <TextTip color="blue">
            This application will reserve the following resources:{' '}
            <b>{round(cpuLimit * values.replicaCount, 2)} CPU</b> and{' '}
            <b>{memoryLimit * values.replicaCount} MB</b> of memory.
          </TextTip>
        )}
    </>
  );
}
