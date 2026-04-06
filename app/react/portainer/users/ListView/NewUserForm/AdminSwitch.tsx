import { useField } from 'formik';
import { useTranslation } from 'react-i18next';

import { SwitchField } from '@@/form-components/SwitchField';

import { FormValues } from './FormValues';

export function AdminSwitch() {
  const { t } = useTranslation();
  const [{ name, value }, , { setValue }] =
    useField<FormValues['isAdmin']>('isAdmin');
  return (
    <div className="form-group">
      <div className="col-sm-12">
        <SwitchField
          data-cy="user-adminSwitch"
          label={t('users.administrator')}
          tooltip={t('users.administrator_tooltip')}
          checked={value}
          onChange={(checked) => setValue(checked)}
          name={name}
          labelClass="col-sm-3 col-lg-2"
        />
      </div>
    </div>
  );
}
