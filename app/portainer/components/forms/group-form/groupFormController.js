import angular from 'angular';

class GroupFormController {
  /* @ngInject */
  constructor($async, $scope, GroupService, Notifications, Authentication) {
    this.$async = $async;
    this.$scope = $scope;
    this.GroupService = GroupService;
    this.Notifications = Notifications;
    this.Authentication = Authentication;

    this.state = {
      allowCreateTag: this.Authentication.isAdmin(),
    };

    this.unassociatedQuery = {
      groupIds: [1],
    };

    this.onChangeTags = this.onChangeTags.bind(this);
  }

  onChangeTags(value) {
    return this.$scope.$evalAsync(() => {
      this.model.TagIds = value;
    });
  }
}

angular.module('portainer.app').controller('GroupFormController', GroupFormController);
export default GroupFormController;
