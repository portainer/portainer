import { ResourceControlType } from '@/react/portainer/access-control/types';
import { AccessControlFormData } from 'Portainer/components/accessControlForm/porAccessControlFormModel';
import { FeatureId } from '@/react/portainer/feature-flags/enums';
import { getEnvironments } from '@/react/portainer/environments/environment.service';
import { StackStatus, StackType } from '@/react/common/stacks/types';
import { extractContainerNames } from '@/portainer/helpers/stackHelper';
import { confirmStackUpdate } from '@/react/common/stacks/common/confirm-stack-update';
import { confirm, confirmDelete, confirmWebEditorDiscard } from '@@/modals/confirm';
import { ModalType } from '@@/modals';
import { buildConfirmButton } from '@@/modals/utils';

angular.module('portainer.app').controller('StackController', [
  '$async',
  '$q',
  '$scope',
  '$state',
  '$window',
  '$transition$',
  'StackService',
  'NodeService',
  'ServiceService',
  'TaskService',
  'ContainerService',
  'ServiceHelper',
  'TaskHelper',
  'Notifications',
  'FormHelper',
  'GroupService',
  'StackHelper',
  'ResourceControlService',
  'Authentication',
  'ContainerHelper',
  'endpoint',
  function (
    $async,
    $q,
    $scope,
    $state,
    $window,
    $transition$,
    StackService,
    NodeService,
    ServiceService,
    TaskService,
    ContainerService,
    ServiceHelper,
    TaskHelper,
    Notifications,
    FormHelper,
    GroupService,
    StackHelper,
    ResourceControlService,
    Authentication,
    ContainerHelper,
    endpoint
  ) {
    $scope.STACK_TYPES = StackType;

    $scope.resourceType = ResourceControlType.Stack;

    $scope.onUpdateResourceControlSuccess = function () {
      $state.reload();
    };

    $scope.endpoint = endpoint;
    $scope.isAdmin = Authentication.isAdmin();
    $scope.stackWebhookFeature = FeatureId.STACK_WEBHOOK;
    $scope.stackPullImageFeature = FeatureId.STACK_PULL_IMAGE;
    $scope.state = {
      actionInProgress: false,
      migrationInProgress: false,
      showEditorTab: false,
      yamlError: false,
      isEditorDirty: false,
    };

    $scope.formValues = {
      Prune: false,
      Endpoint: null,
      AccessControlData: new AccessControlFormData(),
      Env: [],
    };

    $window.onbeforeunload = () => {
      if ($scope.stackFileContent && $scope.state.isEditorDirty) {
        return '';
      }
    };

    $scope.$on('$destroy', function () {
      $scope.state.isEditorDirty = false;
    });

    $scope.handleEnvVarChange = handleEnvVarChange;
    function handleEnvVarChange(value) {
      $scope.formValues.Env = value;
    }

    $scope.onEnableWebhookChange = function (enable) {
      $scope.$evalAsync(() => {
        $scope.formValues.EnableWebhook = enable;
      });
    };

    $scope.onPruneChange = function (enable) {
      $scope.$evalAsync(() => {
        $scope.formValues.Prune = enable;
      });
    };

    $scope.duplicateStack = function duplicateStack(name, targetEndpointId) {
      var stack = $scope.stack;
      var env = FormHelper.removeInvalidEnvVars($scope.formValues.Env);

      return StackService.duplicateStack(name, $scope.stackFileContent, env, targetEndpointId, stack.Type).then(onDuplicationSuccess).catch(notifyOnError);

      function onDuplicationSuccess() {
        Notifications.success('Success', 'Stack successfully duplicated');
        $state.go('docker.stacks', {}, { reload: true });
      }

      function notifyOnError(err) {
        Notifications.error('Failure', err, 'Unable to duplicate stack');
      }
    };

    $scope.showEditor = function () {
      $scope.state.showEditorTab = true;
    };

    $scope.migrateStack = function (name, endpointId) {
      return $q(async function (resolve) {
        const confirmed = await confirm({
          title: 'Are you sure?',
          modalType: ModalType.Warn,
          message:
            'This action will deploy a new instance of this stack on the target environment, please note that this does NOT relocate the content of any persistent volumes that may be attached to this stack.',
          confirmButton: buildConfirmButton('Migrate', 'danger'),
        });

        if (!confirmed) {
          return resolve();
        }
        return resolve(migrateStack(name, endpointId));
      });
    };

    $scope.removeStack = function () {
      confirmDelete('Do you want to remove the stack? Associated services will be removed as well').then((confirmed) => {
        if (!confirmed) {
          return;
        }
        deleteStack();
      });
    };

    $scope.detachStackFromGit = function () {
      confirmDetachment().then(function onConfirm(confirmed) {
        if (!confirmed) {
          return;
        }

        $scope.deployStack();
      });
    };

    function migrateStack(name, targetEndpointId) {
      const stack = $scope.stack;

      let migrateRequest = StackService.migrateSwarmStack;
      if (stack.Type === 2) {
        migrateRequest = StackService.migrateComposeStack;
      }

      // TODO: this is a work-around for stacks created with Portainer version >= 1.17.1
      // The EndpointID property is not available for these stacks, we can pass
      // the current endpoint identifier as a part of the migrate request. It will be used if
      // the EndpointID property is not defined on the stack.
      if (stack.EndpointId === 0) {
        stack.EndpointId = endpoint.Id;
      }

      $scope.state.migrationInProgress = true;
      return migrateRequest(stack, targetEndpointId, name)
        .then(function success() {
          Notifications.success('Stack successfully migrated', stack.Name);
          $state.go('docker.stacks', {}, { reload: true });
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to migrate stack');
        })
        .finally(function final() {
          $scope.state.migrationInProgress = false;
        });
    }

    function deleteStack() {
      var endpointId = +$state.params.endpointId;
      var stack = $scope.stack;

      StackService.remove(stack, $transition$.params().external, endpointId)
        .then(function success() {
          Notifications.success('Stack successfully removed', stack.Name);
          $state.go('docker.stacks');
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to remove stack ' + stack.Name);
        });
    }

    $scope.associateStack = function () {
      var endpointId = +$state.params.endpointId;
      var stack = $scope.stack;
      var accessControlData = $scope.formValues.AccessControlData;
      $scope.state.actionInProgress = true;

      StackService.associate(stack, endpointId, $scope.orphanedRunning)
        .then(function success(data) {
          const resourceControl = data.ResourceControl;
          const userDetails = Authentication.getUserDetails();
          const userId = userDetails.ID;
          return ResourceControlService.applyResourceControl(userId, accessControlData, resourceControl);
        })
        .then(function success() {
          Notifications.success('Stack successfully associated', stack.Name);
          $state.go('docker.stacks');
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to associate stack ' + stack.Name);
        })
        .finally(function final() {
          $scope.state.actionInProgress = false;
        });
    };

    $scope.deployStack = function () {
      const stack = $scope.stack;
      const isSwarmStack = stack.Type === 1;
      confirmStackUpdate('Do you want to force an update of the stack?', isSwarmStack).then(function (result) {
        if (!result) {
          return;
        }
        var stackFile = $scope.stackFileContent;
        var env = FormHelper.removeInvalidEnvVars($scope.formValues.Env);
        var prune = $scope.formValues.Prune;

        // TODO: this is a work-around for stacks created with Portainer version >= 1.17.1
        // The EndpointID property is not available for these stacks, we can pass
        // the current endpoint identifier as a part of the update request. It will be used if
        // the EndpointID property is not defined on the stack.
        if (stack.EndpointId === 0) {
          stack.EndpointId = endpoint.Id;
        }

        $scope.state.actionInProgress = true;
        StackService.updateStack(stack, stackFile, env, prune, result.pullImage)
          .then(function success() {
            Notifications.success('Success', 'Stack successfully deployed');
            $scope.state.isEditorDirty = false;
            $state.reload();
          })
          .catch(function error(err) {
            Notifications.error('Failure', err, 'Unable to create stack');
          })
          .finally(function final() {
            $scope.state.actionInProgress = false;
          });
      });
    };

    $scope.editorUpdate = function (value) {
      if ($scope.stackFileContent.replace(/(\r\n|\n|\r)/gm, '') !== value.replace(/(\r\n|\n|\r)/gm, '')) {
        $scope.state.isEditorDirty = true;
        $scope.stackFileContent = value;
        $scope.state.yamlError = StackHelper.validateYAML($scope.stackFileContent, $scope.containerNames, $scope.state.originalContainerNames);
      }
    };

    $scope.stopStack = stopStack;
    function stopStack() {
      return $async(stopStackAsync);
    }
    async function stopStackAsync() {
      const confirmed = await confirm({
        title: 'Are you sure?',
        modalType: ModalType.Warn,
        message: 'Are you sure you want to stop this stack?',
        confirmButton: buildConfirmButton('Stop', 'danger'),
      });
      if (!confirmed) {
        return;
      }

      $scope.state.actionInProgress = true;
      try {
        await StackService.stop(endpoint.Id, $scope.stack.Id);
        $state.reload();
      } catch (err) {
        Notifications.error('Failure', err, 'Unable to stop stack');
      }
      $scope.state.actionInProgress = false;
    }

    $scope.startStack = startStack;
    function startStack() {
      return $async(startStackAsync);
    }
    async function startStackAsync() {
      $scope.state.actionInProgress = true;
      const id = $scope.stack.Id;
      try {
        await StackService.start(endpoint.Id, id);
        $state.reload();
      } catch (err) {
        Notifications.error('Failure', err, 'Unable to start stack');
      }
      $scope.state.actionInProgress = false;
    }

    function loadStack(id) {
      return $async(async () => {
        var agentProxy = $scope.applicationState.endpoint.mode.agentProxy;

        getEnvironments()
          .then(function success(data) {
            $scope.endpoints = data.value;
          })
          .catch(function error(err) {
            Notifications.error('Failure', err, 'Unable to retrieve environments');
          });

        $q.all({
          stack: StackService.stack(id),
          groups: GroupService.groups(),
          containers: ContainerService.containers(true),
        })
          .then(function success(data) {
            var stack = data.stack;
            $scope.groups = data.groups;
            $scope.stack = stack;
            $scope.containerNames = ContainerHelper.getContainerNames(data.containers);

            $scope.formValues.Env = $scope.stack.Env;

            let resourcesPromise = Promise.resolve({});
            if (!stack.Status || stack.Status === 1) {
              resourcesPromise = stack.Type === 1 ? retrieveSwarmStackResources(stack.Name, agentProxy) : retrieveComposeStackResources(stack.Name);
            }

            return $q.all({
              stackFile: StackService.getStackFile(id),
              resources: resourcesPromise,
            });
          })
          .then(function success(data) {
            const isSwarm = $scope.stack.Type === StackType.DockerSwarm;
            $scope.stackFileContent = data.stackFile;
            // workaround for missing status, if stack has resources, set the status to 1 (active), otherwise to 2 (inactive) (https://github.com/portainer/portainer/issues/4422)
            if (!$scope.stack.Status) {
              $scope.stack.Status = data.resources && ((isSwarm && data.resources.services.length) || data.resources.containers.length) ? 1 : 2;
            }

            if (isSwarm && $scope.stack.Status === StackStatus.Active) {
              assignSwarmStackResources(data.resources, agentProxy);
            }
            $scope.state.originalContainerNames = extractContainerNames($scope.stackFileContent);

            $scope.state.yamlError = StackHelper.validateYAML($scope.stackFileContent, $scope.containerNames, $scope.state.originalContainerNames);
          })
          .catch(function error(err) {
            Notifications.error('Failure', err, 'Unable to retrieve stack details');
          });
      });
    }

    function retrieveSwarmStackResources(stackName, agentProxy) {
      var stackFilter = {
        label: ['com.docker.stack.namespace=' + stackName],
      };

      return $q.all({
        services: ServiceService.services(stackFilter),
        tasks: TaskService.tasks(stackFilter),
        containers: agentProxy ? ContainerService.containers(1) : [],
        nodes: NodeService.nodes(),
      });
    }

    function assignSwarmStackResources(resources, agentProxy) {
      var services = resources.services;
      var tasks = resources.tasks;

      if (agentProxy) {
        var containers = resources.containers;
        for (var j = 0; j < tasks.length; j++) {
          var task = tasks[j];
          TaskHelper.associateContainerToTask(task, containers);
        }
      }

      for (var i = 0; i < services.length; i++) {
        var service = services[i];
        ServiceHelper.associateTasksToService(service, tasks);
      }

      $scope.nodes = resources.nodes;
      $scope.tasks = tasks;
      $scope.services = services;
    }

    function retrieveComposeStackResources(stackName) {
      var stackFilter = {
        label: ['com.docker.compose.project=' + stackName],
      };

      return $q.all({
        containers: ContainerService.containers(1, stackFilter),
      });
    }

    function loadExternalStack(name) {
      const stackType = $scope.stackType;
      if (!stackType || (stackType !== StackType.DockerSwarm && stackType !== StackType.DockerCompose)) {
        Notifications.error('Failure', null, 'Invalid type URL parameter.');
        return;
      }

      if (stackType === StackType.DockerSwarm) {
        loadExternalSwarmStack(name);
      }
    }

    function loadExternalSwarmStack(name) {
      var agentProxy = $scope.applicationState.endpoint.mode.agentProxy;

      retrieveSwarmStackResources(name, agentProxy)
        .then(function success(data) {
          assignSwarmStackResources(data, agentProxy);
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to retrieve stack details');
        });
    }

    this.uiCanExit = async function () {
      if ($scope.stackFileContent && $scope.state.isEditorDirty) {
        return confirmWebEditorDiscard();
      }
    };

    async function canManageStacks() {
      return endpoint.SecuritySettings.allowStackManagementForRegularUsers || Authentication.isAdmin();
    }

    async function initView() {
      // if the user is not an admin, and stack management is disabled for non admins, then take the user to the dashboard
      $scope.createEnabled = await canManageStacks();
      if (!$scope.createEnabled) {
        $state.go('docker.dashboard');
      }

      var stackName = $transition$.params().name;
      $scope.stackName = stackName;

      const regular = $transition$.params().regular == 'true';
      $scope.regular = regular;

      var external = $transition$.params().external == 'true';
      $scope.external = external;

      const orphaned = $transition$.params().orphaned == 'true';
      $scope.orphaned = orphaned;

      const orphanedRunning = $transition$.params().orphanedRunning == 'true';
      $scope.orphanedRunning = orphanedRunning;

      $scope.stackType = parseInt($transition$.params().type, 10);

      if (external || (orphaned && orphanedRunning)) {
        loadExternalStack(stackName);
      }

      if (regular || orphaned) {
        const stackId = $transition$.params().id;
        loadStack(stackId);
      }

      $scope.composeSyntaxMaxVersion = endpoint.ComposeSyntaxMaxVersion;
    }

    initView();
  },
]);

function confirmDetachment() {
  return confirm({
    modalType: ModalType.Warn,
    title: 'Are you sure?',
    message: 'Do you want to detach the stack from Git?',
    confirmButton: buildConfirmButton('Detach', 'danger'),
  });
}
