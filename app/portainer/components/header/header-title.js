import controller from './header-title.controller';

export const rdHeaderTitle = {
  requires: '^rdHeader',
  bindings: {
    titleText: '@',
  },
  transclude: true,
  templateUrl: './header-title.html',
  controller,
};
