
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
       }, 10000);
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

function SettingsController($scope, Auth, System, Docker, Settings) {
    $scope.auth = {};
    $scope.info = {};
    $scope.docker = {};
    $scope.endpoint = Settings.endpoint;
    $scope.apiVersion = Settings.version;

    $('#response').hide();
    $scope.alertClass = 'block';

    $scope.updateAuthInfo = function() {
        if ($scope.auth.password != $scope.auth.cpassword) {
            setSuccessfulResponse($scope, 'Your passwords do not match.', '#response');
            return;
        }
        Auth.update(
            {username: $scope.auth.username, email: $scope.auth.email, password: $scope.auth.password}, function(d) {
                console.log(d);
                setSuccessfulResponse($scope, 'Auth information updated.', '#response');
            }, function(e) {
               console.log(e);
               setFailedResponse($scope, e.data, '#response');
            });
    };

    Auth.get({}, function(d) {
        $scope.auth = d;
    });

    Docker.get({}, function(d) {
        $scope.docker = d;
    });

    System.get({}, function(d) {
        $scope.info = d;
    });
}

// Controls the page that displays a single container and actions on that container.
function ContainerController($scope, $routeParams, $location, Container) {
    $('#response').hide();
    $scope.alertClass = 'block';

    $scope.start = function(){
        Container.start({id: $routeParams.id}, function(d) {
            console.log(d); setSuccessfulResponse($scope, 'Container started.', '#response');
        }, function(e) {
            console.log(e);
            setFailedResponse($scope, e.data, '#response');
        }); 
    };

    $scope.stop = function() {
        Container.stop({id: $routeParams.id}, function(d) {
            console.log(d);
            setSuccessfulResponse($scope, 'Container stopped.', '#response');
        }, function(e) {
            console.log(e);
            setFailedResponse($scope, e.data, '#response');
        });
    };

    $scope.kill = function() {
        Container.kill({id: $routeParams.id}, function(d) {
            console.log(d);
            setSuccessfulResponse($scope, 'Container killed.', '#response');
        }, function(e) {
            console.log(e);
            setFailedResponse($scope, e.data, '#response');
        });
    };

    $scope.remove = function() {
        if (confirm("Are you sure you want to remove the container?")) {
            Container.remove({id: $routeParams.id}, function(d) {
                console.log(d);
                setSuccessfulResponse($scope, 'Container removed.', '#response');
            }, function(e){
                console.log(e);
                setFailedResponse($scope, e.data, '#response');
            });
        }
    };

    $scope.changes = [];

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
        console.log(e);
        setFailedResponse($scope, e.data, '#response');
        if (e.status === 404) {
            $('.detail').hide();
        }
   });

   $scope.getChanges();
}

// Controller for the list of containers
function ContainersController($scope, Container, Settings, ViewSpinner) {
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
         angular.forEach(items, function(c) {
           if (c.Checked) {
               action({id: c.Id}, function(d) {
                  console.log(d); 
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
        var u = update;
        var data = {all: 0};

        if ($scope.displayAll) {
            data.all = 1;
        }
        u(data);
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
    $scope.predicate = '-Created';
    $('#response').hide();
    $scope.alertClass = 'block';
    $scope.toggle = false;
    $scope.respones = [];

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
                   console.log(d); 
                   angular.forEach(d, function(resource) {
                       Messages.send({class: 'text-success', data: 'Deleted: ' + resource.Deleted});
                   });
                   var index = $scope.images.indexOf(i);
                   $scope.images.splice(index, 1);
                   complete();
                }, function(e) {
                   console.log(e);
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
        console.log(e);
        setFailedResponses($scope, e.data, '#response');
        ViewSpinner.stop();
    });
}

// Controller for a single image and actions on that image
function ImageController($scope, $routeParams, $location, Image) {
    $scope.history = [];
    $scope.tag = {repo: '', force: false};

    $('#response').hide();
    $scope.alertClass = 'block';
 
    $scope.remove = function() {
        if (confirm("Are you sure you want to delete this image?")) {
            Image.remove({id: $routeParams.id}, function(d) {
                console.log(d);
                setSuccessfulResponse($scope, 'Image removed.', '#response');
            }, function(e) {
                console.log(e);
                setFailedResponse($scope, e.data, '#response');
            }); 
        }
    };

    $scope.getHistory = function() {
        Image.history({id: $routeParams.id}, function(d) {
            $scope.history = d;
        });
    };

    $scope.updateTag = function() {
        var tag = $scope.tag;
        Image.tag({id: $routeParams.id, repo: tag.repo, force: tag.force ? 1 : 0}, function(d) {
            console.log(d);
            setSuccessfulResponse($scope, 'Tag added.', '#response');
        }, function(e) {
            console.log(e);
            setFailedResponse($scope, e.data, '#response');
        });
    };

    $scope.create = function() {
        $('#create-modal').modal('show');
    };

    Image.get({id: $routeParams.id}, function(d) {
        $scope.image = d;
    }, function(e) {
        console.log(e);
        setFailedResponse($scope, e.data, '#response');
        if (e.status === 404) {
            $('.detail').hide();
        }
    });

    $scope.getHistory();
}

function StartContainerController($scope, $routeParams, $location, Container) {
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
        $scope.response = '';
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
                console.log(d);
                if (d.Id) {
                    ctor.start({id: d.Id}, function(cd) {
                        console.log(cd);
                        $('#create-modal').modal('hide');
                        loc.path('/containers/' + d.Id + '/');
                    }, function(e) {
                        console.log(e); 
                        s.resonse = e.data;
                    });
                }
            }, function(e) {
                console.log(e);
                $scope.response = e.data; 
        });
    };
}

function BuilderController($scope, Dockerfile, Messages) {
    $scope.template = '/partials/builder.html';

    ace.config.set('basePath', '/lib/ace-builds/src-noconflict/');

    $scope.build = function() {
        Dockerfile.build(editor.getValue(), function(d) {
           Messages.send({class:'text-info', data: d});
        }, function(e) {
           Messages.send({class:'text-error', data: e});
        });
    };
}

function setSuccessfulResponse($scope, msg, msgId) {
    $scope.alertClass = 'success';
    $scope.response = msg;
    $(msgId).show();
    setTimeout(function() { $(msgId).hide();}, 5000);
}

function setFailedResponse($scope, msg, msgId) {
    $scope.alertClass = 'error';
    $scope.response = msg;
    $(msgId).show();
}
