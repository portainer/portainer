import { Formik, Form, FormikProps, FormikHelpers } from 'formik';
import { useCallback, useEffect, useMemo } from 'react';
import _ from 'lodash';
import { useTransitionHook } from '@uirouter/react';
import { useTranslation } from 'react-i18next';

import { useCurrentEnvironment } from '@/react/hooks/useCurrentEnvironment';
import { IngressClassDatatable } from '@/react/kubernetes/cluster/ingressClass/IngressClassDatatable';
import {
  Environment,
  EnvironmentId,
} from '@/react/portainer/environments/types';
import { FeatureId } from '@/react/portainer/feature-flags/enums';

import { FormSection } from '@@/form-components/FormSection';
import { TextTip } from '@@/Tip/TextTip';
import { SwitchField } from '@@/form-components/SwitchField';
import { FormActions } from '@@/form-components/FormActions';
import { confirmGenericDiscard } from '@@/modals/confirm';
import { InsightsBox } from '@@/InsightsBox';

import { useIngressControllerClassMapQuery } from '../../ingressClass/useIngressControllerClassMap';
import { IngressControllerClassMap } from '../../ingressClass/types';
import { useIsRBACEnabled } from '../../useIsRBACEnabled';
import { getIngressClassesFormValues } from '../../ingressClass/IngressClassDatatable/utils';

import { useStorageClassesFormValues } from './useStorageClasses';
import { ConfigureFormValues, StorageClassFormValues } from './types';
import { configureValidationSchema } from './validation';
import { RBACAlert } from './RBACAlert';
import { EnableMetricsInput } from './EnableMetricsInput';
import { StorageClassDatatable } from './StorageClassDatatable';
import { useConfigureClusterMutation } from './useConfigureClusterMutation';
import { handleSubmitConfigureCluster } from './handleSubmitConfigureCluster';

export function ConfigureForm() {
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
  const { t } = useTranslation();
  const { data: isRBACEnabled, ...isRBACEnabledQuery } =
    useIsRBACEnabled(environmentId);

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
    const confirmed = await confirmGenericDiscard();
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
        <FormSection title={t('kubernetes.cluster.configure.networkingServices')}>
          <div className="form-group">
            <div className="col-sm-12">
              <TextTip color="blue" inline={false}>
                {t('kubernetes.cluster.configure.loadBalancerTip')}
              </TextTip>
            </div>
          </div>
          <div className="form-group">
            <div className="col-sm-12">
              <TextTip color="orange" inline={false}>
                {t('kubernetes.cluster.configure.loadBalancerCostWarning')}
              </TextTip>
            </div>
          </div>
          <div className="form-group">
            <div className="col-sm-12">
              <SwitchField
                name="useLoadBalancer"
                data-cy="kubeSetup-loadBalancerToggle"
                label={t('kubernetes.cluster.configure.allowExternalLoadBalancers')}
                labelClass="col-sm-5 col-lg-4"
                checked={values.useLoadBalancer}
                onChange={(checked) =>
                  setFieldValue('useLoadBalancer', checked)
                }
              />
            </div>
          </div>
        </FormSection>
        <FormSection title={t('kubernetes.cluster.configure.networkingIngresses')}>
          <IngressClassDatatable
            onChange={onChangeControllers}
            description={t('kubernetes.cluster.configure.ingressControllerDescription')}
            values={values.ingressClasses}
            initialValues={initialValues.ingressClasses}
            isLoading={isIngressClassesLoading}
            view="cluster"
            noIngressControllerLabel={t('kubernetes.cluster.configure.noIngressControllerLabel')}
          />
          <div className="form-group">
            <div className="col-sm-12">
              <SwitchField
                name="allowNoneIngressClass"
                data-cy="kubeSetup-allowNoneIngressClass"
                label={t('kubernetes.cluster.configure.allowNoneIngressClass')}
                tooltip={t('kubernetes.cluster.configure.allowNoneIngressClassTooltip')}
                labelClass="col-sm-5 col-lg-4"
                checked={values.allowNoneIngressClass}
                onChange={(checked) => {
                  setFieldValue('allowNoneIngressClass', checked);
                  // add or remove the none ingress class from the ingress classes list
                  if (checked) {
                    setFieldValue(
                      'ingressClasses',
                      getIngressClassesFormValues(
                        checked,
                        initialValues.ingressClasses
                      )
                    );
                  }
                }}
              />
            </div>
          </div>
          <div className="form-group">
            <div className="col-sm-12">
              <SwitchField
                name="ingressAvailabilityPerNamespace"
                data-cy="kubeSetup-ingressAvailabilityPerNamespace"
                label={t('kubernetes.cluster.configure.ingressAvailabilityPerNamespace')}
                tooltip={t('kubernetes.cluster.configure.ingressAvailabilityPerNamespaceTooltip')}
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
                label={t('kubernetes.cluster.configure.onlyAdminsDeployIngresses')}
                featureId={FeatureId.K8S_ADM_ONLY_USR_INGRESS_DEPLY}
                tooltip={t('kubernetes.cluster.configure.onlyAdminsDeployIngressesTooltip')}
                labelClass="col-sm-5 col-lg-4"
                checked={values.restrictStandardUserIngressW}
                onChange={(checked) =>
                  setFieldValue('restrictStandardUserIngressW', checked)
                }
              />
            </div>
          </div>
          <div className="form-group">
            <div className="col-sm-12">
              <TextTip color="blue" inline={false}>
                {t('kubernetes.cluster.configure.ingressDefaultsTip')}
              </TextTip>
            </div>
          </div>
        </FormSection>
        <FormSection title={t('kubernetes.cluster.configure.changeWindowSettings')}>
          <div className="form-group">
            <div className="col-sm-12">
              <SwitchField
                name="changeWindow.Enabled"
                data-cy="kubeSetup-changeWindowEnabledToggle"
                label={t('kubernetes.cluster.configure.enableChangeWindow')}
                tooltip={t('kubernetes.cluster.configure.enableChangeWindowTooltip')}
                labelClass="col-sm-5 col-lg-4"
                checked={false}
                featureId={FeatureId.HIDE_AUTO_UPDATE_WINDOW}
                onChange={() => {}}
              />
            </div>
          </div>
        </FormSection>
        <FormSection title={t('kubernetes.cluster.configure.security')}>
          <div className="form-group">
            <div className="col-sm-12">
              {!isRBACEnabled && isRBACEnabledQuery.isSuccess && <RBACAlert />}
            </div>
          </div>
          <div className="form-group">
            <div className="col-sm-12">
              <TextTip color="blue" inline={false}>
                <p>
                  {t('kubernetes.cluster.configure.defaultNamespaceAccessTip')}
                </p>
              </TextTip>
            </div>
          </div>
          <div className="form-group">
            <div className="col-sm-12">
              <SwitchField
                name="restrictDefaultNamespace"
                data-cy="kubeSetup-restrictDefaultNsToggle"
                label={t('kubernetes.cluster.configure.restrictDefaultNamespace')}
                labelClass="col-sm-5 col-lg-4"
                checked={values.restrictDefaultNamespace}
                onChange={(checked) =>
                  setFieldValue('restrictDefaultNamespace', checked)
                }
              />
            </div>
          </div>
          <div className="form-group">
            <div className="col-sm-12">
              <SwitchField
                name="restrictSecrets"
                data-cy="kubeSetup-restrictSecretsToggle"
                label={t('kubernetes.cluster.configure.restrictSecrets')}
                tooltip={t('kubernetes.cluster.configure.restrictSecretsTooltip')}
                labelClass="col-sm-5 col-lg-4"
                checked={false}
                featureId={FeatureId.K8S_ADM_ONLY_SECRETS}
                onChange={() => {}}
              />
            </div>
          </div>
        </FormSection>
        <FormSection title={t('kubernetes.cluster.configure.resourcesAndMetrics')}>
          <InsightsBox
            insightCloseId="resourceOverCommit"
            className="mb-4"
            header={t('kubernetes.cluster.configure.resourceOverCommitHeader')}
            content={t('kubernetes.cluster.configure.resourceOverCommitContent')}
          />
          <div className="form-group">
            <div className="col-sm-12">
              <TextTip color="blue" inline={false}>
                <p>
                  {t('kubernetes.cluster.configure.disableOverCommitTip')}
                </p>
              </TextTip>
            </div>
          </div>
          <div className="form-group">
            <div className="col-sm-12">
              <TextTip color="orange" inline={false}>
                <p>
                  {t('kubernetes.cluster.configure.enableOverCommitTip')}
                </p>
              </TextTip>
            </div>
          </div>
          <div className="form-group">
            <div className="col-sm-12">
              <SwitchField
                label={t('kubernetes.cluster.configure.allowResourceOverCommit')}
                labelClass="col-sm-5 col-lg-4"
                name="resourceOverCommitPercentage"
                checked
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
        <FormSection title={t('kubernetes.cluster.configure.availableStorageOptions')}>
          {initialValues.storageClasses.length === 0 && (
            <div className="form-group">
              <div className="col-sm-12">
                <TextTip color="orange" inline={false}>
                  {t('kubernetes.cluster.configure.noStorageClassTip')}
                </TextTip>
              </div>
            </div>
          )}
          {initialValues.storageClasses.length > 0 && (
            <>
              <div className="form-group">
                <div className="col-sm-12">
                  <TextTip color="blue" inline={false}>
                    <p>
                      {t('kubernetes.cluster.configure.storageOptionsTip')}
                    </p>
                    <p>
                      {t('kubernetes.cluster.configure.accessModesInfo')}{' '}
                      <a
                        href="https://kubernetes.io/docs/concepts/storage/persistent-volumes/#access-modes"
                        target="_blank"
                        rel="noreferrer"
                      >
                        {t('kubernetes.cluster.configure.accessModesDocLink')}
                      </a>
                      .
                    </p>
                  </TextTip>
                </div>
              </div>
              <StorageClassDatatable
                storageClassValues={values.storageClasses}
              />
            </>
          )}
        </FormSection>
        <FormActions
          submitLabel={t('kubernetes.cluster.configure.saveConfiguration')}
          loadingText={t('kubernetes.cluster.configure.savingConfiguration')}
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
  ingressClasses?: IngressControllerClassMap[]
): ConfigureFormValues | undefined {
  return useMemo(() => {
    if (!environment) {
      return undefined;
    }
    const allowNoneIngressClass =
      !!environment.Kubernetes.Configuration.AllowNoneIngressClass;

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
      allowNoneIngressClass,
      ingressClasses:
        getIngressClassesFormValues(allowNoneIngressClass, ingressClasses) ||
        [],
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
