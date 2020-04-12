describe('NetworkController', function () {
  var $scope, $httpBackend, $routeParams;

  beforeEach(module('portainer'));
  beforeEach(inject(function (_$httpBackend_, $controller, _$routeParams_) {
    $scope = {};
    $httpBackend = _$httpBackend_;
    $routeParams = _$routeParams_;
    $routeParams.id = 'f1e1ce1613ccd374a75caf5e2c3ab35520d1944f91498c1974ec86fb4019c79b';
    $controller('NetworkController', {
      $scope: $scope,
      $routeParams: $routeParams,
    });
  }));

  it('initializes correctly', function () {
    expectGetNetwork();
    $httpBackend.flush();
  });

  it('issues a correct connect call to the remote API', function () {
    expectGetNetwork();
    $httpBackend.expectPOST('dockerapi/networks/f1e1ce1613ccd374a75caf5e2c3ab35520d1944f91498c1974ec86fb4019c79b/connect', { Container: 'containerId' }).respond(200);
    $scope.connect($routeParams.id, 'containerId');
    $httpBackend.flush();
  });
  it('issues a correct disconnect call to the remote API', function () {
    expectGetNetwork();
    $httpBackend.expectPOST('dockerapi/networks/f1e1ce1613ccd374a75caf5e2c3ab35520d1944f91498c1974ec86fb4019c79b/disconnect', { Container: 'containerId' }).respond(200);
    $scope.disconnect($routeParams.id, 'containerId');
    $httpBackend.flush();
  });
  it('issues a correct remove call to the remote API', function () {
    expectGetNetwork();
    $httpBackend.expectDELETE('dockerapi/networks/f1e1ce1613ccd374a75caf5e2c3ab35520d1944f91498c1974ec86fb4019c79b').respond(204);
    $scope.remove($routeParams.id);
    $httpBackend.flush();
  });

  function expectGetNetwork() {
    $httpBackend.expectGET('dockerapi/networks/f1e1ce1613ccd374a75caf5e2c3ab35520d1944f91498c1974ec86fb4019c79b').respond({
      Name: 'bridge',
      Id: 'f1e1ce1613ccd374a75caf5e2c3ab35520d1944f91498c1974ec86fb4019c79b',
      Scope: 'local',
      Driver: 'bridge',
      IPAM: {
        Driver: 'default',
        Config: [
          {
            Subnet: '172.17.0.1/16',
            Gateway: '172.17.0.1',
          },
        ],
      },
      Containers: {
        '727fe76cd0bd65033baab3045508784a166fbc67d177e91c1874b6b29eae946a': {
          EndpointID: 'c17ec80e2cfc8eaedc7737b7bb6f954adff439767197ef89c4a5b4127d07b267',
          MacAddress: '02:42:ac:11:00:03',
          IPv4Address: '172.17.0.3/16',
          IPv6Address: '',
        },
        '8c32c2446c3dfe0defac2dc8b5fd927cd394f15e08051c677a681bf36877175b': {
          EndpointID: 'cf7e795c978ab194d1af4a3efdc177d84c075582ba30a7cff414c7d516236af1',
          MacAddress: '02:42:ac:11:00:04',
          IPv4Address: '172.17.0.4/16',
          IPv6Address: '',
        },
        cfe81fc97b1f857fdb3061fe487a064b8b57d8f112910954ac16910400d2e058: {
          EndpointID: '611929ffcff2ced1db8e88f77e009c4fb4a4736395251cd97553b242e2e23bf1',
          MacAddress: '02:42:ac:11:00:02',
          IPv4Address: '172.17.0.2/16',
          IPv6Address: '',
        },
      },
      Options: {
        'com.docker.network.bridge.default_bridge': 'true',
        'com.docker.network.bridge.enable_icc': 'true',
        'com.docker.network.bridge.enable_ip_masquerade': 'true',
        'com.docker.network.bridge.host_binding_ipv4': '0.0.0.0',
        'com.docker.network.bridge.name': 'docker0',
        'com.docker.network.driver.mtu': '1500',
      },
    });
  }
});
