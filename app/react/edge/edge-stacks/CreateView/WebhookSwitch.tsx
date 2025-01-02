import { TextTip } from '@@/Tip/TextTip';
import { SwitchField } from '@@/form-components/SwitchField';

export function WebhookSwitch({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div>
      <div className="form-section-title"> Webhooks </div>
      <SwitchField
        label="Create an Edge stack webhook"
        checked={value}
        onChange={onChange}
        tooltip="Create a webhook (or callback URI) to automate the update of this stack. Sending a POST request to this callback URI (without requiring any authentication) will pull the most up-to-date version of the associated image and re-deploy this stack."
        labelClass="col-sm-3 col-lg-2"
        data-cy="webhook-switch"
      />

      {value && (
        <TextTip>
          Sending environment variables to the webhook is updating the stack
          with the new values. New variables names will be added to the stack
          and existing variables will be updated.
        </TextTip>
      )}
    </div>
  );
}
