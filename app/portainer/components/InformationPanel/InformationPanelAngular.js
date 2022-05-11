export const InformationPanelAngular = {
  templateUrl: './InformationPanelAngular.html',
  bindings: {
    titleText: '@',
    dismissAction: '&?',
  },
  transclude: true,
};
