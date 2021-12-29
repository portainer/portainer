import { Field, Form, Formik } from 'formik';

import { FormControl } from '@/portainer/components/form-components/FormControl';
import { Input, Select } from '@/portainer/components/form-components/Input';
import { FormSectionTitle } from '@/portainer/components/form-components/FormSectionTitle';
import { LoadingButton } from '@/portainer/components/Button/LoadingButton';
import { InputListError } from '@/portainer/components/form-components/InputList/InputList';
import { AccessControlForm } from '@/portainer/components/accessControlForm';

import { validationSchema } from './CreateContainerInstanceForm.validation';
import { PortMapping, PortsMappingField } from './PortsMappingField';
import { useLoadFormState } from './useLoadFormState';
import {
  getSubscriptionLocations,
  getSubscriptionResourceGroups,
} from './utils';

export function CreateContainerInstanceForm() {
  const {
    initialValues,
    isLoading,
    providers,
    subscriptions,
    resourceGroups,
    isUserAdmin,
  } = useLoadFormState();

  if (isLoading) {
    return null;
  }

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={() => validationSchema(isUserAdmin)}
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
            <Field name="name" as={Input} id="name-input" />
          </FormControl>

          <FormControl
            label="Image"
            inputId="image-input"
            errors={errors.image}
          >
            <Field name="image" as={Input} id="image-input" />
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
                dataCy="team-createTeamButton"
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

  function onSubmit() {}
}
