angular.module('portainer.kubernetes').filter('kubernetesUsageLevelInfo', function () {
  return function (usage) {
    if (usage >= 80) {
      return 'danger';
    } else if (usage > 50 && usage < 80) {
      return 'warning';
    } else {
      return 'success';
    }
  };
});
