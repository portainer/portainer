import angular from 'angular';

import { r2a } from '@/react-tools/react2angular';
import { NamespacesSelector } from '@/react/kubernetes/cluster/RegistryAccessView/NamespacesSelector';
import { KubeServicesForm } from '@/react/kubernetes/applications/CreateView/application-services/KubeServicesForm';
import { kubeServicesValidation } from '@/react/kubernetes/applications/CreateView/application-services/kubeServicesValidation';
import { withReactQuery } from '@/react-tools/withReactQuery';
import { withUIRouter } from '@/react-tools/withUIRouter';
import {
  PlacementFormSection,
  placementValidation,
} from '@/react/kubernetes/applications/components/PlacementFormSection';
import { ApplicationSummarySection } from '@/react/kubernetes/applications/components/ApplicationSummarySection';
import { withFormValidation } from '@/react-tools/withFormValidation';
import { withCurrentUser } from '@/react-tools/withCurrentUser';
import { YAMLInspector } from '@/react/kubernetes/components/YAMLInspector';
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
import { K8sRegistryAccessNotice } from '@/react/kubernetes/components/K8sRegistryAccessNotice';
import { KubernetesSummaryView } from '@/react/kubernetes/summary/KubernetesSummaryView';
import { SecretItemTabsWidget } from '@/react/kubernetes/configs/secrets/ItemView/SecretItemTabsWidget';

import { clusterManagementModule } from './clusterManagement';
import { registriesModule } from './registries';

export const ngModule = angular
  .module('portainer.kubernetes.react.components', [
    clusterManagementModule,
    registriesModule,
  ])
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
      'allowSelectAll',
    ])
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
      'isLoading',
      'isError',
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
    'applicationSummarySection',
    r2a(
      withUIRouter(withReactQuery(withCurrentUser(ApplicationSummarySection))),
      ['formValues', 'oldFormValues']
    )
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
  )
  .component(
    'secretItemTabsWidget',
    r2a(withUIRouter(withReactQuery(withCurrentUser(SecretItemTabsWidget))), [
      'name',
      'namespace',
      'secretTypeLabel',
      'isSystem',
      'registryId',
      'resourceId',
    ])
  )
  .component(
    'kubernetesSummaryViewReact',
    r2a(KubernetesSummaryView, ['actions', 'cpuLimit', 'memoryLimit'])
  )
  .component(
    'k8sRegistryAccessNotice',
    r2a(
      withUIRouter(withReactQuery(withCurrentUser(K8sRegistryAccessNotice))),
      ['namespace', 'manifestContent', 'environmentId']
    )
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
