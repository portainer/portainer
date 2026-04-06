import { useField } from 'formik';
import { useTranslation } from 'react-i18next';

import { confirm } from '@@/modals/confirm';
import { FormControl } from '@@/form-components/FormControl';
import { Switch } from '@@/form-components/SwitchField/Switch';
import { buildConfirmButton } from '@@/modals/utils';
import { ModalType } from '@@/modals';

export function EnabledWaitingRoomSwitch() {
  const { t } = useTranslation();
  const [inputProps, meta, helpers] = useField<boolean>('EnableWaitingRoom');

  return (
    <FormControl
      inputId="edge_waiting_room"
      label={t('settings.enable_waiting_room_label')}
      size="medium"
      errors={meta.error}
    >
      <Switch
        id="edge_waiting_room"
        data-cy="edge-waiting-room-switch"
        name="EnableWaitingRoom"
        className="space-right"
        checked={inputProps.value}
        onChange={handleChange}
      />
    </FormControl>
  );

  async function handleChange(enable: boolean) {
    if (enable) {
      helpers.setValue(true);
      return;
    }

    const confirmed = await confirm({
      modalType: ModalType.Warn,
      title: t('settings.disable_waiting_room_title'),
      message: t('settings.disable_waiting_room_message'),
      confirmButton: buildConfirmButton(t('common.confirm'), 'danger'),
    });

    if (!confirmed) {
      return;
    }

    helpers.setValue(false);
  }
}
