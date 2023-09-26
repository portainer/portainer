import { Formik, Form, FormikProps, FormikHelpers } from 'formik';
import { useCallback, useEffect, useMemo } from 'react';
import _ from 'lodash';
import { useTransitionHook } from '@uirouter/react';

import { useCurrentEnvironment } from '@/react/hooks/useCurrentEnvironment';
import { IngressClassDatatable } from '@/react/kubernetes/cluster/ingressClass/IngressClassDatatable';
import {
  Environment,
  EnvironmentId,
} from '@/react/portainer/environments/types';
import { useAnalytics } from '@/react/hooks/useAnalytics';
import { FeatureId } from '@/react/portainer/feature-flags/enums';

import { FormSection } from '@@/form-components/FormSection';
import { TextTip } from '@@/Tip/TextTip';
import { SwitchField } from '@@/form-components/SwitchField';
import { FormActions } from '@@/form-components/FormActions';
import { confirm } from '@@/modals/confirm';
import { ModalType } from '@@/modals';
import { buildConfirmButton } from '@@/modals/utils';

import { useIngressControllerClassMapQuery } from '../../ingressClass/useIngressControllerClassMap';
import {
  IngressControllerClassMap,
  IngressControllerClassMapRowData,
} from '../../ingressClass/types';
import { useIsRBACEnabledQuery } from '../../getIsRBACEnabled';

import { useStorageClassesFormValues } from './useStorageClassesFormValues';
import { ConfigureFormValues, StorageClassFormValues } from './types';
import { configureValidationSchema } from './validation';
import { RBACAlert } from './RBACAlert';
import { EnableMetricsInput } from './EnableMetricsInput';
import { StorageClassDatatable } from './StorageClassDatatable';
import { useConfigureClusterMutation } from './useConfigureClusterMutation';
import { handleSubmitConfigureCluster } from './handleSubmitConfigureCluster';

export function ConfigureForm() {
  const { trackEvent } = useAnalytics();
  const configureClusterMutation = useConfigureClusterMutation();
  // get the initial values
  const { data: environment } = useCurrentEnvironment();
  const { data: storageClassFormValues } =
    useStorageClassesFormValues(environment);
  const { data: ingressClasses, ...ingressClassesQuery } =
    useIngressControllerClassMapQuery({
      environmentId: environment?.Id,
    });
  const initialValues = useInitialValues(
    environment,
    storageClassFormValues,
    ingressClasses
  );

  if (!initialValues || !environment) {
    return null;
  }

  return (
    <Formik<ConfigureFormValues>
      initialValues={initialValues}
      onSubmit={(
        values: ConfigureFormValues,
        formikHelpers: FormikHelpers<ConfigureFormValues>
      ) => {
        handleSubmitConfigureCluster(
          values,
          initialValues,
          configureClusterMutation,
          formikHelpers,
          trackEvent,
          environment
        );
      }}
      validationSchema={configureValidationSchema}
      validateOnMount
      enableReinitialize // enableReinitialize is needed to update the form values when the ingress classes data is fetched
    >
      {(formikProps) => (
        <InnerForm
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...formikProps}
          isIngressClassesLoading={ingressClassesQuery.isLoading}
          environmentId={environment.Id}
        />
      )}
    </Formik>
  );
}

function InnerForm({
  initialValues,
  setFieldValue,
  isValid,
  isSubmitting,
  values,
  errors,
  isIngressClassesLoading,
  environmentId,
}: FormikProps<ConfigureFormValues> & {
  isIngressClassesLoading: boolean;
  environmentId: EnvironmentId;
}) {
  const { data: isRBACEnabled, ...isRBACEnabledQuery } =
    useIsRBACEnabledQuery(environmentId);

  const onChangeControllers = useCallback(
    (controllerClassMap: IngressControllerClassMap[]) =>
      setFieldValue('ingressClasses', controllerClassMap),
    [setFieldValue]
  );

  // when navigating away from the page with unsaved changes, show a portainer prompt to confirm
  useTransitionHook('onBefore', {}, async () => {
    if (!isFormChanged(values, initialValues)) {
      return true;
    }
    const confirmed = await confirm({
      modalType: ModalType.Warn,
      title: 'Are you sure?',
      message:
        'You currently have unsaved changes in the cluster setup view. Are you sure you want to leave?',
      confirmButton: buildConfirmButton('Yes', 'danger'),
    });
    return confirmed;
  });

  // when reloading or exiting the page with unsaved changes, show a browser prompt to confirm
  useEffect(() => {
    // the handler for showing the prompt
    // https://developer.mozilla.org/en-US/docs/Web/API/WindowEventHandlers/onbeforeunload
    function handler(event: BeforeUnloadEvent) {
      event.preventDefault();
      // eslint-disable-next-line no-param-reassign
      event.returnValue = '';
    }

    // if the form is changed, then set the onbeforeunload
    if (isFormChanged(values, initialValues)) {
      window.addEventListener('beforeunload', handler);
      return () => {
        window.removeEventListener('beforeunload', handler);
      };
    }
    return () => {};
  }, [values, initialValues]);

  return (
    <Form className="form-horizontal">
      <div className="flex flex-col">
        <FormSection title="Networking - Services">
          <TextTip color="blue" className="mb-2">
            Enabling the load balancer feature will allow users to expose
            applications they deploy over an external IP address assigned by the
            cloud provider.
          </TextTip>
          <TextTip color="orange" className="mb-4">
            If you want to use this feature, ensure your cloud provider allows
            you to create load balancers. This may incur costs.
          </TextTip>
          <div className="form-group">
            <div className="col-sm-12">
              <SwitchField
                name="useLoadBalancer"
                data-cy="kubeSetup-loadBalancerToggle"
                label="Allow users to use external load balancers"
                labelClass="col-sm-5 col-lg-4"
                checked={values.useLoadBalancer}
                onChange={(checked) =>
                  setFieldValue('useLoadBalancer', checked)
                }
              />
            </div>
          </div>
        </FormSection>
        <FormSection title="Networking - Ingresses">
          <IngressClassDatatable
            onChangeControllers={onChangeControllers}
            description="Enabling ingress controllers in your cluster allows them to be available in the Portainer UI for users to publish applications over HTTP/HTTPS. A controller must have a class name for it to be included here."
            ingressControllers={
              values.ingressClasses as IngressControllerClassMapRowData[]
            }
            initialIngressControllers={
              initialValues.ingressClasses as IngressControllerClassMapRowData[]
            }
            allowNoneIngressClass={values.allowNoneIngressClass}
            isLoading={isIngressClassesLoading}
            noIngressControllerLabel="No supported ingress controllers found."
            view="cluster"
          />
          <div className="form-group">
            <div className="col-sm-12">
              <SwitchField
                name="allowNoneIngressClass"
                data-cy="kubeSetup-allowNoneIngressClass"
                label='Allow ingress class to be set to "none"'
                tooltip='This allows users setting up ingresses to select "none" as the ingress class.'
                labelClass="col-sm-5 col-lg-4"
                checked={values.allowNoneIngressClass}
                onChange={(checked) =>
                  setFieldValue('allowNoneIngressClass', checked)
                }
              />
            </div>
          </div>
          <div className="form-group">
            <div className="col-sm-12">
              <SwitchField
                name="ingressAvailabilityPerNamespace"
                data-cy="kubeSetup-ingressAvailabilityPerNamespace"
                label="Configure ingress controller availability per namespace"
                tooltip="This allows an administrator to configure, in each namespace, which ingress controllers will be available for users to select when setting up ingresses for applications."
                labelClass="col-sm-5 col-lg-4"
                checked={values.ingressAvailabilityPerNamespace}
                onChange={(checked) =>
                  setFieldValue('ingressAvailabilityPerNamespace', checked)
                }
              />
            </div>
          </div>
          <div className="form-group">
            <div className="col-sm-12">
              <SwitchField
                name="restrictStandardUserIngressW"
                data-cy="kubeSetup-restrictStandardUserIngressWToggle"
                label="Only allow admins to deploy ingresses"
                featureId={FeatureId.K8S_ADM_ONLY_USR_INGRESS_DEPLY}
                tooltip="Enforces only allowing admins to deploy ingresses (and disallows standard users from doing so)."
                labelClass="col-sm-5 col-lg-4"
                checked={values.restrictStandardUserIngressW}
                onChange={(checked) =>
                  setFieldValue('restrictStandardUserIngressW', checked)
                }
              />
            </div>
          </div>
          <TextTip color="blue" className="mb-5">
            You may set up ingress defaults (hostnames and annotations) via
            Create/Edit ingress. Users may then select them via the hostname
            dropdown in Create/Edit application.
          </TextTip>
        </FormSection>
        <FormSection title="Change Window Settings">
          <div className="form-group">
            <div className="col-sm-12">
              <SwitchField
                name="changeWindow.Enabled"
                data-cy="kubeSetup-changeWindowEnabledToggle"
                label="Enable Change Window"
                tooltip="GitOps updates to stacks or applications outside the defined change window will not occur."
                labelClass="col-sm-5 col-lg-4"
                checked={false}
                featureId={FeatureId.HIDE_AUTO_UPDATE_WINDOW}
                onChange={() => {}}
              />
            </div>
          </div>
        </FormSection>
        <FormSection title="Security">
          {!isRBACEnabled && isRBACEnabledQuery.isSuccess && <RBACAlert />}
          <TextTip color="blue">
            <p>
              By default, all the users have access to the default namespace.
              Enable this option to set accesses on the default namespace.
            </p>
          </TextTip>
          <div className="form-group">
            <div className="col-sm-12">
              <SwitchField
                name="restrictDefaultNamespace"
                data-cy="kubeSetup-restrictDefaultNsToggle"
                label="Restrict access to the default namespace"
                labelClass="col-sm-5 col-lg-4"
                checked={values.restrictDefaultNamespace}
                onChange={(checked) =>
                  setFieldValue('restrictDefaultNamespace', checked)
                }
              />
            </div>
          </div>
        </FormSection>
        <FormSection title="Resources and Metrics">
          <TextTip color="orange">
            <p>
              By ENABLING resource over-commit, you are able to assign more
              resources to namespaces than is physically available in the
              cluster. This may lead to unexpected deployment failures if there
              is insufficient resource to service demand.
            </p>
          </TextTip>
          <TextTip color="blue">
            <p>
              By DISABLING resource over-commit (highly recommended), you are
              only able to assign resources to namespaces that are less (in
              aggregate) than the cluster total minus any system resource
              reservation.
            </p>
          </TextTip>
          <div className="form-group">
            <div className="col-sm-12">
              <SwitchField
                label="Allow resource over-commit"
                labelClass="col-sm-5 col-lg-4"
                name="resourceOverCommitPercentage"
                checked={values.enableResourceOverCommit}
                featureId={FeatureId.K8S_SETUP_DEFAULT}
                onChange={(checked: boolean) => {
                  setFieldValue('enableResourceOverCommit', checked);
                  // set 20% as the default resourceOverCommitPercentage value
                  if (!checked) {
                    setFieldValue('resourceOverCommitPercentage', 20);
                  }
                }}
                data-cy="kubeSetup-resourceOverCommitToggle"
              />
            </div>
          </div>
          <EnableMetricsInput
            environmentId={environmentId}
            error={errors.useServerMetrics}
            value={values.useServerMetrics}
          />
        </FormSection>
        <FormSection title="Available storage options">
          {initialValues.storageClasses.length === 0 && (
            <TextTip color="orange" className="mb-4">
              Unable to detect any storage class available to persist data.
              Users won&apos;t be able to persist application data inside this
              cluster.
            </TextTip>
          )}
          {initialValues.storageClasses.length > 0 && (
            <>
              <TextTip color="blue">
                <p>
                  Select which storage options will be available for use when
                  deploying applications. Have a look at your storage driver
                  documentation to figure out which access policy to configure
                  and if the volume expansion capability is supported.
                </p>
                <p>
                  You can find more information about access modes{' '}
                  <a
                    href="https://kubernetes.io/docs/concepts/storage/persistent-volumes/#access-modes"
                    target="_blank"
                    rel="noreferrer"
                  >
                    in the official Kubernetes documentation
                  </a>
                  .
                </p>
              </TextTip>
              <StorageClassDatatable
                storageClassValues={values.storageClasses}
              />
            </>
          )}
        </FormSection>
        <FormActions
          submitLabel="Save configuration"
          loadingText="Saving configuration"
          isLoading={isSubmitting}
          isValid={
            isValid &&
            !isIngressClassesLoading &&
            isFormChanged(values, initialValues)
          }
          data-cy="kubeSetup-saveConfigurationButton"
        />
      </div>
    </Form>
  );
}

function useInitialValues(
  environment?: Environment | null,
  storageClassFormValues?: StorageClassFormValues[],
  ingressClasses?: IngressControllerClassMapRowData[]
): ConfigureFormValues | undefined {
  return useMemo(() => {
    if (!environment) {
      return undefined;
    }
    return {
      storageClasses: storageClassFormValues || [],
      useLoadBalancer: !!environment.Kubernetes.Configuration.UseLoadBalancer,
      useServerMetrics: !!environment.Kubernetes.Configuration.UseServerMetrics,
      enableResourceOverCommit:
        !!environment.Kubernetes.Configuration.EnableResourceOverCommit,
      resourceOverCommitPercentage:
        environment.Kubernetes.Configuration.ResourceOverCommitPercentage || 20,
      restrictDefaultNamespace:
        !!environment.Kubernetes.Configuration.RestrictDefaultNamespace,
      restrictStandardUserIngressW:
        !!environment.Kubernetes.Configuration.RestrictStandardUserIngressW,
      ingressAvailabilityPerNamespace:
        !!environment.Kubernetes.Configuration.IngressAvailabilityPerNamespace,
      allowNoneIngressClass:
        !!environment.Kubernetes.Configuration.AllowNoneIngressClass,
      ingressClasses: ingressClasses || [],
    };
  }, [environment, ingressClasses, storageClassFormValues]);
}

function isFormChanged(
  values: ConfigureFormValues,
  initialValues: ConfigureFormValues
) {
  // check if the form values are different from the initial values
  return !_.isEqual(values, initialValues);
}
