import { useField } from 'formik';

import { SwitchField } from '@@/form-components/SwitchField';

import { FormValues } from './FormValues';

export function AdminSwitch() {
  const [{ name, value }, , { setValue }] =
    useField<FormValues['isAdmin']>('isAdmin');
  return (
    <div className="form-group">
      <div className="col-sm-12">
        <SwitchField
          data-cy="user-adminSwitch"
          label="Administrator"
          tooltip="Administrators have access to Portainer settings management as well as full control over all defined environments and their resources.'"
          checked={value}
          onChange={(checked) => setValue(checked)}
          name={name}
          labelClass="col-sm-3 col-lg-2"
        />
      </div>
    </div>
  );
}
