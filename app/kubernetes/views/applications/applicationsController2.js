import angular from 'angular';

class KubernetesApplicationsController2 {
  /* @ngInject */
  constructor($async, $state, Notifications, KubernetesApplicationService) {
    this.$async = $async;
    this.$state = $state;
    this.Notifications = Notifications;
    this.KubernetesApplicationService = KubernetesApplicationService;

    this.onInit = this.onInit.bind(this);
    this.getApplications = this.getApplications.bind(this);
    this.getApplicationsAsync = this.getApplicationsAsync.bind(this);
    this.removeAction = this.removeAction.bind(this);
    this.removeActionAsync = this.removeActionAsync.bind(this);
  }

  async removeActionAsync(selectedItems) {
    let actionCount = selectedItems.length;
    for (const application of selectedItems) {
      try {
        await this.KubernetesApplicationService.remove(application);
        this.Notifications.success('Application successfully removed', application.Name);
        const index = this.applications.indexOf(application);
        this.applications.splice(index, 1);
      } catch (err) {
        this.Notifications.error('Failure', err, 'Unable to remove application');
      } finally {
        --actionCount;
        if (actionCount === 0) {
          this.$state.reload();
        }
      }
    }
  }

  removeAction(selectedItems) {
    return this.$async(this.removeActionAsync, selectedItems);
  }

  async getApplicationsAsync() {
    try {
      this.applications = await this.KubernetesApplicationService.applications();

      // TODO: mockup purpose

      this.ports = [];
      this.stacks = [];
      let stackInfo = [];

      for (const application of this.applications) {

        if (application.Stack !== "-") {
          const stack = {
            Name: application.Stack,
            ResourcePool: application.ResourcePool,
            ApplicationCount: 1
          };

          stackInfo.push(stack);
        }

        if (application.PublishedPorts.length > 0) {
          const mapping = {
            Expanded: true,
            ApplicationName: application.Name,
            ResourcePool: application.ResourcePool,
            ServiceType: application.ServiceType,
            LoadBalancerIPAddress: application.LoadBalancerIPAddress,
            Ports: []
          };

          for (const port of application.PublishedPorts) {
            const portDetails = {
              Port: port.port,
              TargetPort: port.targetPort,
              Protocol: port.protocol
            };

            mapping.Ports.push(portDetails);
          }

          this.ports.push(mapping);
        }

      }

      for (const stackDetails of stackInfo) {

        let found = false;
        let idxFound = 0;

        this.stacks.forEach(function (stack, idx) {
          if (stack.Name === stackDetails.Name) {
            found = true;
            idxFound = idx;
          }
        });

        if (found) {
          this.stacks[idxFound].ApplicationCount++;
        } else {
          this.stacks.push(stackDetails);
        }
      }



    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve applications');
    }
  }

  getApplications() {
    return this.$async(this.getApplicationsAsync);
  }

  async onInit() {
    this.getApplications();
  }

  $onInit() {
    this.state = {
      activeTab: 0
    };

    return this.$async(this.onInit);
  }
}

export default KubernetesApplicationsController2;
angular.module('portainer.kubernetes').controller('KubernetesApplicationsController2', KubernetesApplicationsController2);