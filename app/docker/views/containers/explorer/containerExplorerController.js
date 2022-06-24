// import {ItemViewModel} from '../../../models/item'

import './containerExplorer.css';
import { ItemViewModel } from 'Docker/models/item';

angular
  .module('portainer.docker')
  .controller('ContainerExplorerController', [
    '$scope',
    '$window',
    '$transition$',
    'Notifications',
    'ContainerService',
    'HttpRequestHelper',
    'ExplorerService',
    function ($scope, $window, $transition$, Notifications, ContainerService, HttpRequestHelper, ExplorerService) {
      $scope.explorerService = ExplorerService;
      $scope.fileList = [];
      $scope.temps = [];
      $scope.reverse = false;
      $scope.predicate = ['model.type', 'model.name'];
      $scope.order = function (predicate) {
        $scope.reverse = $scope.predicate[1] === predicate ? !$scope.reverse : false;
        $scope.predicate[1] = predicate;
      };
      $scope.query = '';

      $scope.$on('$destroy', function () {
        $scope.explorerService.fileList = [];
        $scope.explorerService.history = [];
        $scope.fileList = [];
      });

      $scope.$watch('temps', function () {
        if ($scope.singleSelection()) {
          $scope.temp = $scope.singleSelection();
        } else {
          $scope.temp = new ItemViewModel({
            rights: 644,
          });
          $scope.temp.multiple = true;
        }
        $scope.temp.revert();
      });

      $scope.isInThisPath = function (path) {
        return $scope.explorerService.currentPath.indexOf(path) !== -1;
      };

      $scope.onTextFilterChange = function () {
        return null;
      };

      $scope.changeOrderBy = function (name) {
        console.log(name);
        return null;
      };

      $scope.isSelected = function (item) {
        return $scope.temps.indexOf(item) !== -1;
      };

      $scope.selectOrUnselect = function (item, $event) {
        var indexInTemp = $scope.temps.indexOf(item);
        const isRightClick = $event && $event.which === 3;

        console.log('isRightClick', isRightClick);
        if (isRightClick) {
          // var sidebar = angular.element('sidebar');
          var menu = angular.element('#context-menu');
          // var rightWidth =  menu.width() + sidebar.width()

          // if ($event.pageX >= $window.innerWidth - rightWidth) {
          //   $event.pageX = $event.pageX - 250;
          // }
          if ($event.pageY >= $window.innerHeight - menu.height()) {
            $event.pageY -= menu.height();
          }
          menu.css({
            left: $event.pageX - 250,
            top: $event.pageY,
          });

          // menu.css({
          //   left: $event.pageX - 250,
          //   top: $event.pageY - 5,
          // });
          menu.show();
        } else {
          angular.element('#context-menu').hide();
        }

        if ($event && $event.target.hasAttribute('prevent')) {
          $scope.temps = [];
          return;
        }

        if (!item || (isRightClick && $scope.isSelected(item))) {
          return;
        }

        if ($event && $event.shiftKey && !isRightClick) {
          var list = $scope.fileList;
          var indexInList = list.indexOf(item);
          var lastSelected = $scope.temps[0];
          var i = list.indexOf(lastSelected);
          var current = undefined;

          if (lastSelected && list.indexOf(lastSelected) < indexInList) {
            $scope.temps = [];
            while (i <= indexInList) {
              current = list[i];
              !$scope.isSelected(current) && $scope.temps.push(current);
              i++;
            }
            return;
          }

          if (lastSelected && list.indexOf(lastSelected) > indexInList) {
            $scope.temps = [];
            while (i >= indexInList) {
              current = list[i];
              !$scope.isSelected(current) && $scope.temps.push(current);
              i--;
            }
            return;
          }
        }

        if ($event && !isRightClick && ($event.ctrlKey || $event.metaKey)) {
          $scope.isSelected(item) ? $scope.temps.splice(indexInTemp, 1) : $scope.temps.push(item);
          return;
        }
        $scope.temps = [item];
      };

      $scope.singleSelection = function () {
        return $scope.temps.length === 1 && $scope.temps[0];
      };

      $scope.totalSelecteds = function () {
        return {
          total: $scope.temps.length,
        };
      };

      $scope.smartClick = function (item) {
        if (item.isFolder()) {
          return ExplorerService.folderClick(item);
        } else {
          Notifications.error('Failure', null, 'not supported');
        }
      };

      $scope.remove = function () {
        ExplorerService.remove($transition$.params().id, ExplorerService.currentPath);

        $scope.modal('remove', true);
      };

      $scope.changePermissions = function () {
        console.log('id');
      };

      $scope.modal = function (id, hide, returnElement) {
        console.log('id', id);
        console.log('hide', hide);
        console.log('returnElement', returnElement);

        var element = angular.element('#' + id);
        element.modal(hide ? 'hide' : 'show');
        $scope.explorerService.error = '';

        return returnElement ? element : true;
      };

      function initView() {
        HttpRequestHelper.setPortainerAgentTargetHeader($transition$.params().nodeName);
        ContainerService.container($transition$.params().id)
          .then(function success(data) {
            $scope.container = data;

            ExplorerService.refresh($transition$.params().id, '/');
          })
          .catch(function error(err) {
            Notifications.error('Failure', err, 'Unable to retrieve container information');
          });
      }

      initView();
    },
  ])
  .directive('ngRightClick', [
    '$parse',
    function ($parse) {
      return function (scope, element, attrs) {
        var fn = $parse(attrs.ngRightClick);
        element.bind('contextmenu', function (event) {
          scope.$apply(function () {
            event.preventDefault();
            fn(scope, {
              $event: event,
            });
          });
        });
      };
    },
  ]);
