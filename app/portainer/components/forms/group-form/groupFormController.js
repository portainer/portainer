import angular from 'angular';

class GroupFormController {
  /* @ngInject */
  constructor($async, $scope, GroupService, Notifications, Authentication) {
    this.$async = $async;
    this.$scope = $scope;
    this.GroupService = GroupService;
    this.Notifications = Notifications;
    this.Authentication = Authentication;

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
}

angular.module('portainer.app').controller('GroupFormController', GroupFormController);
export default GroupFormController;
