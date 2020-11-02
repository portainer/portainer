import controller from './header-content.controller';

export const rdHeaderContent = {
  requires: '^rdHeader',
  transclude: true,
  templateUrl: './header-content.html',
  controller,
};
