import moment from 'moment';

angular.module('portainer.docker').controller('EventsController', [
  '$scope',
  'Notifications',
  'SystemService',
  function ($scope, Notifications, SystemService) {
    function initView() {
      const since = moment().subtract(24, 'hour').unix();
      const until = moment().unix();

      SystemService.events({ since, until })
        .then(function success(data) {
          $scope.events = data;
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to load events');
        });
    }

    initView();
  },
]);
