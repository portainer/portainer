import { FormikErrors } from 'formik';
import { useTranslation } from 'react-i18next';

import { useIsEdgeAdmin } from '@/react/hooks/useUser';

import { FormSectionTitle } from '@@/form-components/FormSectionTitle';
import { SwitchField } from '@@/form-components/SwitchField';

import { EditDetails } from '../EditDetails';
import { ResourceControlOwnership, AccessControlFormData } from '../types';
import { EnvironmentId } from '../../environments/types';

export interface Props {
  values: AccessControlFormData;
  onChange(values: AccessControlFormData): void;
  hideTitle?: boolean;
  formNamespace?: string;
  errors?: FormikErrors<AccessControlFormData>;
  environmentId: EnvironmentId;
}

export function AccessControlForm({
  values,
  onChange,
  hideTitle,
  formNamespace,
  errors,
  environmentId,
}: Props) {
  const { t } = useTranslation();
  const isAdminQuery = useIsEdgeAdmin();

  if (isAdminQuery.isLoading) {
    return null;
  }

  const { isAdmin } = isAdminQuery;

  const accessControlEnabled =
    values.ownership !== ResourceControlOwnership.PUBLIC;
  return (
    <>
      {!hideTitle && <FormSectionTitle>{t('access_control_form.title')}</FormSectionTitle>}

      <div className="form-group">
        <div className="col-sm-12">
          <SwitchField
            data-cy="portainer-accessMgmtToggle"
            checked={accessControlEnabled}
            name={withNamespace('accessControlEnabled')}
            label={t('access_control_form.enable_label')}
            labelClass="col-sm-3 col-lg-2"
            tooltip={t('access_control_form.enable_description')}
            onChange={handleToggleEnable}
          />
        </div>
      </div>

      {accessControlEnabled && (
        <EditDetails
          onChange={onChange}
          values={values}
          errors={errors}
          formNamespace={formNamespace}
          environmentId={environmentId}
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
