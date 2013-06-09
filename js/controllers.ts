
class MastheadController {
    constructor($scope: any) {
        $scope.template = 'partials/masthead.html';

        $scope.hclass = 'active';
        $scope.cclass = '';
        $scope.iclass = '';
        $scope.sclass = '';

        $scope.linkChange = (link: string) => {
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
}

class SideBarController {
    constructor($scope: any, Container: any) {
        $scope.template = 'partials/sidebar.html';
        
        Container.query({}, (d) => {
            $scope.containers = d;
        });
    }
}

class HomeController {
    constructor() {
    
    }
}

class SettingsController {
    constructor() {
    
    }
}

class ContainerControllerBase {
    //Start the current container
    start($scope: any, $routeParams: any, Container: any) {
        Container.start({id: $routeParams.id}, (d) => {
            $scope.response = d;        
        }); 
    }

    //Stop the current container
    stop($scope: any, $routeParams: any, Container: any) {
        Container.stop({id: $routeParams.id}, (d) => {
            $scope.response = d;        
        });
    }

    //Remove the current container
    remove($scope: any, $routeParams: any, Container: any) {
        if (confirm("Are you sure you want to remove the container?")) {
            Container.remove({id: $routeParams.id}, (d) => {
                $scope.response = d; 
            });
        }
    }
}

class ContainerController extends ContainerControllerBase {
    constructor($scope: any, $routeParams: any, Container: any) {
        super();
        $scope.start = () => this.start($scope, $routeParams, Container);
        $scope.stop = () => this.stop($scope, $routeParams, Container);
        $scope.remove = () => this.remove($scope, $routeParams, Container);

        Container.get({id: $routeParams.id}, (d) => {
            $scope.container = d;        
       }); 
    }
}

class ContainersController extends ContainerControllerBase {
    constructor($scope: any, $routeParams: any, Container: any) {
        super();
        $scope.start = () => this.start($scope, $routeParams, Container);
        $scope.stop = () => this.stop($scope, $routeParams, Container);

        Container.query({}, (d) => {
            $scope.containers = d;        
       }); 
    }
}

