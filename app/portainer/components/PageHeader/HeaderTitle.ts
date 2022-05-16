import controller from './HeaderTitle.controller';

export const HeaderTitle = {
  requires: '^rdHeader',
  bindings: {
    titleText: '@',
  },
  transclude: true,
  templateUrl: './HeaderTitle.html',
  controller,
};
