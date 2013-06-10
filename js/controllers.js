
function MastheadController($scope) {
    $scope.template = 'partials/masthead.html';

    $scope.hclass = 'active';
    $scope.cclass = '';
    $scope.iclass = '';
    $scope.sclass = '';

    $scope.linkChange = function(link) {
        $scope.hclass = '';
        $scope.cclass = '';
        $scope.iclass = '';
        $scope.sclass = '';

        //This is shitty, I need help with this crap.
        switch(link) {
            case 'home':
                $scope.hclass = 'active';
                break;
            case 'containers':
                $scope.cclass = 'active';
                break;
            case 'images':
                $scope.iclass = 'active';
                break;
            case 'settings':
                $scope.sclass = 'active';
                break;
            default:
                console.log('Not supported:' + link);
        }
    };
}

function HomeController() {
    
}

function SettingsController($scope, Auth, System, Docker, Settings) {
    $scope.auth = {};
    $scope.info = {};
    $scope.docker = {};

    $('#response').hide();
    $scope.alertClass = 'block';

    var showAndHide = function(hide) {
        $('#response').show();
        if (hide) {
            setTimeout(function() { $('#response').hide();}, 5000);
        }
    };

    $scope.updateAuthInfo = function() {
        if ($scope.auth.password != $scope.auth.cpassword) {
            $scope.response = 'Your passwords do not match.';
            showAndHide(true);
            return;
        }
        Auth.update(
            {username: $scope.auth.username, email: $scope.auth.email, password: $scope.auth.password}, function(d) {
                console.log(d);
                $scope.alertClass = 'success';
                $scope.response = 'Auth information updated.';
                showAndHide(true);
            }, function(e) {
               console.log(e);
               $scope.alertClass = 'error';
               $scope.response = e.data;
               showAndHide(false);
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

function ContainerController($scope, $routeParams, $location, Container) {
    $('#response').hide();
    $scope.alertClass = 'block';

    var showAndHide = function(hide) {
        $('#response').show();
        if (hide) {
            setTimeout(function() { $('#response').hide();}, 5000);
        }
    };

    $scope.start = function(){
        Container.start({id: $routeParams.id}, function(d) {
            console.log(d);
            $scope.alertClass = 'success';
            $scope.response = 'Container started.';
            showAndHide(true);
        }, function(e) {
            console.log(e);
            $scope.alertClass = 'error';
            $scope.response = e.data;
            showAndHide(false);
        }); 
    };

    $scope.stop = function() {
        Container.stop({id: $routeParams.id}, function(d) {
            console.log(d);
            $scope.alertClass = 'success';
            $scope.response = 'Container stopped.';
            showAndHide(true);
        }, function(e) {
            console.log(e);
            $scope.alertClass = 'error';
            $scope.response = e.data;
            showAndHide(false);
        });
    };

    $scope.kill = function() {
        Container.kill({id: $routeParams.id}, function(d) {
            console.log(d);
            $scope.alertClass = 'success';
            $scope.response = 'Container killed.';
            showAndHide(true);
        }, function(e) {
            console.log(e);
            $scope.alertClass = 'error';
            $scope.response = e.data;
            showAndHide(false);
        });
    };

    $scope.remove = function() {
        if (confirm("Are you sure you want to remove the container?")) {
            Container.remove({id: $routeParams.id}, function(d) {
                console.log(d);
                $scope.alertClass = 'success';
                $scope.response = 'Container removed.';
                showAndHide(true);
            }, function(e){
                console.log(e);
                $scope.alertClass = 'error';
                $scope.response = e.data;
                showAndHide(false);
            });
        }
    };

    $scope.changes = [];

    $scope.getChanges = function() {
        Container.changes({id: $routeParams.id}, function(d) {
            $scope.changes = d;        
        });
    };

    Container.get({id: $routeParams.id}, function(d) {
        $scope.container = d;        
   }, function(e) {
        console.log(e);
        $location.path('/containers/');
   }); 

   $scope.getChanges();
}

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

function ImagesController($scope, Image) {
    $scope.predicate = '-Created';

    Image.query({}, function(d) {
        $scope.images = d;
    });    
}

function ImageController($scope, $routeParams, $location, Image) {
    $scope.history = [];
    $scope.tag = {repo: '', force: false};

    $('#response').hide();
    $scope.alertClass = 'block';

    var showAndHide = function(hide) {
        $('#response').show();
        if (hide) {
            setTimeout(function() { $('#response').hide();}, 5000);
        }
    };

    $scope.remove = function() {
        if (confirm("Are you sure you want to delete this image?")) {
            Image.remove({id: $routeParams.id}, function(d) {
                console.log(d);
                $scope.alertClass = 'success';
                $scope.response = 'Image removed.';
                showAndHide(true);
            }, function(e) {
                console.log(e);
                $scope.alertClass = 'error';
                $scope.response = e.data;
                showAndHide(false);
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
            $scope.alertClass = 'success';
            $scope.response = 'Tag added.';
            showAndHide(true);
        }, function(e) {
            console.log(e);
            $scope.alertClass = 'error';
            $scope.response = e.data;
            showAndHide(false);
        });
    };
    
    Image.get({id: $routeParams.id}, function(d) {
        $scope.image = d;
    }, function(e) {
        console.log(e);
        $location.path('/images/');
    });

    $scope.getHistory();
}

function StartContainerController($scope, $routeParams, $location, Container) {
    $scope.template = 'partials/startcontainer.html';
    $scope.memory = 0;
    $scope.memorySwap = 0;
    $scope.env = '';
    $scope.dns = '';
    $scope.volumesFrom = '';
    $scope.commands = '';

    $scope.launchContainer = function() {
        var cmds = null;
        if ($scope.commands !== '') {
            cmds = $scope.commands.split('\n'); 
        }
        var id = $routeParams.id;
        var ctor = Container;
        var loc = $location;
        var s = $scope;

        Container.create({
                Image: id, 
                Memory: $scope.memory, 
                MemorySwap: $scope.memorySwap, 
                Cmd: cmds, 
                VolumesFrom: $scope.volumesFrom
            }, function(d) {
                console.log(d);
                if (d.Id) {
                    ctor.start({id: d.Id}, function(cd) {
                        console.log(cd);
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
