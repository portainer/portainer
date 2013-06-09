
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

function SideBarController($scope, Container) {
    $scope.template = 'partials/sidebar.html';
    
    Container.query({}, function(d) {
        $scope.containers = d;
    });
}

function HomeController() {
    
}

function SettingsController() {
    
}

function ContainerController($scope, $routeParams, Container) {
    $('#response').hide();

    $scope.start = function(){
        Container.start({id: $routeParams.id}, function(d) {
            $scope.response = d;        
            $('#response').show();
            setTimeout($('#response').hide, 5000);
        });     
    };

    $scope.stop = function() {
        
        Container.stop({id: $routeParams.id}, function(d) {
            $scope.response = d;        
            $('#response').show();
            setTimeout($('#response').hide, 5000);
        });
    };

    $scope.remove = function() {
        if (confirm("Are you sure you want to remove the container?")) {
            Container.remove({id: $routeParams.id}, function(d) {
                $scope.response = d; 
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

function ImageController($scope, $routeParams, Image) {
    $scope.history = [];
    $scope.tag = {repo: '', force: false};
    $scope.remove = function() {
        if (confirm("Are you sure you want to delete this image?")) {
            Image.remove({id: $routeParams.id}, function(d) {
                $scope.response = d;
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
            $scope.response = d;    
        });
    };
    
    Image.get({id: $routeParams.id}, function(d) {
        $scope.image = d;
    });

    $scope.getHistory();
}
