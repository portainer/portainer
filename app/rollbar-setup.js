angular.module('portainer').config([
  'RollbarProvider',
  function (RollbarProvider) {
    RollbarProvider.init({
      accessToken: '4386f49642494acfa027a42a4d4a7245',
      captureUncaught: true,
      payload: {
        environment: 'test',
      },
    });
  },
]);
