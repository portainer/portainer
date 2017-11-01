angular.module('projects', [])
.controller('ProjectsController', ['$scope', 'Notifications', 'Pagination', 'ProjectService', 'ModalService',
function ($scope, Notifications, Pagination, ProjectService, ModalService) {
  $scope.state = {};
  $scope.state.selectedItemCount = 0;
  $scope.state.pagination_count = Pagination.getPaginationCount('projects');
  $scope.sortType = 'Name';
  $scope.sortReverse = false;
  $scope.state.DisplayInformationPanel = false;
  $scope.state.DisplayExternalProjects = true;

  $scope.changePaginationCount = function() {
    Pagination.setPaginationCount('projects', $scope.state.pagination_count);
  };

  $scope.order = function (sortType) {
    $scope.sortReverse = ($scope.sortType === sortType) ? !$scope.sortReverse : false;
    $scope.sortType = sortType;
  };

  $scope.selectItems = function (allSelected) {
    angular.forEach($scope.state.filteredProjects, function (project) {
      if (project.Id && project.Checked !== allSelected) {
        project.Checked = allSelected;
        $scope.selectItem(project);
      }
    });
  };

  $scope.selectItem = function (item) {
    if (item.Checked) {
      $scope.state.selectedItemCount++;
    } else {
      $scope.state.selectedItemCount--;
    }
  };

  $scope.removeAction = function () {
    ModalService.confirmDeletion(
      'Do you want to remove the selected project(s)? Associated stack/services will be removed as well.',
      function onConfirm(confirmed) {
        if(!confirmed) { return; }
        deleteSelectedProjects();
      }
    );
  };

  function deleteSelectedProjects() {
    $('#loadingViewSpinner').show();
    var counter = 0;

    var complete = function () {
      counter = counter - 1;
      if (counter === 0) {
        $('#loadingViewSpinner').hide();
      }
    };

    angular.forEach($scope.projects, function (project) {
      if (project.Checked) {
        counter = counter + 1;
        ProjectService.remove(project)
        .then(function success() {
          Notifications.success('Project deleted', project.Name);
          var index = $scope.projects.indexOf(project);
          $scope.projects.splice(index, 1);
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to remove project ' + project.Name);
        })
        .finally(function final() {
          complete();
        });
      }
    });
  }

  function initView() {
    $('#loadingViewSpinner').show();

    ProjectService.projects(true)
    .then(function success(data) {
      var projects = data;
      if (projects != null) {
          for (var i = 0; i < projects.length; i++) {
            var project = projects[i];
            if (project.External) {
              $scope.state.DisplayInformationPanel = true;
              break;
            }
          }
      } else {
        projects = []
      }
      $scope.projects = projects;
    })
    .catch(function error(err) {
      $scope.projects = [];
      Notifications.error('Failure', err, 'Unable to retrieve projects');
    })
    .finally(function final() {
      $('#loadingViewSpinner').hide();
    });
  }

  initView();
}]);
