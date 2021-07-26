import angular from 'angular';

import './por-help-image-link.css';

export const helpImageLink = {
  templateUrl: './por-help-image-link.html',
  bindings: {
    data: '<',
    copyLink: '<',
    onLinkClicked: '<',
  },
};

angular.module('portainer.app').component('porHelpImageLink', helpImageLink);
