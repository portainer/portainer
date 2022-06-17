import { ItemViewModel } from '../models/item';

angular.module('portainer.docker').factory('ExplorerService', ExplorerServiceFactory);

function ExplorerServiceFactory($q, Explorer) {
  'use strict';
  var service = {};

  service.containerId = '';
  service.currentPath = '/';
  service.fileList = [];
  service.history = [];
  service.error = '';
  service.requesting = false;
  // eslint-disable-next-line no-empty-function
  service.onRefresh = function () {};

  service.getBasePath = function () {
    const path = '/';
    return path.trim() ? path.split('/') : [];
  };

  service.folderClick = function (item) {
    const self = this;
    this.currentPath = [];
    if (item && item.isFolder()) {
      this.currentPath = item.model.path === '/' ? item.model.path + item.model.name : item.model.path + '/' + item.model.name;
    }
    this.refresh(self.containerId, this.currentPath);
  };

  service.refresh = function (containerId, path) {
    var self = this;

    self.containerId = containerId;
    self.requesting = true;
    self.fileList = [];
    return self
      .list(containerId, path)
      .then(function (data) {
        self.fileList = (data || []).map(function (file) {
          return new ItemViewModel(file, path);
        });

        self.buildTree(path.trim());

        self.onRefresh();
      })
      .finally(function () {
        self.requesting = false;
      });
  };

  service.list = function (containerId, path) {
    const deferred = $q.defer();

    const parameters = {
      id: containerId,
      path: path,
    };
    Explorer.list(parameters)
      .$promise.then(function success(data) {
        deferred.resolve(data);
      })
      .catch(function error(err) {
        deferred.reject(err);
      });

    return deferred.promise;
  };

  service.buildTree = function (path) {
    var flatNodes = [],
      selectedNode = {};

    function recursive(parent, item, path) {
      const parentPath = path === '/' ? path + item.model.name : path + '/' + item.model.name;

      if (parent.absPath && parent.absPath && parent.absPath !== '/' && path.indexOf(parent.absPath) !== 0) {
        parent.nodes = [];
      }

      if (parent.absPath !== path) {
        parent.nodes.forEach(function (nd) {
          recursive(nd, item, path);
        });
      } else {
        for (const e in parent.nodes) {
          if (parent.nodes[e].name === item.model.name) {
            return;
          }
        }
        parent.nodes.push({
          name: item.model.name,
          absPath: parentPath,
          item: item,
          nodes: [],
        });
      }

      parent.nodes = parent.nodes.sort(function (a, b) {
        return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : a.name.toLowerCase() === b.name.toLowerCase() ? 0 : 1;
      });
    }

    function flatten(node, array) {
      array.push(node);
      for (const n in node.nodes) {
        flatten(node.nodes[n], array);
      }
    }

    function findNode(data, path) {
      return data.filter(function (n) {
        return n.name === path;
      })[0];
    }

    !this.history.length &&
      this.history.push({
        name: this.getBasePath()[0] || '',
        absPath: '/',
        nodes: [],
      });
    flatten(this.history[0], flatNodes);

    // eslint-disable-next-line no-debugger
    // debugger;

    selectedNode = findNode(flatNodes, path);
    selectedNode && (selectedNode.nodes = []);

    for (var o in this.fileList) {
      var item = this.fileList[o];
      item instanceof ItemViewModel && item.isFolder() && recursive(this.history[0], item, path);
    }

    console.log('history', this.history);
  };

  return service;
}
