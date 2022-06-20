import controller from './HeaderContent.controller';

export const HeaderContent = {
  requires: '^rdHeader',
  transclude: true,
  templateUrl: './HeaderContent.html',
  controller,
};
