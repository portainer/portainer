import { useField } from 'formik';

import { confirm } from '@@/modals/confirm';
import { FormControl } from '@@/form-components/FormControl';
import { Switch } from '@@/form-components/SwitchField/Switch';
import { buildConfirmButton } from '@@/modals/utils';
import { ModalType } from '@@/modals';

export function EnabledWaitingRoomSwitch() {
  const [inputProps, meta, helpers] = useField<boolean>('TrustOnFirstConnect');

  return (
    <FormControl
      inputId="edge_waiting_room"
      label="Disable Edge Environment Waiting Room"
      errors={meta.error}
    >
      <Switch
        id="edge_waiting_room"
        name="TrustOnFirstConnect"
        className="space-right"
        checked={inputProps.value}
        onChange={handleChange}
      />
    </FormControl>
  );

  async function handleChange(trust: boolean) {
    if (!trust) {
      helpers.setValue(false);
      return;
    }

    const confirmed = await confirm({
      modalType: ModalType.Warn,
      title: 'Disable Edge Environment Waiting Room',
      message:
        'By disabling the waiting room feature, all devices requesting association will be automatically associated and could pose a security risk. Are you sure?',
      confirmButton: buildConfirmButton('Confirm', 'danger'),
    });

    helpers.setValue(!!confirmed);
  }
}
