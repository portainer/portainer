import { Alert } from '@@/Alert';
import { SwitchField } from '@@/form-components/SwitchField';
import { FormControl } from '@@/form-components/FormControl';
import { Input } from '@@/form-components/Input';
import { FormSectionTitle } from '@@/form-components/FormSectionTitle';

import { DrainOptions as DrainOptionsValues } from './types';

interface Props {
  values: DrainOptionsValues;
  onChange: (values: DrainOptionsValues) => void;
  hasNodeWriteAccess: boolean;
}

export function DrainOptions({ values, onChange, hasNodeWriteAccess }: Props) {
  return (
    <>
      <FormSectionTitle titleSize="sm">Drain options</FormSectionTitle>
      <div className="form-group">
        <div className="col-sm-12">
          <SwitchField
            label="Ignore DaemonSets"
            labelClass="col-sm-5 col-lg-4"
            tooltip="Ignore DaemonSet-managed pods. These are skipped because they are recreated by their controller and would otherwise block the drain."
            checked={values.ignoreDaemonSets}
            disabled={!hasNodeWriteAccess}
            onChange={(checked) =>
              onChange({ ...values, ignoreDaemonSets: checked })
            }
            data-cy="node-drain-ignore-daemonsets"
          />
        </div>
      </div>
      <FormControl label="Timeout (seconds)" size="large">
        <Input
          type="number"
          min="0"
          className="max-w-[8rem]"
          value={values.timeoutSeconds}
          disabled={!hasNodeWriteAccess}
          onChange={(e) =>
            onChange({ ...values, timeoutSeconds: Number(e.target.value) })
          }
          data-cy="node-drain-timeout-input"
        />
      </FormControl>
      <FormControl label="Grace period (seconds)" size="large">
        <Input
          type="number"
          min="-1"
          className="max-w-[8rem]"
          value={values.gracePeriodSeconds}
          disabled={!hasNodeWriteAccess}
          onChange={(e) =>
            onChange({
              ...values,
              gracePeriodSeconds: Number(e.target.value),
            })
          }
          data-cy="node-drain-grace-period-input"
        />
      </FormControl>
      <div className="form-group">
        <div className="col-sm-12">
          <SwitchField
            label="Force"
            labelClass="col-sm-5 col-lg-4"
            tooltip="Continue even if there are pods not managed by a ReplicationController, ReplicaSet, Job, DaemonSet, or StatefulSet. Deleted pods are not recreated."
            checked={values.force}
            disabled={!hasNodeWriteAccess}
            onChange={(checked) => onChange({ ...values, force: checked })}
            data-cy="node-drain-force"
          />
        </div>
      </div>
      {values.force && (
        <div className="form-group">
          <div className="col-sm-12">
            <Alert color="warn">
              Force draining deletes standalone pods that are not managed by a
              controller. Those pods will not be recreated.
            </Alert>
          </div>
        </div>
      )}
      <div className="form-group">
        <div className="col-sm-12">
          <SwitchField
            label="Delete emptyDir data"
            labelClass="col-sm-5 col-lg-4"
            tooltip="Continue even if there are pods using emptyDir volumes."
            checked={values.deleteEmptyDirData}
            disabled={!hasNodeWriteAccess}
            onChange={(checked) =>
              onChange({ ...values, deleteEmptyDirData: checked })
            }
            data-cy="node-drain-delete-emptydir"
          />
        </div>
      </div>
      {values.deleteEmptyDirData && (
        <div className="form-group">
          <div className="col-sm-12">
            <Alert color="warn">
              Data in those volumes is deleted when the node is drained.
            </Alert>
          </div>
        </div>
      )}
      <div className="form-group">
        <div className="col-sm-12">
          <SwitchField
            label="Disable eviction"
            labelClass="col-sm-5 col-lg-4"
            tooltip="Force drain to use delete rather than evict. This bypasses checking PodDisruptionBudgets."
            checked={values.disableEviction}
            disabled={!hasNodeWriteAccess}
            onChange={(checked) =>
              onChange({ ...values, disableEviction: checked })
            }
            data-cy="node-drain-disable-eviction"
          />
        </div>
      </div>
      {values.disableEviction && (
        <div className="form-group">
          <div className="col-sm-12">
            <Alert color="warn">
              Pods will be deleted directly, ignoring any PodDisruptionBudgets
              that would otherwise protect application availability.
            </Alert>
          </div>
        </div>
      )}
    </>
  );
}
