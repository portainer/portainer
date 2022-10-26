import { Form, Formik } from 'formik';
import clsx from 'clsx';
import { useMutation } from 'react-query';
import { object } from 'yup';

import { useUser } from '@/portainer/hooks/useUser';
import { confirmAsync } from '@/portainer/services/modal.service/confirm';
import { notifySuccess } from '@/portainer/services/notifications';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { Button } from '@@/buttons';
import { LoadingButton } from '@@/buttons/LoadingButton';

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
  environmentId?: EnvironmentId;
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
  const { isAdmin } = useUser();

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

  const initialValues = {
    accessControl: parseAccessControlFormData(isAdmin, resourceControl),
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
              <Button size="small" color="default" onClick={onCancelClick}>
                Cancel
              </Button>
              <LoadingButton
                size="small"
                color="primary"
                type="submit"
                isLoading={isSubmitting}
                disabled={!isValid}
                loadingText="Updating Ownership"
              >
                Update Ownership
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
    const confirmed = await confirmAccessControlUpdate();
    if (!confirmed) {
      return;
    }

    updateAccess.mutate(accessControl, {
      onSuccess() {
        notifySuccess('Success', 'Access control successfully updated');
      },
    });
  }
}

function confirmAccessControlUpdate() {
  return confirmAsync({
    title: 'Are you sure?',
    message:
      'Changing the ownership of this resource will potentially restrict its management to some users.',
    buttons: {
      confirm: {
        label: 'Change ownership',
        className: 'btn-primary',
      },
    },
  });
}
