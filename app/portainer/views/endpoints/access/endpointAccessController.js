import angular from 'angular';

class EndpointAccessController {

  /* @ngInject */
  constructor($transition$, Notifications, EndpointService, GroupService, ExtensionService, RoleService) {
    this.$transition$ = $transition$;
    this.Notifications = Notifications;
    this.EndpointService = EndpointService;
    this.GroupService = GroupService;
    this.ExtensionService = ExtensionService;
    this.RoleService = RoleService;
  }

  async $onInit() {
    this.roles = [];
    this.rbacEnabled = false;

    try {
      this.rbacEnabled = await this.ExtensionService.extensionEnabled(this.ExtensionService.EXTENSIONS.RBAC);
      this.endpoint = await this.EndpointService.endpoint(this.$transition$.params().id);
      this.group = await this.GroupService.group(this.endpoint.GroupId);
      this.roles = await this.RoleService.roles();
      this.usersAndTeams = [
        {
          Name: "alice",
          Id: 1,
          Type: 'user',
          icon: '<i class="fa fa-user" aria-hidden="true"></i>'
        },
        {
          Name: "bob",
          Id: 2,
          Type: 'user',
          icon: '<i class="fa fa-user" aria-hidden="true"></i>'
        },
        {
          Name: "development01",
          Id: 1,
          Type: 'team',
          icon: '<i class="fa fa-users" aria-hidden="true"></i>'
        },
        {
          Name: "development02",
          Id: 2,
          Type: 'team',
          icon: '<i class="fa fa-users" aria-hidden="true"></i>'
        },
        {
          Name: "eve",
          Id: 3,
          Type: 'user',
          icon: '<i class="fa fa-user" aria-hidden="true"></i>'
        },
        {
          Name: "fred",
          Id: 4,
          Type: 'user',
          icon: '<i class="fa fa-user" aria-hidden="true"></i>'
        },
        {
          Name: "production01",
          Id: 3,
          Type: 'team',
          icon: '<i class="fa fa-users" aria-hidden="true"></i>'
        },
      ];

      this.formValues = {
        selectedUserAndTeams: [],
        selectedRole: this.roles[0],
      };
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve access informations');
    }
  }

  addSelected() {
    for (var i = 0; i < this.formValues.multiselectOutput.length; i++) {
      var item = this.formValues.multiselectOutput[i];
      item.Role = this.formValues.selectedRole.Name;
      this.formValues.selectedUserAndTeams.push(item);
    }
    angular.forEach(this.usersAndTeams, (value) => value.ticked = false);
    this.formValues.multiselectOutput = [];
  }
}

export default EndpointAccessController;
angular.module('portainer.app').controller('EndpointAccessController', EndpointAccessController);
