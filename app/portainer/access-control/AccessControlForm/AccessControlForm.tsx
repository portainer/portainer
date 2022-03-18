import { FormikErrors } from 'formik';

import { useUser } from '@/portainer/hooks/useUser';
import { FormSectionTitle } from '@/portainer/components/form-components/FormSectionTitle';
import { SwitchField } from '@/portainer/components/form-components/SwitchField';
import { EditDetails } from '@/portainer/access-control/EditDetails/EditDetails';

import { ResourceControlOwnership, AccessControlFormData } from '../types';

export interface Props {
  values: AccessControlFormData;
  onChange(values: AccessControlFormData): void;
  hideTitle?: boolean;
  formNamespace?: string;
  errors?: FormikErrors<AccessControlFormData>;
}

export function AccessControlForm({
  values,
  onChange,
  hideTitle,
  formNamespace,
  errors,
}: Props) {
  const { isAdmin } = useUser();

  const accessControlEnabled =
    values.ownership !== ResourceControlOwnership.PUBLIC;
  return (
    <>
      {!hideTitle && <FormSectionTitle>Access control</FormSectionTitle>}

      <div className="form-group">
        <div className="col-sm-12">
          <SwitchField
            checked={accessControlEnabled}
            name={withNamespace('accessControlEnabled')}
            label="Enable access control"
            tooltip="When enabled, you can restrict the access and management of this resource."
            onChange={handleToggleEnable}
            dataCy="portainer-accessMgmtToggle"
          />
        </div>
      </div>

      {accessControlEnabled && (
        <EditDetails
          onChange={onChange}
          values={values}
          errors={errors}
          formNamespace={formNamespace}
        />
      )}
    </>
  );

  function withNamespace(name: string) {
    return formNamespace ? `${formNamespace}.${name}` : name;
  }

  function handleToggleEnable(accessControlEnabled: boolean) {
    let ownership = ResourceControlOwnership.PUBLIC;
    if (accessControlEnabled) {
      ownership = isAdmin
        ? ResourceControlOwnership.ADMINISTRATORS
        : ResourceControlOwnership.PRIVATE;
    }
    onChange({ ...values, ownership });
  }
}
