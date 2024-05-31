import { SwitchField } from '@@/form-components/SwitchField';

import { FormValues } from './types';

export function DeploymentOptions({
  setFieldValue,
  values,
}: {
  values: FormValues;
  setFieldValue: <T>(field: string, value: T) => void;
}) {
  return (
    <>
      <div className="form-group">
        <div className="col-sm-12">
          <SwitchField
            checked={values.prePullImage}
            name="prePullImage"
            label="Pre-pull images"
            tooltip="When enabled, the image will be pre-pulled before deployment is started. This is useful in scenarios where the image download may be delayed or  intermittent and would subsequently cause the deployment to fail"
            labelClass="col-sm-3 col-lg-2"
            onChange={(value) => setFieldValue('prePullImage', value)}
            data-cy="pre-pull-images-switch"
          />
        </div>
      </div>

      <div className="form-group">
        <div className="col-sm-12">
          <SwitchField
            checked={values.retryDeploy}
            name="retryDeploy"
            label="Retry deployment"
            tooltip="When enabled, this will allow the edge agent to retry deployment if failed to deploy initially"
            labelClass="col-sm-3 col-lg-2"
            onChange={(value) => setFieldValue('retryDeploy', value)}
            data-cy="retry-deployment-switch"
          />
        </div>
      </div>
    </>
  );
}
