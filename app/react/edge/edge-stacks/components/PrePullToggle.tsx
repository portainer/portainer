import { SwitchField } from '@@/form-components/SwitchField';

export function PrePullToggle({
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
          data-cy="kube-edge-stack-pre-pull-switch"
          name="prePullImage"
          label="Pre-pull images"
          tooltip="When enabled, redeployment will be executed when image(s) is pulled successfully"
          labelClass="col-sm-3 col-lg-2"
          onChange={onChange}
        />
      </div>
    </div>
  );
}
