import _ from 'lodash-es';
import angular from 'angular';
import { endpointsByGroup } from '@/portainer/environments/environment.service';
import { notifyError } from '@/portainer/services/notifications';

class GroupFormController {
  /* @ngInject */
  constructor($async, $scope, GroupService, Notifications, Authentication) {
    this.$async = $async;
    this.$scope = $scope;
    this.GroupService = GroupService;
    this.Notifications = Notifications;
    this.Authentication = Authentication;

    this.associateEndpoint = this.associateEndpoint.bind(this);
    this.dissociateEndpoint = this.dissociateEndpoint.bind(this);
    this.getPaginatedEndpointsByGroup = this.getPaginatedEndpointsByGroup.bind(this);
    this.onChangeTags = this.onChangeTags.bind(this);
  }

  onChangeTags(value) {
    return this.$scope.$evalAsync(() => {
      this.model.TagIds = value;
    });
  }

  $onInit() {
    this.state = {
      available: {
        limit: '10',
        filter: '',
        pageNumber: 1,
        totalCount: 0,
      },
      associated: {
        limit: '10',
        filter: '',
        pageNumber: 1,
        totalCount: 0,
      },
      allowCreateTag: this.Authentication.isAdmin(),
    };
  }
  associateEndpoint(endpoint) {
    if (this.pageType === 'create' && !_.includes(this.associatedEndpoints, endpoint)) {
      this.associatedEndpoints.push(endpoint);
    } else if (this.pageType === 'edit') {
      this.GroupService.addEndpoint(this.model.Id, endpoint)
        .then(() => {
          this.Notifications.success('Success', 'Environment successfully added to group');
          this.reloadTablesContent();
        })
        .catch((err) => this.Notifications.error('Error', err, 'Unable to add environment to group'));
    }
  }

  dissociateEndpoint(endpoint) {
    if (this.pageType === 'create') {
      _.remove(this.associatedEndpoints, (item) => item.Id === endpoint.Id);
    } else if (this.pageType === 'edit') {
      this.GroupService.removeEndpoint(this.model.Id, endpoint.Id)
        .then(() => {
          this.Notifications.success('Success', 'Environment successfully removed from group');
          this.reloadTablesContent();
        })
        .catch((err) => this.Notifications.error('Error', err, 'Unable to remove environment from group'));
    }
  }

  reloadTablesContent() {
    this.getPaginatedEndpointsByGroup(this.pageType, 'available');
    this.getPaginatedEndpointsByGroup(this.pageType, 'associated');
    this.GroupService.group(this.model.Id).then((data) => {
      this.model = data;
    });
  }

  getPaginatedEndpointsByGroup(pageType, tableType) {
    this.$async(async () => {
      try {
        if (tableType === 'available') {
          const context = this.state.available;
          const start = (context.pageNumber - 1) * context.limit + 1;
          const data = await endpointsByGroup(1, start, context.limit, { search: context.filter });
          this.availableEndpoints = data.value;
          this.state.available.totalCount = data.totalCount;
        } else if (tableType === 'associated' && pageType === 'edit') {
          const groupId = this.model.Id ? this.model.Id : 1;
          const context = this.state.associated;
          const start = (context.pageNumber - 1) * context.limit + 1;
          const data = await endpointsByGroup(groupId, start, context.limit, { search: context.filter });
          this.associatedEndpoints = data.value;
          this.state.associated.totalCount = data.totalCount;
        }
        // ignore (associated + create) group as there is no backend pagination for this table
      } catch (err) {
        notifyError('Failure', err, 'Failed getting endpoints for group');
      }
    });
  }
}

angular.module('portainer.app').controller('GroupFormController', GroupFormController);
export default GroupFormController;
