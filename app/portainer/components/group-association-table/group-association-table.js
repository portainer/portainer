import PortainerEndpointTagHelper from 'Portainer/helpers/tagHelper';

angular.module('portainer.app').component('groupAssociationTable', {
  templateUrl: './groupAssociationTable.html',
  controller: function () {
    this.state = {
      orderBy: 'Name',
      reverseOrder: false,
      paginatedItemLimit: '10',
      textFilter: '',
      loading: true,
      pageNumber: 1,
    };

    this.changeOrderBy = function (orderField) {
      this.state.reverseOrder = this.state.orderBy === orderField ? !this.state.reverseOrder : false;
      this.state.orderBy = orderField;
    };

    this.hasBackendPagination = function () {
      return !(this.pageType === 'create' && this.tableType === 'associated');
    };
    this.onTextFilterChange = function () {
      this.paginationChangedAction();
    };

    this.onPageChanged = function (newPageNumber) {
      this.paginationState.pageNumber = newPageNumber;
      this.paginationChangedAction();
    };

    this.onPaginationLimitChanged = function () {
      this.paginationChangedAction();
    };

    this.paginationChangedAction = function () {
      this.retrievePage(this.pageType, this.tableType);
    };

    this.$onChanges = function (changes) {
      if (changes.loaded && changes.loaded.currentValue) {
        this.paginationChangedAction();
      }
    };

    this.tagIdsToTagNames = function tagIdsToTagNames(tagIds) {
      return PortainerEndpointTagHelper.idsToTagNames(this.tags, tagIds);
    };
  },
  bindings: {
    paginationState: '=',
    loaded: '<',
    pageType: '<',
    tableType: '@',
    retrievePage: '<',
    dataset: '<',
    entryClick: '<',
    emptyDatasetMessage: '@',
    tags: '<',
    showTags: '<',
  },
});
