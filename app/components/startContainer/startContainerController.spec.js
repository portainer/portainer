describe('startContainerController', function () {
    var scope, $location, createController, mockContainer, $httpBackend;
    
    beforeEach(angular.mock.module('dockerui'));

    beforeEach(inject(function ($rootScope, $controller, _$location_) {
        $location = _$location_;
        scope = $rootScope.$new();

        createController = function() {
            return $controller('StartContainerController', {
                '$scope': scope
            });
        };

        angular.mock.inject(function (_Container_, _$httpBackend_) {
            mockContainer = _Container_;
            $httpBackend = _$httpBackend_;
        });
    }));

    describe('Create and start a container with port bindings', function () {
        it('should issue a correct create request to the Docker remote API', function() {
            var controller = createController();
            var id = '6abd8bfba81cf8a05a76a4bdefcb36c4b66cd02265f4bfcd0e236468696ebc6c';
            var expectedBody = {
                "name": "container-name",
                "Memory": 0,
                "MemorySwap": 0,
                "CpuShares": 1024,
                "Cmd": null,
                "VolumesFrom": "",
                "Env": [],
                "ExposedPorts":{
                    "9000/tcp": {},
                },
                "HostConfig": {
                    "PortBindings":{
                        "9000/tcp": [{
                            "HostPort": "9999",
                            "HostIp": "10.20.10.15",
                        }]
                    },
                }};
            $httpBackend.expectPOST('/dockerapi/containers/create?name=container-name', expectedBody).respond({
                "Id": id,
                "Warnings": null
            });
            $httpBackend.expectPOST('/dockerapi/containers/' + id + '/start?').respond({
                "Id": id,
                "Warnings": null
            });

            scope.config.name = 'container-name';
            scope.config.portBindings = [{ip: '10.20.10.15', extPort: '9999', intPort: '9000'}]

            scope.create();
            $httpBackend.flush();
        });
    });

    describe('Create and start a container with environment variables', function () {
        it('should issue a correct create request to the Docker remote API', function() {
            var controller = createController();
            var id = '6abd8bfba81cf8a05a76a4bdefcb36c4b66cd02265f4bfcd0e236468696ebc6c';
            var expectedBody = {
                "name": "container-name",
                "Memory": 0,
                "MemorySwap": 0,
                "CpuShares": 1024,
                "Cmd": null,
                "VolumesFrom": "",
                "Env":["SHELL=/bin/bash", "TERM=xterm-256color"],
                "ExposedPorts":{},
                "HostConfig": {"PortBindings":{}}
            };
            $httpBackend.expectPOST('/dockerapi/containers/create?name=container-name', expectedBody).respond({
                "Id": id,
                "Warnings": null
            });
            $httpBackend.expectPOST('/dockerapi/containers/' + id + '/start?').respond({
                "Id": id,
                "Warnings": null
            });

            scope.config.name = 'container-name';
            scope.config.env = [{name: 'SHELL', value: '/bin/bash'}, {name: 'TERM', value: 'xterm-256color'}];

            scope.create();
            $httpBackend.flush();
        });
    });
});
