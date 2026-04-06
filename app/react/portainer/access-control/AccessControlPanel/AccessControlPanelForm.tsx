import { Form, Formik } from 'formik';
import clsx from 'clsx';
import { useMutation } from '@tanstack/react-query';
import { object } from 'yup';
import { useTranslation, TFunction } from 'react-i18next';

import { useCurrentUser, useIsEdgeAdmin } from '@/react/hooks/useUser';
import { notifySuccess } from '@/portainer/services/notifications';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { confirm } from '@@/modals/confirm';
import { Button } from '@@/buttons';
import { LoadingButton } from '@@/buttons/LoadingButton';
import { buildConfirmButton } from '@@/modals/utils';
import { ModalType } from '@@/modals';

import { EditDetails } from '../EditDetails';
import { parseAccessControlFormData } from '../utils';
import { validationSchema } from '../AccessControlForm/AccessControlForm.validation';
import { applyResourceControlChange } from '../access-control.service';
import {
  ResourceControlType,
  ResourceId,
  AccessControlFormData,
} from '../types';
import { ResourceControlViewModel } from '../models/ResourceControlViewModel';

import styles from './AccessControlPanelForm.module.css';

interface Props {
  resourceType: ResourceControlType;
  resourceId: ResourceId;
  resourceControl?: ResourceControlViewModel;
  environmentId: EnvironmentId;
  onCancelClick(): void;
  onUpdateSuccess(): Promise<void>;
}

export function AccessControlPanelForm({
  resourceId,
  resourceType,
  resourceControl,
  environmentId,
  onCancelClick,
  onUpdateSuccess,
}: Props) {
  const { t } = useTranslation();
  const { user } = useCurrentUser();
  const isAdminQuery = useIsEdgeAdmin();

  const updateAccess = useMutation(
    (variables: AccessControlFormData) =>
      applyResourceControlChange(
        resourceType,
        resourceId,
        variables,
        resourceControl
      ),
    {
      meta: {
        error: { title: 'Failure', message: 'Unable to update access control' },
      },
      onSuccess() {
        return onUpdateSuccess();
      },
    }
  );

  if (isAdminQuery.isLoading) {
    return null;
  }

  const { isAdmin } = isAdminQuery;

  const initialValues = {
    accessControl: parseAccessControlFormData(
      isAdmin,
      user.Id,
      resourceControl
    ),
  };

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
      validateOnMount
      validateOnChange
      validationSchema={() =>
        object({ accessControl: validationSchema(isAdmin) })
      }
    >
      {({ setFieldValue, values, isSubmitting, isValid, errors }) => (
        <Form className={clsx('form-horizontal', styles.form)}>
          <EditDetails
            onChange={(accessControl) =>
              setFieldValue('accessControl', accessControl)
            }
            values={values.accessControl}
            isPublicVisible
            errors={errors.accessControl}
            environmentId={environmentId}
          />

          <div className="form-group">
            <div className="col-sm-12">
              <Button
                size="small"
                color="default"
                onClick={onCancelClick}
                data-cy="cancel-access-control-update-button"
              >
                {t('access_control.cancel')}
              </Button>
              <LoadingButton
                size="small"
                data-cy="update-access-control-button"
                color="primary"
                type="submit"
                isLoading={isSubmitting}
                disabled={!isValid}
                loadingText={t('access_control.updating_ownership')}
              >
                {t('access_control.update_ownership')}
              </LoadingButton>
            </div>
          </div>
        </Form>
      )}
    </Formik>
  );

  async function handleSubmit({
    accessControl,
  }: {
    accessControl: AccessControlFormData;
  }) {
    const confirmed = await confirmAccessControlUpdate(t);
    if (!confirmed) {
      return;
    }

    updateAccess.mutate(accessControl, {
      onSuccess() {
        notifySuccess('Success', t('access_control.update_success'));
      },
    });
  }
}

function confirmAccessControlUpdate(t: TFunction) {
  return confirm({
    modalType: ModalType.Warn,
    title: t('access_control.confirm_title'),
    message: t('access_control.confirm_message'),
    confirmButton: buildConfirmButton(t('access_control.confirm_button')),
  });
}
