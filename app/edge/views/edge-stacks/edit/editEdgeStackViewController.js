import angular from 'angular';
import _ from 'lodash-es';

class EditEdgeStackViewController {
  constructor($async, $state, EdgeGroupService, EdgeStackService, EndpointService, Notifications) {
    this.$async = $async;
    this.$state = $state;
    this.EdgeGroupService = EdgeGroupService;
    this.EdgeStackService = EdgeStackService;
    this.EndpointService = EndpointService;
    this.Notifications = Notifications;

    this.stack = null;
    this.edgeGroups = null;

    this.state = {
      actionInProgress: false,
    };

    this.deployStack = this.deployStack.bind(this);
    this.deployStackAsync = this.deployStackAsync.bind(this);
    this.getPaginatedEndpoints = this.getPaginatedEndpoints.bind(this);
    this.getPaginatedEndpointsAsync = this.getPaginatedEndpointsAsync.bind(this);
  }

  async $onInit() {
    const { stackId } = this.$state.params;
    try {
      const [edgeGroups, model, file] = await Promise.all([this.EdgeGroupService.groups(), this.EdgeStackService.stack(stackId), this.EdgeStackService.stackFile(stackId)]);
      this.edgeGroups = edgeGroups;
      this.stack = model;
      this.stackEndpointIds = this.filterStackEndpoints(model.EdgeGroups, edgeGroups);
      this.formValues = {
        StackFileContent: file,
        EdgeGroups: this.stack.EdgeGroups,
        Prune: this.stack.Prune,
      };
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve stack data');
    }
  }

  filterStackEndpoints(groupIds, groups) {
    return _.flatten(
      _.map(groupIds, (Id) => {
        const group = _.find(groups, { Id });
        return group.Endpoints;
      })
    );
  }

  deployStack() {
    return this.$async(this.deployStackAsync);
  }

  async deployStackAsync() {
    this.state.actionInProgress = true;
    try {
      await this.EdgeStackService.updateStack(this.stack.Id, this.formValues);
      this.Notifications.success('Stack successfully deployed');
      this.$state.go('edge.stacks');
    } catch (err) {
      this.Notifications.error('Deployment error', err, 'Unable to deploy stack');
    } finally {
      this.state.actionInProgress = false;
    }
  }

  getPaginatedEndpoints(...args) {
    return this.$async(this.getPaginatedEndpointsAsync, ...args);
  }

  async getPaginatedEndpointsAsync(lastId, limit, search) {
    try {
      const query = { search, type: 4, endpointIds: this.stackEndpointIds };
      const { value, totalCount } = await this.EndpointService.endpoints(lastId, limit, query);
      const endpoints = _.map(value, (endpoint) => {
        const status = this.stack.Status[endpoint.Id];
        endpoint.Status = status;
        return endpoint;
      });
      return { endpoints, totalCount };
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve endpoint information');
    }
  }
}

angular.module('portainer.edge').controller('EditEdgeStackViewController', EditEdgeStackViewController);
export default EditEdgeStackViewController;
