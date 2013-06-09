
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

    $scope.start = function(){
        Container.start({id: $routeParams.id}, function(d) {
            $scope.response = d;        
        });     
    };

    $scope.stop = function() {
        Container.stop({id: $routeParams.id}, function(d) {
            $scope.response = d;        
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

function ContainersController($scope, Container) {
    Container.query({}, function(d) {
        $scope.containers = d;        
   }); 
}
