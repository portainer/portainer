angular
.module('portainer')
.directive('rdSelectRow', function () {
  return {
    require: '^stTable',
    template: '<input type="checkbox"/>',
    scope: {
      row: '=rdSelectRow',
      state: '=rdSelectRowState'
    },
    link: function ($scope, element, attr, ctrl) {
      element.bind('click', function ($event) {
        $scope.$apply(function () {
          ctrl.select($scope.row, 'multiple');

          // multiple select with shift click
          var list = ctrl.getFilteredCollection();
          if ($scope.state.lastSelectedItem && $event && $event.shiftKey){
            var begin = list.indexOf($scope.state.lastSelectedItem);
            var end = list.indexOf($scope.row);
            var selection = list.slice(begin, end);
            angular.forEach(selection, function (selectedItem) {
              if (selectedItem.isSelected !== $scope.state.lastSelectedItem.isSelected) {
                ctrl.select(selectedItem, 'multiple');
              }
            });
          }
          $scope.state.lastSelectedItem = $scope.row;
        });
      });

      $scope.$watch('row.isSelected', function (newValue, oldValue) {
        element.find('input')[0].checked = newValue;
        if (newValue === true) {
          $scope.state.selectedItemCount++;
          element.parent().addClass('st-selected');
        } else if (oldValue === true) {
          $scope.state.selectedItemCount--;
          element.parent().removeClass('st-selected');
        }
      });
    }
  };
});
