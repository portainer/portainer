import { useField } from 'formik';

import { FormControl } from '@/portainer/components/form-components/FormControl';
import { Switch } from '@/portainer/components/form-components/SwitchField/Switch';
import { confirmAsync } from '@/portainer/services/modal.service/confirm';

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

    const confirmed = await confirmAsync({
      title: 'Disable Edge Environment Waiting Room',
      message:
        'By disabling the waiting room feature, all devices requesting association will be automatically associated and could pose a security risk. Are you sure?',
      buttons: {
        cancel: {
          label: 'Cancel',
          className: 'btn-default',
        },
        confirm: {
          label: 'Confirm',
          className: 'btn-danger',
        },
      },
    });

    helpers.setValue(!!confirmed);
  }
}
