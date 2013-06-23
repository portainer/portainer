
function MastheadController($scope) {
    $scope.template = 'partials/masthead.html';
}

function DashboardController($scope, Container) {
}

function MessageController($scope, Messages) {
    $scope.template = 'partials/messages.html';
    $scope.messages = [];
    $scope.$watch('messages.length', function(o, n) {
       $('#message-display').show();
    });

    $scope.$on(Messages.event, function(e, msg) {
       $scope.messages.push(msg);
       setTimeout(function() {
           $('#message-display').hide('slow');
       }, 30000);
    });
}

function StatusBarController($scope, Settings) {
    $scope.template = 'partials/statusbar.html';

    $scope.uiVersion = Settings.uiVersion;
    $scope.apiVersion = Settings.version;
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

    $scope.start = function(){
        ViewSpinner.spin();
        Container.start({id: $routeParams.id}, function(d) {
            Messages.send({class: 'text-success', data: 'Container started.'});
            ViewSpinner.stop();
        }, function(e) {
            failedRequestHandler(e, Messages);
            ViewSpinner.stop();
        });
    };

    $scope.stop = function() {
        ViewSpinner.spin();
        Container.stop({id: $routeParams.id}, function(d) {
            Messages.send({class: 'text-success', data: 'Container stopped.'});
            ViewSpinner.stop();
        }, function(e) {
            failedRequestHandler(e, Messages);
            ViewSpinner.stop();
        });
    };

    $scope.kill = function() {
        ViewSpinner.spin();
        Container.kill({id: $routeParams.id}, function(d) {
            Messages.send({class: 'text-success', data: 'Container killed.'});
            ViewSpinner.stop();
        }, function(e) {
            failedRequestHandler(e, Messages);
            ViewSpinner.stop();
        });
    };

    $scope.remove = function() {
        ViewSpinner.spin();
        Container.remove({id: $routeParams.id}, function(d) {
            Messages.send({class: 'text-success', data: 'Container removed.'});
            ViewSpinner.stop();
        }, function(e){
            failedRequestHandler(e, Messages);
            ViewSpinner.stop();
        });
    };

    $scope.hasContent = function(data) {
        return data !== null && data !== undefined && data.length > 1;
    };

    $scope.getChanges = function() {
        Container.changes({id: $routeParams.id}, function(d) {
            $scope.changes = d;
        });
    };

    Container.get({id: $routeParams.id}, function(d) {
        $scope.container = d;
   }, function(e) {
        failedRequestHandler(e, Messages);
        if (e.status === 404) {
            $('.detail').hide();
        }
   });

   $scope.getChanges();
}

// Controller for the list of containers
function ContainersController($scope, Container, Settings, Messages, ViewSpinner) {
    $scope.displayAll = Settings.displayAll;
    $scope.predicate = '-Created';
    $scope.toggle = false;

    var update = function(data) {
        ViewSpinner.spin();
        Container.query(data, function(d) {
            $scope.containers = d.map(function(item) { return new ContainerViewModel(item); });
            ViewSpinner.stop();
        });
    };

    var batch = function(items, action) {
        ViewSpinner.spin();
        var counter = 0;
        var complete = function() {
            counter = counter -1;
            if (counter === 0) {
                ViewSpinner.stop();
            }
        };
         angular.forEach(items, function(c) {
           if (c.Checked) {
               counter = counter + 1;
               action({id: c.Id}, function(d) {
                    Messages.send({class: 'text-success', data: 'Container ' + c.Id + ' Removed.'});
                    var index = $scope.containers.indexOf(c);
                    $scope.containers.splice(index, 1);
                    complete();
               }, function(e) {
                  failedRequestHandler(e, Messages);
                  complete();
               });
           }
        });
    };

    $scope.toggleSelectAll = function() {
        angular.forEach($scope.containers, function(i) {
            i.Checked = $scope.toggle;
        });
    };

    $scope.toggleGetAll = function() {
        Settings.displayAll = $scope.displayAll;
        var data = {all: 0};

        if ($scope.displayAll) {
            data.all = 1;
        }
        update(data);
    };

    $scope.startAction = function() {
        batch($scope.containers, Container.start);
    };

    $scope.stopAction = function() {
        batch($scope.containers, Container.stop);
    };

    $scope.killAction = function() {
        batch($scope.containers, Container.kill);
    };

    $scope.removeAction = function() {
        batch($scope.containers, Container.remove);
    };

    update({all: $scope.displayAll ? 1 : 0});
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
                       Messages.send({class: 'text-success', data: 'Deleted: ' + resource.Deleted});
                   });
                   //Remove the image from the list
                   var index = $scope.images.indexOf(i);
                   $scope.images.splice(index, 1);
                   complete();
                }, function(e) {
                   Messages.send({class: 'text-error', data: e.data});
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
        failedRequestHandler(e, Messages);
        ViewSpinner.stop();
    });
}

// Controller for a single image and actions on that image
function ImageController($scope, $routeParams, $location, Image, Messages) {
    $scope.history = [];
    $scope.tag = {repo: '', force: false};

    $scope.remove = function() {
        Image.remove({id: $routeParams.id}, function(d) {
            Messages.send({class: 'text-success', data: 'Image removed.'});
        }, function(e) {
            failedRequestHandler(e, Messages);
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
            Messages.send({class: 'text-success', data: 'Tag added.'});
        }, function(e) {
            failedRequestHandler(e, Messages);
        });
    };

    $scope.create = function() {
        $('#create-modal').modal('show');
    };

    Image.get({id: $routeParams.id}, function(d) {
        $scope.image = d;
    }, function(e) {
        failedRequestHandler(e, Messages);
        if (e.status === 404) {
            $('.detail').hide();
        }
    });

    $scope.getHistory();
}

function StartContainerController($scope, $routeParams, $location, Container, Messages) {
    $scope.template = 'partials/startcontainer.html';
    $scope.config = {
        memory: 0,
        memorySwap: 0,
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
                Memory: $scope.config.memory,
                MemorySwap: $scope.config.memorySwap,
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
    $scope.template = '/partials/builder.html';

    ace.config.set('basePath', '/lib/ace-builds/src-noconflict/');
    var spinner = new Spinner();

    $scope.build = function() {
        spinner.spin(document.getElementById('build-modal'));
        Dockerfile.build(editor.getValue(), function(d) {
           console.log(d.currentTarget.response);
           $scope.messages = d.currentTarget.response;
           $scope.$apply();
           spinner.stop();
        }, function(e) {
           $scope.messages = e;
           $scope.$apply();
           spinner.stop();
        });
    };
}

function failedRequestHandler(e, Messages) {
    Messages.send({class: 'text-error', data: e.data});
}
