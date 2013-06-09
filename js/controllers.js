var __extends = this.__extends || function (d, b) {
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var MastheadController = (function () {
    function MastheadController($scope) {
        $scope.template = 'partials/masthead.html';
        $scope.hclass = 'active';
        $scope.cclass = '';
        $scope.iclass = '';
        $scope.sclass = '';
        $scope.linkChange = function (link) {
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
    return MastheadController;
})();
var SideBarController = (function () {
    function SideBarController($scope, Container) {
        $scope.template = 'partials/sidebar.html';
        Container.query({
        }, function (d) {
            $scope.containers = d;
        });
    }
    return SideBarController;
})();
var HomeController = (function () {
    function HomeController() {
    }
    return HomeController;
})();
var SettingsController = (function () {
    function SettingsController() {
    }
    return SettingsController;
})();
var ContainerControllerBase = (function () {
    function ContainerControllerBase() { }
    ContainerControllerBase.prototype.start = function ($scope, $routeParams, Container) {
        Container.start({
            id: $routeParams.id
        }, function (d) {
            $scope.response = d;
        });
    };
    ContainerControllerBase.prototype.stop = function ($scope, $routeParams, Container) {
        Container.stop({
            id: $routeParams.id
        }, function (d) {
            $scope.response = d;
        });
    };
    ContainerControllerBase.prototype.remove = function ($scope, $routeParams, Container) {
        if(confirm("Are you sure you want to remove the container?")) {
            Container.remove({
                id: $routeParams.id
            }, function (d) {
                $scope.response = d;
            });
        }
    };
    return ContainerControllerBase;
})();
var ContainerController = (function (_super) {
    __extends(ContainerController, _super);
    function ContainerController($scope, $routeParams, Container) {
        var _this = this;
        _super.call(this);
        $scope.start = function () {
            return _this.start($scope, $routeParams, Container);
        };
        $scope.stop = function () {
            return _this.stop($scope, $routeParams, Container);
        };
        $scope.remove = function () {
            return _this.remove($scope, $routeParams, Container);
        };
        $scope.changes = [];
        $scope.getChanges = function () {
            Container.changes({
                id: $routeParams.id
            }, function (d) {
                $scope.changes = d;
            });
        };
        Container.get({
            id: $routeParams.id
        }, function (d) {
            $scope.container = d;
        });
        $scope.getChanges();
    }
    return ContainerController;
})(ContainerControllerBase);
var ContainersController = (function (_super) {
    __extends(ContainersController, _super);
    function ContainersController($scope, $routeParams, Container) {
        var _this = this;
        _super.call(this);
        $scope.start = function () {
            return _this.start($scope, $routeParams, Container);
        };
        $scope.stop = function () {
            return _this.stop($scope, $routeParams, Container);
        };
        Container.query({
        }, function (d) {
            $scope.containers = d;
        });
    }
    return ContainersController;
})(ContainerControllerBase);
