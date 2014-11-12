function newLineChart(id, data, getkey) {
    var chart = getChart(id);
    var map = {};

    for (var i = 0; i < data.length; i++) {
        var c = data[i];
        var key = getkey(c);
        
        var count = map[key];
        if (count === undefined) {
            count = 0;
        }
        count += 1;
        map[key] = count;
    }

    var labels = [];
    var data = [];
    var keys = Object.keys(map);

    for (var i = keys.length - 1; i > -1; i--) {
        var k = keys[i];
        labels.push(k);
        data.push(map[k]);
    }
    var dataset = {
        fillColor : "rgba(151,187,205,0.5)",
        strokeColor : "rgba(151,187,205,1)",
        pointColor : "rgba(151,187,205,1)",
        pointStrokeColor : "#fff",
        data : data
    };
    chart.Line({
        labels: labels,
        datasets: [dataset]
    }, 
    {
        scaleStepWidth: 1, 
        pointDotRadius:1,
        scaleOverride: true,
        scaleSteps: labels.length
    });
}

function getChart(id) {
    var ctx = $(id).get(0).getContext("2d");
    return new Chart(ctx);
}

function SideBarController($scope, Container, Settings) {
    $scope.template = 'partials/sidebar.html';
    $scope.containers = [];
    $scope.endpoint = Settings.endpoint;

    Container.query({all: 0}, function(d) {
        $scope.containers = d;
    });
}

function SettingsController($scope, System, Docker, Settings, Messages) {
    $scope.info = {};
    $scope.docker = {};
    $scope.endpoint = Settings.endpoint;
    $scope.apiVersion = Settings.version;

    Docker.get({}, function(d) { $scope.docker = d; });
    System.get({}, function(d) { $scope.info = d; });
}

// Controls the page that displays a single container and actions on that container.
function ContainerController($scope, $routeParams, $location, Container, Messages, ViewSpinner) {
    $scope.changes = [];

    var update = function() {
        Container.get({id: $routeParams.id}, function(d) {
            $scope.container = d;
            ViewSpinner.stop();
        }, function(e) {
            if (e.status === 404) {
                $('.detail').hide();
                Messages.error("Not found", "Container not found.");
            } else {
                Messages.error("Failure", e.data);
            }
            ViewSpinner.stop();
        });
    };

    $scope.start = function(){
        ViewSpinner.spin();
        Container.start({
                id: $scope.container.Id,
                HostConfig: $scope.container.HostConfig
            }, function(d) {
            update();
            Messages.send("Container started", $routeParams.id);
        }, function(e) {
            update();
            Messages.error("Failure", "Container failed to start." + e.data);
        });
    };

    $scope.stop = function() {
        ViewSpinner.spin();
        Container.stop({id: $routeParams.id}, function(d) {
            update();
            Messages.send("Container stopped", $routeParams.id);
        }, function(e) {
            update();
            Messages.error("Failure", "Container failed to stop." + e.data);
        });
    };

    $scope.kill = function() {
        ViewSpinner.spin();
        Container.kill({id: $routeParams.id}, function(d) {
            update();
            Messages.send("Container killed", $routeParams.id);
        }, function(e) {
            update();
            Messages.error("Failure", "Container failed to die." + e.data);
        });
    };

    $scope.pause = function() {
        ViewSpinner.spin();
        Container.pause({id: $routeParams.id}, function(d) {
            update();
            Messages.send("Container paused", $routeParams.id);
        }, function(e) {
            update();
            Messages.error("Failure", "Container failed to pause." + e.data);
        });
    };

    $scope.unpause = function() {
        ViewSpinner.spin();
        Container.unpause({id: $routeParams.id}, function(d) {
            update();
            Messages.send("Container unpaused", $routeParams.id);
        }, function(e) {
            update();
            Messages.error("Failure", "Container failed to unpause." + e.data);
        });
    };

    $scope.remove = function() {
        ViewSpinner.spin();
        Container.remove({id: $routeParams.id}, function(d) {
            update();
            Messages.send("Container removed", $routeParams.id);
        }, function(e){
            update();
            Messages.error("Failure", "Container failed to remove." + e.data);
        });
    };

    $scope.hasContent = function(data) {
        return data !== null && data !== undefined;
    };

    $scope.getChanges = function() {
        ViewSpinner.spin();
        Container.changes({id: $routeParams.id}, function(d) {
            $scope.changes = d;
            ViewSpinner.stop();
        });
    };

    update();
    $scope.getChanges();
}

// Controller for the list of containers
function ContainersController($scope, Container, Settings, Messages, ViewSpinner) {
    $scope.predicate = '-Created';
    $scope.toggle = false;
    $scope.displayAll = Settings.displayAll;

    var update = function(data) {
        ViewSpinner.spin();
        Container.query(data, function(d) {
            $scope.containers = d.map(function(item) {
                return new ContainerViewModel(item); });
            ViewSpinner.stop();
        });
    };

    var batch = function(items, action, msg) {
        ViewSpinner.spin();
        var counter = 0;
        var complete = function() {
            counter = counter -1;
            if (counter === 0) {
                ViewSpinner.stop();
                update({all: Settings.displayAll ? 1 : 0});
            }
        };
        angular.forEach(items, function(c) {
            if (c.Checked) {
                counter = counter + 1;
                action({id: c.Id}, function(d) {
                    Messages.send("Container " + msg, c.Id);
                    var index = $scope.containers.indexOf(c);
                    complete();
                }, function(e) {
                    Messages.error("Failure", e.data);
                    complete();
                });
            }
        });
        if (counter === 0) {
            ViewSpinner.stop();
        }
    };

    $scope.toggleSelectAll = function() {
        angular.forEach($scope.containers, function(i) {
            i.Checked = $scope.toggle;
        });
    };

    $scope.toggleGetAll = function() {
        Settings.displayAll = $scope.displayAll;
        update({all: Settings.displayAll ? 1 : 0});
    };

    $scope.startAction = function() {
        batch($scope.containers, Container.start, "Started");
    };

    $scope.stopAction = function() {
        batch($scope.containers, Container.stop, "Stopped");
    };

    $scope.killAction = function() {
        batch($scope.containers, Container.kill, "Killed");
    };

    $scope.pauseAction = function() {
        batch($scope.containers, Container.pause, "Paused");
    };

    $scope.unpauseAction = function() {
        batch($scope.containers, Container.unpause, "Unpaused");
    };

    $scope.removeAction = function() {
        batch($scope.containers, Container.remove, "Removed");
    };

    update({all: Settings.displayAll ? 1 : 0});
}

// Controller for the list of images
function ImagesController($scope, Image, ViewSpinner, Messages) {
    $scope.toggle = false;
    $scope.predicate = '-Created';

    $scope.showBuilder = function() {
        $('#build-modal').modal('show');
    };

    $scope.removeAction = function() {
        ViewSpinner.spin();
        var counter = 0;
        var complete = function() {
           counter = counter - 1;
           if (counter === 0) {
                ViewSpinner.stop();
           }
        };
        angular.forEach($scope.images, function(i) {
            if (i.Checked) {
                counter = counter + 1;
                Image.remove({id: i.Id}, function(d) {
                   angular.forEach(d, function(resource) {
                       Messages.send("Image deleted", resource.Deleted);
                   });
                   var index = $scope.images.indexOf(i);
                   $scope.images.splice(index, 1);
                   complete();
                }, function(e) {
                   Messages.error("Failure", e.data);
                   complete();
                });
            }
        });
    };

    $scope.toggleSelectAll = function() {
        angular.forEach($scope.images, function(i) {
            i.Checked = $scope.toggle;
        });
    };

    ViewSpinner.spin();
    Image.query({}, function(d) {
        $scope.images = d.map(function(item) { return new ImageViewModel(item); });
        ViewSpinner.stop();
    }, function (e) {
        Messages.error("Failure", e.data);
        ViewSpinner.stop();
    });
}

// Controller for a single image and actions on that image
function ImageController($scope, $q, $routeParams, $location, Image, Container, Messages) {
    $scope.history = [];
    $scope.tag = {repo: '', force: false};

    $scope.remove = function() {
        Image.remove({id: $routeParams.id}, function(d) {
            Messages.send("Image Removed", $routeParams.id);
        }, function(e) {
            $scope.error = e.data;
            $('#error-message').show();
        });
    };

    $scope.getHistory = function() {
        Image.history({id: $routeParams.id}, function(d) {
            $scope.history = d;
        });
    };

    $scope.updateTag = function() {
        var tag = $scope.tag;
        Image.tag({id: $routeParams.id, repo: tag.repo, force: tag.force ? 1 : 0}, function(d) {
            Messages.send("Tag Added", $routeParams.id);
        }, function(e) {
            $scope.error = e.data;
            $('#error-message').show();
        });
    };

    Image.get({id: $routeParams.id}, function(d) {
        $scope.image = d;
        $scope.tag = d.id;
        var t = $routeParams.tag;
        if (t && t !== ":") {
            $scope.tag = t;
            var promise = getContainersFromImage($q, Container, t);

            promise.then(function(containers) {
                newLineChart('#containers-started-chart', containers, function(c) { return new Date(c.Created * 1000).toLocaleDateString(); });
            });
        }
    }, function(e) {
        if (e.status === 404) {
            $('.detail').hide();
            $scope.error = "Image not found.<br />" + $routeParams.id;
        } else {
            $scope.error = e.data;
        }
        $('#error-message').show();
    });

    $scope.getHistory();
}

function StartContainerController($scope, $routeParams, $location, Container, Messages) {
    $scope.template = 'partials/startcontainer.html';
    $scope.config = {
        name: '',
        memory: 0,
        memorySwap: 0,
        cpuShares: 1024,
        env: '',
        commands: '',
        volumesFrom: ''
    };
    $scope.commandPlaceholder = '["/bin/echo", "Hello world"]';

    $scope.create = function() {
        var cmds = null;
        if ($scope.config.commands !== '') {
            cmds = angular.fromJson($scope.config.commands);
        }
        var id = $routeParams.id;
        var ctor = Container;
        var loc = $location;
        var s = $scope;

        Container.create({
                Image: id,
                name: $scope.config.name,
                Memory: $scope.config.memory,
                MemorySwap: $scope.config.memorySwap,
                CpuShares: $scope.config.cpuShares,
                Cmd: cmds,
                VolumesFrom: $scope.config.volumesFrom
            }, function(d) {
                if (d.Id) {
                    ctor.start({id: d.Id}, function(cd) {
                        $('#create-modal').modal('hide');
                        loc.path('/containers/' + d.Id + '/');
                    }, function(e) {
                        failedRequestHandler(e, Messages);
                    });
                }
            }, function(e) {
                failedRequestHandler(e, Messages);
        });
    };
}

function BuilderController($scope, Dockerfile, Messages) {
    $scope.template = 'partials/builder.html';
}

function failedRequestHandler(e, Messages) {
    Messages.send({class: 'text-error', data: e.data});
}

// This gonna get messy but we don't have a good way to do this right now
function getContainersFromImage($q, Container, tag) {
    var defer = $q.defer();
    
    Container.query({all:1, notruc:1}, function(d) {
        var containers = [];
        for (var i = 0; i < d.length; i++) {
            var c = d[i];
            if (c.Image == tag) {
                containers.push(new ContainerViewModel(c));
            }
        }
        defer.resolve(containers);
    });

    return defer.promise;
}
