import { Field, Form, Formik } from 'formik';
import { useCurrentStateAndParams, useRouter } from '@uirouter/react';

import { ContainerInstanceFormValues } from '@/azure/types';
import * as notifications from '@/portainer/services/notifications';
import { useUser } from '@/portainer/hooks/useUser';
import { AccessControlForm } from '@/portainer/access-control/AccessControlForm';

import { FormControl } from '@@/form-components/FormControl';
import { Input, Select } from '@@/form-components/Input';
import { FormSectionTitle } from '@@/form-components/FormSectionTitle';
import { LoadingButton } from '@@/buttons/LoadingButton';
import { InputListError } from '@@/form-components/InputList/InputList';

import { validationSchema } from './CreateContainerInstanceForm.validation';
import { PortMapping, PortsMappingField } from './PortsMappingField';
import { useLoadFormState } from './useLoadFormState';
import {
  getSubscriptionLocations,
  getSubscriptionResourceGroups,
} from './utils';
import { useCreateInstance } from './useCreateInstanceMutation';

export function CreateContainerInstanceForm() {
  const {
    params: { endpointId: environmentId },
  } = useCurrentStateAndParams();

  if (!environmentId) {
    throw new Error('endpointId url param is required');
  }

  const { isAdmin } = useUser();

  const { initialValues, isLoading, providers, subscriptions, resourceGroups } =
    useLoadFormState(environmentId, isAdmin);

  const router = useRouter();

  const { mutateAsync } = useCreateInstance(resourceGroups, environmentId);

  if (isLoading) {
    return null;
  }

  return (
    <Formik<ContainerInstanceFormValues>
      initialValues={initialValues}
      validationSchema={() => validationSchema(isAdmin)}
      onSubmit={onSubmit}
      validateOnMount
      validateOnChange
      enableReinitialize
    >
      {({
        errors,
        handleSubmit,
        isSubmitting,
        isValid,
        values,
        setFieldValue,
      }) => (
        <Form className="form-horizontal" onSubmit={handleSubmit} noValidate>
          <FormSectionTitle>Azure settings</FormSectionTitle>
          <FormControl
            label="Subscription"
            inputId="subscription-input"
            errors={errors.subscription}
          >
            <Field
              name="subscription"
              as={Select}
              id="subscription-input"
              options={subscriptions}
            />
          </FormControl>

          <FormControl
            label="Resource group"
            inputId="resourceGroup-input"
            errors={errors.resourceGroup}
          >
            <Field
              name="resourceGroup"
              as={Select}
              id="resourceGroup-input"
              options={getSubscriptionResourceGroups(
                values.subscription,
                resourceGroups
              )}
            />
          </FormControl>

          <FormControl
            label="Location"
            inputId="location-input"
            errors={errors.location}
          >
            <Field
              name="location"
              as={Select}
              id="location-input"
              options={getSubscriptionLocations(values.subscription, providers)}
            />
          </FormControl>

          <FormSectionTitle>Container configuration</FormSectionTitle>

          <FormControl label="Name" inputId="name-input" errors={errors.name}>
            <Field
              name="name"
              as={Input}
              id="name-input"
              placeholder="e.g. myContainer"
            />
          </FormControl>

          <FormControl
            label="Image"
            inputId="image-input"
            errors={errors.image}
          >
            <Field
              name="image"
              as={Input}
              id="image-input"
              placeholder="e.g. nginx:alpine"
            />
          </FormControl>

          <FormControl label="OS" inputId="os-input" errors={errors.os}>
            <Field
              name="os"
              as={Select}
              id="os-input"
              options={[
                { label: 'Linux', value: 'Linux' },
                { label: 'Windows', value: 'Windows' },
              ]}
            />
          </FormControl>

          <PortsMappingField
            value={values.ports}
            onChange={(value) => setFieldValue('ports', value)}
            errors={errors.ports as InputListError<PortMapping>[]}
          />

          <div className="form-group">
            <div className="col-sm-12 small text-muted">
              This will automatically deploy a container with a public IP
              address
            </div>
          </div>

          <FormSectionTitle>Container Resources</FormSectionTitle>

          <FormControl label="CPU" inputId="cpu-input" errors={errors.cpu}>
            <Field
              name="cpu"
              as={Input}
              id="cpu-input"
              type="number"
              placeholder="1"
            />
          </FormControl>

          <FormControl
            label="Memory"
            inputId="cpu-input"
            errors={errors.memory}
          >
            <Field
              name="memory"
              as={Input}
              id="memory-input"
              type="number"
              placeholder="1"
            />
          </FormControl>

          <AccessControlForm
            formNamespace="accessControl"
            onChange={(values) => setFieldValue('accessControl', values)}
            values={values.accessControl}
            errors={errors.accessControl}
          />

          <div className="form-group">
            <div className="col-sm-12">
              <LoadingButton
                disabled={!isValid}
                isLoading={isSubmitting}
                loadingText="Deployment in progress..."
              >
                <i className="fa fa-plus space-right" aria-hidden="true" />
                Deploy the container
              </LoadingButton>
            </div>
          </div>
        </Form>
      )}
    </Formik>
  );

  async function onSubmit(values: ContainerInstanceFormValues) {
    try {
      await mutateAsync(values);
      notifications.success('Container successfully created', values.name);
      router.stateService.go('azure.containerinstances');
    } catch (e) {
      notifications.error('Failure', e as Error, 'Unable to create container');
    }
  }
}
