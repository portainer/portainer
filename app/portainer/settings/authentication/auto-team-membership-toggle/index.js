export const autoTeamMembershipToggle = {
  templateUrl: './auto-team-membership-toggle.html',
  transclude: {
    description: 'fieldDescription',
  },
  bindings: {
    ngModel: '=',
  },
};
