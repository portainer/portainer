import angular from 'angular';

import { r2a } from '@/react-tools/react2angular';
import { IngressClassDatatableAngular } from '@/react/kubernetes/cluster/ingressClass/IngressClassDatatable/IngressClassDatatableAngular';
import { NamespacesSelector } from '@/react/kubernetes/cluster/RegistryAccessView/NamespacesSelector';
import { NamespaceAccessUsersSelector } from '@/react/kubernetes/namespaces/AccessView/NamespaceAccessUsersSelector';
import { RegistriesSelector } from '@/react/kubernetes/namespaces/components/RegistriesFormSection/RegistriesSelector';
import { KubeServicesForm } from '@/react/kubernetes/applications/CreateView/application-services/KubeServicesForm';
import { kubeServicesValidation } from '@/react/kubernetes/applications/CreateView/application-services/kubeServicesValidation';
import { withReactQuery } from '@/react-tools/withReactQuery';
import { withUIRouter } from '@/react-tools/withUIRouter';
import {
  ApplicationSummaryWidget,
  ApplicationDetailsWidget,
  ApplicationEventsDatatable,
} from '@/react/kubernetes/applications/DetailsView';
import { ApplicationContainersDatatable } from '@/react/kubernetes/applications/DetailsView/ApplicationContainersDatatable';
import {
  PlacementFormSection,
  placementValidation,
} from '@/react/kubernetes/applications/components/PlacementFormSection';
import { ApplicationSummarySection } from '@/react/kubernetes/applications/components/ApplicationSummarySection';
import { withFormValidation } from '@/react-tools/withFormValidation';
import { withCurrentUser } from '@/react-tools/withCurrentUser';
import { YAMLInspector } from '@/react/kubernetes/components/YAMLInspector';
import { ApplicationsStacksDatatable } from '@/react/kubernetes/applications/ListView/ApplicationsStacksDatatable';
import { NodesDatatable } from '@/react/kubernetes/cluster/HomeView/NodesDatatable';
import { StackName } from '@/react/kubernetes/DeployView/StackName/StackName';
import { StackNameLabelInsight } from '@/react/kubernetes/DeployView/StackName/StackNameLabelInsight';
import { SecretsFormSection } from '@/react/kubernetes/applications/components/ConfigurationsFormSection/SecretsFormSection';
import { configurationsValidationSchema } from '@/react/kubernetes/applications/components/ConfigurationsFormSection/configurationValidationSchema';
import { ConfigMapsFormSection } from '@/react/kubernetes/applications/components/ConfigurationsFormSection/ConfigMapsFormSection';
import { PersistedFoldersFormSection } from '@/react/kubernetes/applications/components/PersistedFoldersFormSection';
import { DataAccessPolicyFormSection } from '@/react/kubernetes/applications/CreateView/DataAccessPolicyFormSection';
import { persistedFoldersValidation } from '@/react/kubernetes/applications/components/PersistedFoldersFormSection/persistedFoldersValidation';
import {
  ResourceReservationFormSection,
  resourceReservationValidation,
} from '@/react/kubernetes/applications/components/ResourceReservationFormSection';
import {
  ReplicationFormSection,
  replicationValidation,
} from '@/react/kubernetes/applications/components/ReplicationFormSection';
import {
  AutoScalingFormSection,
  autoScalingValidation,
} from '@/react/kubernetes/applications/components/AutoScalingFormSection';
import { withControlledInput } from '@/react-tools/withControlledInput';
import {
  NamespaceSelector,
  namespaceSelectorValidation,
} from '@/react/kubernetes/applications/components/NamespaceSelector';
import { EditYamlFormSection } from '@/react/kubernetes/applications/components/EditYamlFormSection';
import {
  NameFormSection,
  appNameValidation,
} from '@/react/kubernetes/applications/components/NameFormSection';
import { deploymentTypeValidation } from '@/react/kubernetes/applications/components/AppDeploymentTypeFormSection/deploymentTypeValidation';
import { AppDeploymentTypeFormSection } from '@/react/kubernetes/applications/components/AppDeploymentTypeFormSection/AppDeploymentTypeFormSection';
import { EnvironmentVariablesFormSection } from '@/react/kubernetes/applications/components/EnvironmentVariablesFormSection/EnvironmentVariablesFormSection';
import { kubeEnvVarValidationSchema } from '@/react/kubernetes/applications/components/EnvironmentVariablesFormSection/kubeEnvVarValidationSchema';
import { IntegratedAppsDatatable } from '@/react/kubernetes/components/IntegratedAppsDatatable/IntegratedAppsDatatable';

import { applicationsModule } from './applications';
import { namespacesModule } from './namespaces';
import { clusterManagementModule } from './clusterManagement';
import { registriesModule } from './registries';

export const ngModule = angular
  .module('portainer.kubernetes.react.components', [
    applicationsModule,
    namespacesModule,
    clusterManagementModule,
    registriesModule,
  ])
  .component(
    'ingressClassDatatable',
    r2a(IngressClassDatatableAngular, [
      'onChangeControllers',
      'description',
      'ingressControllers',
      'initialIngressControllers',
      'allowNoneIngressClass',
      'isLoading',
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
    r2a(withUIRouter(withReactQuery(withCurrentUser(RegistriesSelector))), [
      'inputId',
      'onChange',
      'options',
      'value',
    ])
  )
  .component(
    'kubeNodesDatatable',
    r2a(withUIRouter(withReactQuery(withCurrentUser(NodesDatatable))), [])
  )
  .component(
    'accessPolicyFormSection',
    r2a(DataAccessPolicyFormSection, [
      'value',
      'onChange',
      'isEdit',
      'persistedFoldersUseExistingVolumes',
    ])
  )
  .component(
    'kubeYamlInspector',
    r2a(withUIRouter(withReactQuery(withCurrentUser(YAMLInspector))), [
      'identifier',
      'data',
      'hideMessage',
      'data-cy',
    ])
  )
  .component(
    'kubeStackName',
    r2a(
      withControlledInput(
        withUIRouter(
          withReactQuery(withCurrentUser(withControlledInput(StackName)))
        ),
        { stackName: 'setStackName' }
      ),
      [
        'setStackName',
        'stackName',
        'stacks',
        'inputClassName',
        'textTip',
        'error',
      ]
    )
  )
  .component(
    'stackNameLabelInsight',
    r2a(withUIRouter(withCurrentUser(StackNameLabelInsight)), [])
  )
  .component(
    'editYamlFormSection',
    r2a(withUIRouter(withReactQuery(withCurrentUser(EditYamlFormSection))), [
      'values',
      'onChange',
      'isComposeFormat',
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
    'applicationSummarySection',
    r2a(
      withUIRouter(withReactQuery(withCurrentUser(ApplicationSummarySection))),
      ['formValues', 'oldFormValues']
    )
  )
  .component(
    'kubernetesApplicationsStacksDatatable',
    r2a(withUIRouter(withCurrentUser(ApplicationsStacksDatatable)), [
      'onRemove',
      'namespace',
      'namespaces',
      'onNamespaceChange',
      'showSystem',
      'setSystemResources',
    ])
  )
  .component(
    'kubernetesIntegratedApplicationsDatatable',
    r2a(withUIRouter(withCurrentUser(IntegratedAppsDatatable)), [
      'dataset',
      'isLoading',
      'onRefresh',
      'tableKey',
      'tableTitle',
      'dataCy',
    ])
  );

export const componentsModule = ngModule.name;

withFormValidation(
  ngModule,
  withUIRouter(
    withCurrentUser(
      withReactQuery(
        withControlledInput(KubeServicesForm, { values: 'onChange' })
      )
    )
  ),
  'kubeServicesForm',
  ['values', 'onChange', 'appName', 'selector', 'isEditMode', 'namespace'],
  kubeServicesValidation
);

withFormValidation(
  ngModule,
  withControlledInput(
    withUIRouter(withCurrentUser(withReactQuery(ConfigMapsFormSection))),
    { values: 'onChange' }
  ),
  'configMapsFormSection',
  ['values', 'onChange', 'namespace'],
  configurationsValidationSchema
);

withFormValidation(
  ngModule,
  withControlledInput(
    withUIRouter(withCurrentUser(withReactQuery(SecretsFormSection))),
    { values: 'onChange' }
  ),
  'secretsFormSection',
  ['values', 'onChange', 'namespace'],
  configurationsValidationSchema
);

withFormValidation(
  ngModule,
  withControlledInput(
    withUIRouter(withCurrentUser(withReactQuery(PersistedFoldersFormSection))),
    { values: 'onChange' }
  ),
  'persistedFoldersFormSection',
  [
    'isEdit',
    'applicationValues',
    'isAddPersistentFolderButtonShown',
    'initialValues',
    'availableVolumes',
  ],
  persistedFoldersValidation
);

withFormValidation(
  ngModule,
  withControlledInput(
    withUIRouter(
      withCurrentUser(withReactQuery(ResourceReservationFormSection))
    ),
    { values: 'onChange' }
  ),
  'resourceReservationFormSection',
  [
    'namespaceHasQuota',
    'resourceQuotaCapacityExceeded',
    'minMemoryLimit',
    'minCpuLimit',
    'maxMemoryLimit',
    'maxCpuLimit',
  ],
  resourceReservationValidation
);

withFormValidation(
  ngModule,
  withControlledInput(
    withUIRouter(withCurrentUser(withReactQuery(ReplicationFormSection))),
    { values: 'onChange' }
  ),
  'replicationFormSection',
  [
    'supportScalableReplicaDeployment',
    'cpuLimit',
    'memoryLimit',
    'resourceReservationsOverflow',
  ],
  replicationValidation
);

withFormValidation(
  ngModule,
  withControlledInput(
    withUIRouter(withCurrentUser(withReactQuery(AutoScalingFormSection))),
    { values: 'onChange' }
  ),
  'autoScalingFormSection',
  ['isMetricsEnabled'],
  autoScalingValidation
);

withFormValidation(
  ngModule,
  withUIRouter(withCurrentUser(withReactQuery(PlacementFormSection))),
  'placementFormSection',
  [],
  placementValidation
);

withFormValidation(
  ngModule,
  withControlledInput(withUIRouter(withCurrentUser(NamespaceSelector)), {
    values: 'onChange',
  }),
  'namespaceSelector',
  ['isEdit'],
  namespaceSelectorValidation,
  true
);

withFormValidation(
  ngModule,
  withUIRouter(withCurrentUser(withReactQuery(NameFormSection))),
  'nameFormSection',
  ['isEdit'],
  appNameValidation,
  true
);

withFormValidation(
  ngModule,
  AppDeploymentTypeFormSection,
  'appDeploymentTypeFormSection',
  ['supportGlobalDeployment'],
  deploymentTypeValidation,
  true
);

withFormValidation(
  ngModule,
  withControlledInput(
    withUIRouter(
      withCurrentUser(withReactQuery(EnvironmentVariablesFormSection))
    ),
    { values: 'onChange' }
  ),
  'environmentVariablesFormSection',
  [],
  kubeEnvVarValidationSchema
);
