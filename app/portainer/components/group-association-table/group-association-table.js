import _ from 'lodash-es';
import { r2a } from '@/react-tools/react2angular';
import { idsToTagNames } from 'Portainer/helpers/tagHelper';
import { GroupAssociationTable } from './GroupAssociationTable';

angular
  .module('portainer.app')
  .component('reactGroupAssociationTable', r2a(GroupAssociationTable, ['emptyContentLabel', 'onClickRow', 'query', 'title']))

  .component('groupAssociationTable', {
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
        return idsToTagNames(this.tags, tagIds).join(', ') || '-';
      };

      this.groupIdToGroupName = function groupIdToGroupName(groupId) {
        const group = _.find(this.groups, { Id: groupId });
        return group ? group.Name : '';
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
      groups: '<',
      showGroups: '<',
      hasBackendPagination: '<',
      cyValue: '@',
      title: '@',
    },
  });
