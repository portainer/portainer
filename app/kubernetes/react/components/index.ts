import angular from 'angular';

import { r2a } from '@/react-tools/react2angular';
import { IngressClassDatatable } from '@/react/kubernetes/cluster/ingressClass/IngressClassDatatable';
import { NamespacesSelector } from '@/react/kubernetes/cluster/RegistryAccessView/NamespacesSelector';
import { StorageAccessModeSelector } from '@/react/kubernetes/cluster/ConfigureView/ConfigureForm/StorageAccessModeSelector';
import { NamespaceAccessUsersSelector } from '@/react/kubernetes/namespaces/AccessView/NamespaceAccessUsersSelector';
import { CreateNamespaceRegistriesSelector } from '@/react/kubernetes/namespaces/CreateView/CreateNamespaceRegistriesSelector';
import { KubeApplicationAccessPolicySelector } from '@/react/kubernetes/applications/CreateView/KubeApplicationAccessPolicySelector';
import { KubeServicesForm } from '@/react/kubernetes/applications/CreateView/application-services/KubeServicesForm';
import { kubeServicesValidation } from '@/react/kubernetes/applications/CreateView/application-services/kubeServicesValidation';
import { KubeApplicationDeploymentTypeSelector } from '@/react/kubernetes/applications/CreateView/KubeApplicationDeploymentTypeSelector';
import { withReactQuery } from '@/react-tools/withReactQuery';
import { withUIRouter } from '@/react-tools/withUIRouter';
import {
  ApplicationSummaryWidget,
  ApplicationDetailsWidget,
  ApplicationEventsDatatable,
} from '@/react/kubernetes/applications/DetailsView';
import { ApplicationContainersDatatable } from '@/react/kubernetes/applications/DetailsView/ApplicationContainersDatatable';
import { withFormValidation } from '@/react-tools/withFormValidation';
import { withCurrentUser } from '@/react-tools/withCurrentUser';
import { YAMLInspector } from '@/react/kubernetes/components/YAMLInspector';
import { ApplicationsStacksDatatable } from '@/react/kubernetes/applications/ListView/ApplicationsStacksDatatable';

export const ngModule = angular
  .module('portainer.kubernetes.react.components', [])
  .component(
    'ingressClassDatatable',
    r2a(IngressClassDatatable, [
      'onChangeControllers',
      'description',
      'ingressControllers',
      'initialIngressControllers',
      'allowNoneIngressClass',
      'isLoading',
      'noIngressControllerLabel',
      'view',
    ])
  )
  .component(
    'namespacesSelector',
    r2a(NamespacesSelector, [
      'dataCy',
      'inputId',
      'name',
      'namespaces',
      'onChange',
      'placeholder',
      'value',
    ])
  )
  .component(
    'storageAccessModeSelector',
    r2a(StorageAccessModeSelector, [
      'inputId',
      'onChange',
      'options',
      'value',
      'storageClassName',
    ])
  )
  .component(
    'namespaceAccessUsersSelector',
    r2a(NamespaceAccessUsersSelector, [
      'inputId',
      'onChange',
      'options',
      'value',
      'dataCy',
      'placeholder',
      'name',
    ])
  )
  .component(
    'createNamespaceRegistriesSelector',
    r2a(CreateNamespaceRegistriesSelector, [
      'inputId',
      'onChange',
      'options',
      'value',
    ])
  )
  .component(
    'kubeApplicationAccessPolicySelector',
    r2a(KubeApplicationAccessPolicySelector, [
      'value',
      'onChange',
      'isEdit',
      'persistedFoldersUseExistingVolumes',
    ])
  )
  .component(
    'kubeApplicationDeploymentTypeSelector',
    r2a(KubeApplicationDeploymentTypeSelector, [
      'value',
      'onChange',
      'supportGlobalDeployment',
    ])
  )
  .component(
    'kubeYamlInspector',
    r2a(withUIRouter(withReactQuery(withCurrentUser(YAMLInspector))), [
      'identifier',
      'data',
      'hideMessage',
    ])
  )
  .component(
    'applicationSummaryWidget',
    r2a(
      withUIRouter(withReactQuery(withCurrentUser(ApplicationSummaryWidget))),
      []
    )
  )
  .component(
    'applicationContainersDatatable',
    r2a(
      withUIRouter(
        withReactQuery(withCurrentUser(ApplicationContainersDatatable))
      ),
      []
    )
  )
  .component(
    'applicationDetailsWidget',
    r2a(
      withUIRouter(withReactQuery(withCurrentUser(ApplicationDetailsWidget))),
      []
    )
  )
  .component(
    'applicationEventsDatatable',
    r2a(
      withUIRouter(withReactQuery(withCurrentUser(ApplicationEventsDatatable))),
      []
    )
  )
  .component(
    'kubernetesApplicationsStacksDatatable',
    r2a(withUIRouter(withCurrentUser(ApplicationsStacksDatatable)), [
      'dataset',
      'onRefresh',
      'onRemove',
      'namespace',
      'namespaces',
      'onNamespaceChange',
      'isLoading',
    ])
  );

export const componentsModule = ngModule.name;

withFormValidation(
  ngModule,
  withUIRouter(withCurrentUser(withReactQuery(KubeServicesForm))),
  'kubeServicesForm',
  ['values', 'onChange', 'appName', 'selector', 'isEditMode', 'namespace'],
  kubeServicesValidation
);
