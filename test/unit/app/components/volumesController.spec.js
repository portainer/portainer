describe('VolumesController', function () {
  var $scope, $httpBackend, $routeParams;

  beforeEach(module('portainer'));
  beforeEach(inject(function (_$httpBackend_, $controller, _$routeParams_) {
    $scope = {};
    $httpBackend = _$httpBackend_;
    $routeParams = _$routeParams_;
    $controller('VolumesController', {
      $scope: $scope,
      $routeParams: $routeParams,
    });
  }));

  it('initializes correctly', function () {
    expectGetVolumes();
    $httpBackend.flush();
  });

  it('issues correct remove calls to the remote API', function () {
    expectGetVolumes();
    $httpBackend.flush();
    $scope.volumes[0].Checked = true;
    $scope.volumes[2].Checked = true;
    $httpBackend.expectDELETE('dockerapi/volumes/tardis').respond(200);
    $httpBackend.expectDELETE('dockerapi/volumes/bar').respond(200);
    $scope.removeAction();
    $httpBackend.flush();
  });
  it('issues a correct volume creation call to the remote API', function () {
    expectGetVolumes();
    var createBody = {
      Name: 'tardis',
      Driver: 'local',
    };
    $httpBackend.expectPOST('dockerapi/volumes/create', createBody).respond(201);
    expectGetVolumes();
    $scope.addVolume(createBody);
    $httpBackend.flush();
  });

  function expectGetVolumes() {
    $httpBackend.expectGET('dockerapi/volumes').respond({
      Volumes: [
        {
          Name: 'tardis',
          Driver: 'local',
          Mountpoint: '/var/lib/docker/volumes/tardis',
        },
        {
          Name: 'foo',
          Driver: 'local',
          Mountpoint: '/var/lib/docker/volumes/foo',
        },
        {
          Name: 'bar',
          Driver: 'local',
          Mountpoint: '/var/lib/docker/volumes/bar',
        },
      ],
    });
  }
});
