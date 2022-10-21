import './containerExplorer.css';
import { ItemViewModel } from 'Docker/models/item';

angular
  .module('portainer.docker')
  .controller('ContainerExplorerController', [
    '$scope',
    '$document',
    '$transition$',
    'Notifications',
    'ContainerService',
    'HttpRequestHelper',
    'ExplorerService',
    function ($scope, $document, $transition$, Notifications, ContainerService, HttpRequestHelper, ExplorerService) {
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

      $document.on('click', function () {
        angular.element('#context-menu').hide();
      });

      $document.on('shown.bs.modal', '.modal', function () {
        window.setTimeout(
          function () {
            angular.element('[autofocus]', this).focus();
          }.bind(this),
          100
        );
      });

      $document.on('contextmenu', '.table-files tr.item-list:has("td"), .item-list', function (e) {
        var menu = angular.element('#context-menu');

        if (e.pageX >= window.innerWidth - menu.width()) {
          e.pageX -= menu.width();
        }
        if (e.pageY >= window.innerHeight - menu.height()) {
          e.pageY -= menu.height();
        }

        menu.hide().css({
            left: e.pageX,
            top: e.pageY,
          }).appendTo('body').show();
        e.preventDefault();
      });

      $scope.$watch('temps', function () {
        if ($scope.singleSelection()) {
          $scope.temp = $scope.singleSelection();
        } else {
          $scope.temp = new ItemViewModel({
            perms: '',
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
        let files = ($scope.temps || []).map(function (f) {
          return f && f.model.fullPath();
        });
        ExplorerService.remove(files)
          .then(function () {
            Notifications.success('files delete successfully');
            ExplorerService.refresh($transition$.params().id, ExplorerService.currentPath);
          })
          .catch(function error(err) {
            Notifications.error('Failure', err, 'files delete filed.');
          });
        $scope.modal('remove', true);
      };

      $scope.changePermissions = function () {
        console.log('id');
      };

      $scope.modal = function (id, hide, returnElement) {
        const element = angular.element('#' + id);
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
