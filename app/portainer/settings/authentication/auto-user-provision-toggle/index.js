export const autoUserProvisionToggle = {
  templateUrl: './auto-user-provision-toggle.html',
  transclude: {
    description: 'fieldDescription',
  },
  bindings: {
    ngModel: '=',
  },
};
