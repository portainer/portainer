
// Controller for the top masthead
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

function SettingsController($scope, Settings) {
    
}

// Controls the page that displays a single container and actions on that container.
function ContainerController($scope, $routeParams, Container) {
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

    Image.query({}, function(d) {
        $scope.images = d;
    });    
}

// Controller for a single image and actions on that image
function ImageController($scope, $routeParams, Image) {
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
    });

    $scope.getHistory();
}
