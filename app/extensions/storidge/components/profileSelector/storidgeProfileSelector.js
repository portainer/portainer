angular.module('extension.storidge').component('storidgeProfileSelector', {
  templateUrl: 'app/extensions/storidge/components/profileSelector/storidgeProfileSelector.html',
  controller: 'StoridgeProfileSelectorController',
  bindings: {
    'storidgeProfile': '='
  }
});
