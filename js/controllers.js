
function MastheadController($scope) {
    $scope.template = 'partials/masthead.html';
}

function DashboardController($scope, Container) {
    
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
            console.log(d);
            setSuccessfulResponse($scope, 'Container started.', '#response');
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
function ContainersController($scope, Container, Settings) {
    $scope.displayAll = Settings.displayAll;
    $scope.predicate = '-Created';

    var update = function(data) {
        Container.query(data, function(d) {
            $scope.containers = d;        
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

    update({all: $scope.displayAll ? 1 : 0}); 
}

// Controller for the list of images
function ImagesController($scope, Image) {
    $scope.predicate = '-Created';
    $('#response').hide();
    $scope.alertClass = 'block';

    Image.query({}, function(d) {
        $scope.images = d;
    }, function (e) {
        console.log(e);
        setFailedResponse($scope, e.data, '#response');
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

    $scope.close = function() {
        $('#create-modal').modal('hide');
    };

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

function BuilderController($scope, Image) {
    $('#response').hide();
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
