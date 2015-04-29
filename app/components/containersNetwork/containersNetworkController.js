angular.module('containersNetwork', ['ngVis'])
.controller('ContainersNetworkController', ['$scope', '$location', 'Container', 'Messages', 'VisDataSet', function($scope, $location, Container, Messages, VisDataSet) {
    $scope.options = {
      navigation: true,
      keyboard: true,
      height: '500px', width: '700px',
      nodes: {
        shape: 'box'
      },
      edges: {
        style: 'arrow'
      },
      physics: {
        barnesHut : {
          springLength: 200
        }
      }
    };

    function ContainerNode(data) {
        this.Id = data.Id;
        // names have the following format: /Name
        this.Name = data.Name.substring(1);
        var dataLinks = data.HostConfig.Links;
        if (dataLinks != null) {
            this.Links = [];
            for (var i = 0; i < dataLinks.length; i++) {
                // links have the following format: /TargetContainerName:/SourceContainerName/LinkAlias
                var link = dataLinks[i].split(":");
                var target = link[0].substring(1);
                var alias = link[1].substring(link[1].lastIndexOf("/") + 1);
                // only keep shortest alias
                if (this.Links[target] == null || alias.length < this.Links[target].length) {
                    this.Links[target] = alias;
                }
            }
        }
        var dataVolumes = data.HostConfig.VolumesFrom;
        //converting array into properties for simpler and faster access
        if (dataVolumes != null) {
            this.VolumesFrom = [];
            for (var j = 0; j < dataVolumes.length; j++) {
                this.VolumesFrom[dataVolumes[j]] = true;
            }
        }
    }

    function ContainersNetwork() {
        this.containers = [];
        this.nodes = new VisDataSet();
        this.edges = new VisDataSet();

        this.add = function(data) {
            var container = new ContainerNode(data);
            this.containers.push(container);
            this.nodes.add({id: container.Id, label: container.Name});
            for (var i = 0; i < this.containers.length; i++) {
                var otherContainer = this.containers[i];
                this.addLinkEdgeIfExists(container, otherContainer);
                this.addLinkEdgeIfExists(otherContainer, container);
                this.addVolumeEdgeIfExists(container, otherContainer);
                this.addVolumeEdgeIfExists(otherContainer, container);
            }
        };

        this.addLinkEdgeIfExists = function(from, to) {
            if (from.Links != null && from.Links[to.Name] != null) {
                this.edges.add({ from: from.Id, to: to.Id, label: from.Links[to.Name] });
            }
        };

        this.addVolumeEdgeIfExists = function(from, to) {
            if (from.VolumesFrom != null && from.VolumesFrom[to.Id] != null) {
                this.edges.add({ from: from.Id, to: to.Id, color: { color: '#A0A0A0', highlight: '#A0A0A0', hover: '#848484'}});
            }
        };
    }

    $scope.data = new ContainersNetwork();
    $scope.events = {
      doubleClick : function(event) {
        $scope.$apply( function() {
          $location.path('/containers/' + event.nodes[0]);
        });
      }
    };

    var showFailure = function (event) {
      Messages.error('Failure', e.data);
    };

    var addContainer = function (container) {
      $scope.data.add(container);
    };

    Container.query({all: 0}, function(d) {
        for (var i = 0; i < d.length; i++) {
            Container.get({id: d[i].Id}, addContainer, showFailure);
        }
   });
}]);
