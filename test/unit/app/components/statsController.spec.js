describe('StatsController', function () {
  var $scope, $httpBackend, $routeParams;

  beforeEach(angular.mock.module('portainer'));

  beforeEach(inject(function (_$rootScope_, _$httpBackend_, $controller, _$routeParams_) {
    $scope = _$rootScope_.$new();
    $httpBackend = _$httpBackend_;
    $routeParams = _$routeParams_;
    $routeParams.id = 'b17882378cee8ec0136f482681b764cca430befd52a9bfd1bde031f49b8bba9f';
    $controller('StatsController', {
      $scope: $scope,
      $routeParams: $routeParams,
    });
  }));

  //it("should test controller initialize", function () {
  //    $httpBackend.expectGET('dockerapi/containers/b17882378cee8ec0136f482681b764cca430befd52a9bfd1bde031f49b8bba9f/stats?stream=false').respond(200);
  //    //expect($scope.ps_args).toBeDefined();
  //    $httpBackend.flush();
  //});
  //
  //it("a correct top request to the Docker remote API", function () {
  //    //$httpBackend.expectGET('dockerapi/containers/' + $routeParams.id + '/top?ps_args=').respond(200);
  //    //$routeParams.id = '123456789123456789123456789';
  //    //$scope.ps_args = 'aux';
  //    //$httpBackend.expectGET('dockerapi/containers/' + $routeParams.id + '/top?ps_args=' + $scope.ps_args).respond(200);
  //    //$scope.getTop();
  //    //$httpBackend.flush();
  //});
});
