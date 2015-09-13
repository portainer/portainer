describe('startContainerController', function () {
    var scope, $location, createController, mockContainer, $httpBackend;

    beforeEach(angular.mock.module('dockerui'));

    beforeEach(inject(function ($rootScope, $controller, _$location_) {
        $location = _$location_;
        scope = $rootScope.$new();

        createController = function () {
            return $controller('StartContainerController', {
                '$scope': scope
            });
        };

        angular.mock.inject(function (_Container_, _$httpBackend_) {
            mockContainer = _Container_;
            $httpBackend = _$httpBackend_;
        });
    }));
    function expectGetContainers() {
        $httpBackend.expectGET('dockerapi/containers/json?all=1').respond([{
            'Command': './dockerui -e /docker.sock',
            'Created': 1421817232,
            'Id': 'b17882378cee8ec0136f482681b764cca430befd52a9bfd1bde031f49b8bba9f',
            'Image': 'dockerui:latest',
            'Names': ['/dockerui'],
            'Ports': [{
                'IP': '0.0.0.0',
                'PrivatePort': 9000,
                'PublicPort': 9000,
                'Type': 'tcp'
            }],
            'Status': 'Up 2 minutes'
        }]);
    }

    describe('Create and start a container with port bindings', function () {
        it('should issue a correct create request to the Docker remote API', function () {
            var controller = createController();
            var id = '6abd8bfba81cf8a05a76a4bdefcb36c4b66cd02265f4bfcd0e236468696ebc6c';
            var expectedBody = {
                'name': 'container-name',
                'ExposedPorts': {
                    '9000/tcp': {}
                },
                'HostConfig': {
                    'PortBindings': {
                        '9000/tcp': [{
                            'HostPort': '9999',
                            'HostIp': '10.20.10.15'
                        }]
                    }
                }
            };

            expectGetContainers();

            $httpBackend.expectPOST('dockerapi/containers/create?name=container-name', expectedBody).respond({
                'Id': id,
                'Warnings': null
            });
            $httpBackend.expectPOST('dockerapi/containers/' + id + '/start').respond({
                'id': id,
                'Warnings': null
            });

            scope.config.name = 'container-name';
            scope.config.HostConfig.PortBindings = [{
                ip: '10.20.10.15',
                extPort: '9999',
                intPort: '9000'
            }];

            scope.create();
            $httpBackend.flush();
        });
    });

    describe('Create and start a container with environment variables', function () {
        it('should issue a correct create request to the Docker remote API', function () {
            var controller = createController();
            var id = '6abd8bfba81cf8a05a76a4bdefcb36c4b66cd02265f4bfcd0e236468696ebc6c';
            var expectedBody = {
                'name': 'container-name',
                'Env': ['SHELL=/bin/bash', 'TERM=xterm-256color']
            };

            expectGetContainers();

            $httpBackend.expectPOST('dockerapi/containers/create?name=container-name', expectedBody).respond({
                'Id': id,
                'Warnings': null
            });
            $httpBackend.expectPOST('dockerapi/containers/' + id + '/start').respond({
                'id': id,
                'Warnings': null
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

    describe('Create and start a container with volumesFrom', function () {
        it('should issue a correct create request to the Docker remote API', function () {
            var controller = createController();
            var id = '6abd8bfba81cf8a05a76a4bdefcb36c4b66cd02265f4bfcd0e236468696ebc6c';
            var expectedBody = {
                HostConfig: {
                    'VolumesFrom': ['parent', 'other:ro']
                },
                'name': 'container-name'
            };

            expectGetContainers();

            $httpBackend.expectPOST('dockerapi/containers/create?name=container-name', expectedBody).respond({
                'Id': id,
                'Warnings': null
            });
            $httpBackend.expectPOST('dockerapi/containers/' + id + '/start').respond({
                'id': id,
                'Warnings': null
            });

            scope.config.name = 'container-name';
            scope.config.HostConfig.VolumesFrom = [{name: 'parent'}, {name: 'other:ro'}];

            scope.create();
            $httpBackend.flush();
        });
    });

    describe('Create and start a container with multiple options', function () {
        it('should issue a correct create request to the Docker remote API', function () {
            var controller = createController();
            var id = '6abd8bfba81cf8a05a76a4bdefcb36c4b66cd02265f4bfcd0e236468696ebc6c';
            var expectedBody = {
                Volumes: ['/var/www'],
                SecurityOpts: ['label:type:svirt_apache'],
                HostConfig: {
                    Binds: ['/app:/app'],
                    Links: ['web:db'],
                    Dns: ['8.8.8.8'],
                    DnsSearch: ['example.com'],
                    CapAdd: ['cap_sys_admin'],
                    CapDrop: ['cap_foo_bar'],
                    Devices: [{
                        'PathOnHost': '/dev/deviceName',
                        'PathInContainer': '/dev/deviceName',
                        'CgroupPermissions': 'mrw'
                    }],
                    LxcConf: {'lxc.utsname': 'docker'},
                    ExtraHosts: ['hostname:127.0.0.1'],
                    RestartPolicy: {name: 'always', MaximumRetryCount: 5}
                },
                name: 'container-name'
            };

            expectGetContainers();

            $httpBackend.expectPOST('dockerapi/containers/create?name=container-name', expectedBody).respond({
                'Id': id,
                'Warnings': null
            });
            $httpBackend.expectPOST('dockerapi/containers/' + id + '/start').respond({
                'id': id,
                'Warnings': null
            });

            scope.config.name = 'container-name';
            scope.config.Volumes = [{name: '/var/www'}];
            scope.config.SecurityOpts = [{name: 'label:type:svirt_apache'}];
            scope.config.NetworkDisabled = true;
            scope.config.Tty = true;
            scope.config.OpenStdin = true;
            scope.config.StdinOnce = true;

            scope.config.HostConfig.Binds = [{name: '/app:/app'}];
            scope.config.HostConfig.Links = [{name: 'web:db'}];
            scope.config.HostConfig.Dns = [{name: '8.8.8.8'}];
            scope.config.HostConfig.DnsSearch = [{name: 'example.com'}];
            scope.config.HostConfig.CapAdd = [{name: 'cap_sys_admin'}];
            scope.config.HostConfig.CapDrop = [{name: 'cap_foo_bar'}];
            scope.config.HostConfig.PublishAllPorts = true;
            scope.config.HostConfig.Privileged = true;
            scope.config.HostConfig.RestartPolicy = {name: 'always', MaximumRetryCount: 5};
            scope.config.HostConfig.Devices = [{
                'PathOnHost': '/dev/deviceName',
                'PathInContainer': '/dev/deviceName',
                'CgroupPermissions': 'mrw'
            }];
            scope.config.HostConfig.LxcConf = [{name: 'lxc.utsname', value: 'docker'}];
            scope.config.HostConfig.ExtraHosts = [{host: 'hostname', ip: '127.0.0.1'}];

            scope.create();
            $httpBackend.flush();
        });
    });
});