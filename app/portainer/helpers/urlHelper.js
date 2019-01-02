angular.module('portainer.app').service('urlHelper', function urlHelper($location) {

  this.getParameter = getParameter;

  function getParameter(param) {
    var url = $location.absUrl();
    var index = url.indexOf('?');
    if (index < 0) {
      return;
    }
    var params = url.substring(index + 1);
    params = params.split('&');
    for (var i = 0; i < params.length; i++) {
      var parameter = params[i].split('=');
        if (parameter[0] === param) {
          return parameter[1].split('#')[0];
        }
    }
    return;
  }
});
