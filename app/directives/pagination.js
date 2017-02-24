angular
.module('portainer')
.directive('rdPagination', ['Pagination', function(Pagination) {
  return {
    require: 'ngModel',
    template: '<option value="10">10</option> <option value="25">25</option> <option value="50">50</option> <option value="100">100</option>',
    link: function(scope, element, attrs, ngModel) {
      var key = attrs['pagination'] || 'default';
      element.bind('change', function(){
        // store pagination value
        Pagination.setPaginationCount(key, element[0].value);
      });

      // load pagination value
      element[0].value = Pagination.getPaginationCount(key);
      ngModel.$setViewValue(element[0].value, 'change');

      // convert string value passed throw ng-model to number 
      ngModel.$parsers.push(function(val) {
        return val != null ? parseInt(val, 10) : null;
      });
      ngModel.$formatters.push(function(val) {
        return val != null ? '' + val : null;
      });
    }
  };
}]);

