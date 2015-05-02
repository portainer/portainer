angular.module('containersNetwork', ['ngVis'])
.controller('ContainersNetworkController', ['$scope', '$location', 'Container', 'Messages', 'VisDataSet', function($scope, $location, Container, Messages, VisDataSet) {

    function ContainerNode(data) {
        this.Id = data.Id;
        // names have the following format: /Name
        this.Name = data.Name.substring(1);
        this.Image = data.Config.Image;
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

    function ContainersNetworkData() {
        this.nodes = new VisDataSet();
        this.edges = new VisDataSet();

        this.addContainerNode = function(container) {
            this.nodes.add({
                id: container.Id,
                label: container.Name,
                title: "<ul style=\"list-style-type:none; padding: 0px; margin: 0px\">" +
                    "<li><strong>ID:</strong> " + container.Id + "</li>" +
                    "<li><strong>Image:</strong> " + container.Image + "</li>" +
                     "</ul>"});
        };

        this.addLinkEdgeIfExists = function(from, to) {
            if (from.Links != null && from.Links[to.Name] != null) {
                this.edges.add({
                    from: from.Id,
                    to: to.Id,
                    label: from.Links[to.Name] });
            }
        };

        this.addVolumeEdgeIfExists = function(from, to) {
            if (from.VolumesFrom != null && from.VolumesFrom[to.Id] != null) {
                this.edges.add({
                    from: from.Id,
                    to: to.Id,
                    color: { color: '#A0A0A0', highlight: '#A0A0A0', hover: '#848484'}});
            }
        };

        this.removeContainersNodes = function(containersIds) {
            this.nodes.remove(containersIds);
        };
    }

    function ContainersNetwork() {
        this.data = new ContainersNetworkData();
        this.containers = [];
        this.selectedContainers = [];
        this.shownContainers = [];
        this.events = {
            select : function(event) {
                $scope.network.selectedContainers = event.nodes;
                $scope.$apply( function() {
                    $scope.query = '';
                });
            },
            doubleClick : function(event) {
                $scope.$apply( function() {
                    $location.path('/containers/' + event.nodes[0]);
                });
            }
        };
        this.options = {
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

        this.addContainer = function(data) {
            var container = new ContainerNode(data);
            this.containers.push(container);
            this.shownContainers.push(container);
            this.data.addContainerNode(container);
            for (var i = 0; i < this.containers.length; i++) {
                var otherContainer = this.containers[i];
                this.data.addLinkEdgeIfExists(container, otherContainer);
                this.data.addLinkEdgeIfExists(otherContainer, container);
                this.data.addVolumeEdgeIfExists(container, otherContainer);
                this.data.addVolumeEdgeIfExists(otherContainer, container);
            }
        };

        this.selectContainers = function(query) {
            if (this.component != null) {
                this.selectedContainers = this.searchContainers(query);
                this.component.selectNodes(this.selectedContainers);
            }
        };

        this.searchContainers = function(query) {
            if (query.trim() === "") {
              return [];
            }
            var selectedContainers = [];
            for (var i=0; i < this.shownContainers.length; i++) {
                var container = this.shownContainers[i];
                if (container.Name.indexOf(query) > -1 ||
                    container.Image.indexOf(query) > -1 ||
                    container.Id.indexOf(query) > -1) {
                    selectedContainers.push(container.Id);
                }
            }
            return selectedContainers;
        };

        this.hideSelected = function() {
            var i=0;
            while ( i < this.shownContainers.length ) {
                if (this.selectedContainers.indexOf(this.shownContainers[i].Id) > -1) {
                    this.shownContainers.splice(i, 1);
                } else {
                    i++;
                }
            }
            this.data.removeContainersNodes(this.selectedContainers);
            $scope.query = '';
            this.selectedContainers = [];
        };

        this.showAll = function() {
            for (var i=0; i < this.containers.length; i++) {
                var container = this.containers[i];
                if (this.shownContainers.indexOf(container) === -1) {
                    this.data.addContainerNode(container);
                    this.shownContainers.push(container);
                }
            }
        };

    }

    $scope.network = new ContainersNetwork();

    var showFailure = function (event) {
        Messages.error('Failure', e.data);
    };

    var addContainer = function (container) {
        $scope.network.addContainer(container);
    };

    Container.query({all: 0}, function(d) {
        for (var i = 0; i < d.length; i++) {
            Container.get({id: d[i].Id}, addContainer, showFailure);
        }
    });

}]);
