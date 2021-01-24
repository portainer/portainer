import angular from 'angular';

import * as sessionStorage from './session-storage';

angular.module('portainer.app').factory('DatatableService', DatatableServiceFactory);

const DATATABLE_PREFIX = 'datatable_';
const TEXT_FILTER_KEY_PREFIX = `${DATATABLE_PREFIX}text_filter_`;

/* @ngInject */
function DatatableServiceFactory(LocalStorage) {
  return {
    setDataTableSettings,
    getDataTableSettings,
    setDataTableTextFilters,
    getDataTableTextFilters,
    setDataTableFilters,
    getDataTableFilters,
    getDataTableOrder,
    setDataTableOrder,
    setDataTableExpandedItems,
    setColumnVisibilitySettings,
    getDataTableExpandedItems,
    setDataTableSelectedItems,
    getDataTableSelectedItems,
    getColumnVisibilitySettings,
  };

  function setDataTableSettings(key, settings) {
    LocalStorage.storeDataTableSettings(key, settings);
  }

  function getDataTableSettings(key) {
    return LocalStorage.getDataTableSettings(key);
  }

  function setDataTableTextFilters(key, filters) {
    sessionStorage.save(TEXT_FILTER_KEY_PREFIX + key, filters);
  }

  function getDataTableTextFilters(key) {
    return sessionStorage.get(TEXT_FILTER_KEY_PREFIX + key);
  }

  function setDataTableFilters(key, filters) {
    LocalStorage.storeDataTableFilters(key, filters);
  }

  function getDataTableFilters(key) {
    return LocalStorage.getDataTableFilters(key);
  }

  function getDataTableOrder(key) {
    return LocalStorage.getDataTableOrder(key);
  }

  function setDataTableOrder(key, orderBy, reverse) {
    var filter = {
      orderBy: orderBy,
      reverse: reverse,
    };
    LocalStorage.storeDataTableOrder(key, filter);
  }

  function setDataTableExpandedItems(key, expandedItems) {
    LocalStorage.storeDataTableExpandedItems(key, expandedItems);
  }

  function setColumnVisibilitySettings(key, columnVisibility) {
    LocalStorage.storeColumnVisibilitySettings(key, columnVisibility);
  }

  function getDataTableExpandedItems(key) {
    return LocalStorage.getDataTableExpandedItems(key);
  }

  function setDataTableSelectedItems(key, selectedItems) {
    LocalStorage.storeDataTableSelectedItems(key, selectedItems);
  }

  function getDataTableSelectedItems(key) {
    return LocalStorage.getDataTableSelectedItems(key);
  }

  function getColumnVisibilitySettings(key) {
    return LocalStorage.getColumnVisibilitySettings(key);
  }
}
