describe('startContainerController', function() {
    var scope, $location, createController, mockContainer, $httpBackend;

    beforeEach(angular.mock.module('dockerui'));

    beforeEach(inject(function($rootScope, $controller, _$location_) {
        $location = _$location_;
        scope = $rootScope.$new();

        createController = function() {
            return $controller('StartContainerController', {
                '$scope': scope
            });
        };

        angular.mock.inject(function(_Container_, _$httpBackend_) {
            mockContainer = _Container_;
            $httpBackend = _$httpBackend_;
        });
    }));
    function expectGetContainers() {
        $httpBackend.expectGET('dockerapi/containers/json?all=1').respond([{
            "Command": "./dockerui -e /docker.sock",
            "Created": 1421817232,
            "Id": "b17882378cee8ec0136f482681b764cca430befd52a9bfd1bde031f49b8bba9f",
            "Image": "dockerui:latest",
            "Names": ["/dockerui"],
            "Ports": [{
                "IP": "0.0.0.0",
                "PrivatePort": 9000,
                "PublicPort": 9000,
                "Type": "tcp"
            }],
            "Status": "Up 2 minutes"
        }]);
    }
    describe('Create and start a container with port bindings', function() {
        it('should issue a correct create request to the Docker remote API', function() {
            var controller = createController();
            var id = '6abd8bfba81cf8a05a76a4bdefcb36c4b66cd02265f4bfcd0e236468696ebc6c';
            var expectedBody = {
                "name": "container-name",
                "ExposedPorts": {
                    "9000/tcp": {},
                },
                "HostConfig": {
                    "PortBindings": {
                        "9000/tcp": [{
                            "HostPort": "9999",
                            "HostIp": "10.20.10.15",
                        }]
                    },
                }
            };

            expectGetContainers();

            $httpBackend.expectPOST('dockerapi/containers/create?name=container-name', expectedBody).respond({
                "Id": id,
                "Warnings": null
            });
            $httpBackend.expectPOST('dockerapi/containers/' + id + '/start?').respond({
                "Id": id,
                "Warnings": null
            });

            scope.config.name = 'container-name';
            scope.config.PortBindings = [{
                ip: '10.20.10.15',
                extPort: '9999',
                intPort: '9000'
            }]

            scope.create();
            $httpBackend.flush();
        });
    });

    describe('Create and start a container with environment variables', function() {
        it('should issue a correct create request to the Docker remote API', function() {
            var controller = createController();
            var id = '6abd8bfba81cf8a05a76a4bdefcb36c4b66cd02265f4bfcd0e236468696ebc6c';
            var expectedBody = {
                "name": "container-name",
                "Env": ["SHELL=/bin/bash", "TERM=xterm-256color"]
            };

            expectGetContainers();

            $httpBackend.expectPOST('dockerapi/containers/create?name=container-name', expectedBody).respond({
                "Id": id,
                "Warnings": null
            });
            $httpBackend.expectPOST('dockerapi/containers/' + id + '/start?').respond({
                "Id": id,
                "Warnings": null
            });

            scope.config.name = 'container-name';
            scope.config.Env = [{
                name: 'SHELL',
                value: '/bin/bash'
            }, {
                name: 'TERM',
                value: 'xterm-256color'
            }];

            scope.create();
            $httpBackend.flush();
        });
    });

    describe('Create and start a container with volumesFrom', function() {
        it('should issue a correct create request to the Docker remote API', function() {
            var controller = createController();
            var id = '6abd8bfba81cf8a05a76a4bdefcb36c4b66cd02265f4bfcd0e236468696ebc6c';
            var expectedBody = {
                HostConfig: {
                    "VolumesFrom": ["parent", "other:ro"]
                },
                "name": "container-name"
            };

            expectGetContainers();


            $httpBackend.expectPOST('dockerapi/containers/create?name=container-name', expectedBody).respond({
                "Id": id,
                "Warnings": null
            });
            $httpBackend.expectPOST('dockerapi/containers/' + id + '/start?').respond({
                "Id": id,
                "Warnings": null
            });

            scope.config.name = 'container-name';
            scope.config.HostConfig.VolumesFrom = [{name: "parent"}, {name:"other:ro"}];

            scope.create();
            $httpBackend.flush();
        });
    });
});