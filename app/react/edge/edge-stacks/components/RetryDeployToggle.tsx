import { SwitchField } from '@@/form-components/SwitchField';

export function RetryDeployToggle({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="form-group">
      <div className="col-sm-12">
        <SwitchField
          checked={value}
          data-cy="edge-stack-retry-deploy-toggle"
          name="retryDeploy"
          label="Retry deployment"
          tooltip="When enabled, this will allow the edge agent to retry deployment if failed to deploy initially"
          labelClass="col-sm-3 col-lg-2"
          onChange={onChange}
        />
      </div>
    </div>
  );
}
