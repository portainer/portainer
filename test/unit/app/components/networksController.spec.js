describe('NetworksController', function () {
  var $scope, $httpBackend, $routeParams;

  beforeEach(module('portainer'));
  beforeEach(inject(function (_$httpBackend_, $controller, _$routeParams_) {
    $scope = {};
    $httpBackend = _$httpBackend_;
    $routeParams = _$routeParams_;
    $controller('NetworksController', {
      $scope: $scope,
      $routeParams: $routeParams,
    });
  }));

  it('initializes correctly', function () {
    expectGetNetwork();
    $httpBackend.flush();
  });

  it('issues correct remove calls to the remote API', function () {
    expectGetNetwork();
    $httpBackend.flush();
    $scope.networks[0].Checked = true;
    $scope.networks[2].Checked = true;
    $httpBackend.expectDELETE('dockerapi/networks/f2de39df4171b0dc801e8002d1d999b77256983dfc63041c0f34030aa3977566').respond(204);
    $httpBackend.expectDELETE('dockerapi/networks/13e871235c677f196c4e1ecebb9dc733b9b2d2ab589e30c539efeda84a24215e').respond(204);
    $scope.removeAction();
    $httpBackend.flush();
  });
  it('issues a correct network creation call to the remote API', function () {
    expectGetNetwork();
    var createBody = {
      Name: 'isolated_nw',
      Driver: 'bridge',
      IPAM: {
        Config: [
          {
            Subnet: '172.20.0.0/16',
            IPRange: '172.20.10.0/24',
            Gateway: '172.20.10.11',
          },
        ],
      },
    };
    $httpBackend.expectPOST('dockerapi/networks/create', createBody).respond(201);
    expectGetNetwork();
    $scope.addNetwork(createBody);
    $httpBackend.flush();
  });

  function expectGetNetwork() {
    $httpBackend.expectGET('dockerapi/networks').respond([
      {
        Name: 'bridge',
        Id: 'f2de39df4171b0dc801e8002d1d999b77256983dfc63041c0f34030aa3977566',
        Scope: 'local',
        Driver: 'bridge',
        IPAM: {
          Driver: 'default',
          Config: [
            {
              Subnet: '172.17.0.0/16',
            },
          ],
        },
        Containers: {
          '39b69226f9d79f5634485fb236a23b2fe4e96a0a94128390a7fbbcc167065867': {
            EndpointID: 'ed2419a97c1d9954d05b46e462e7002ea552f216e9b136b80a7db8d98b442eda',
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
      },
      {
        Name: 'none',
        Id: 'e086a3893b05ab69242d3c44e49483a3bbbd3a26b46baa8f61ab797c1088d794',
        Scope: 'local',
        Driver: 'null',
        IPAM: {
          Driver: 'default',
          Config: [],
        },
        Containers: {},
        Options: {},
      },
      {
        Name: 'host',
        Id: '13e871235c677f196c4e1ecebb9dc733b9b2d2ab589e30c539efeda84a24215e',
        Scope: 'local',
        Driver: 'host',
        IPAM: {
          Driver: 'default',
          Config: [],
        },
        Containers: {},
        Options: {},
      },
    ]);
  }
});
