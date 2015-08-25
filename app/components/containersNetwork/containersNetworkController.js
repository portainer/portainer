angular.module('containersNetwork', ['ngVis'])
    .controller('ContainersNetworkController', ['$scope', '$location', 'Container', 'Messages', 'VisDataSet', function ($scope, $location, Container, Messages, VisDataSet) {

        function ContainerNode(data) {
            this.Id = data.Id;
            // names have the following format: /Name
            this.Name = data.Name.substring(1);
            this.Image = data.Config.Image;
            this.Running = data.State.Running;
            var dataLinks = data.HostConfig.Links;
            if (dataLinks != null) {
                this.Links = {};
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
                this.VolumesFrom = {};
                for (var j = 0; j < dataVolumes.length; j++) {
                    this.VolumesFrom[dataVolumes[j]] = true;
                }
            }
        }

        function ContainersNetworkData() {
            this.nodes = new VisDataSet();
            this.edges = new VisDataSet();

            this.addContainerNode = function (container) {
                this.nodes.add({
                    id: container.Id,
                    label: container.Name,
                    title: "<ul style=\"list-style-type:none; padding: 0px; margin: 0px\">" +
                    "<li><strong>ID:</strong> " + container.Id + "</li>" +
                    "<li><strong>Image:</strong> " + container.Image + "</li>" +
                    "</ul>",
                    color: (container.Running ? "#8888ff" : "#cccccc")
                });
            };

            this.hasEdge = function (from, to) {
                return this.edges.getIds({
                        filter: function (item) {
                            return item.from === from.Id && item.to === to.Id;
                        }
                    }).length > 0;
            };

            this.addLinkEdgeIfExists = function (from, to) {
                if (from.Links != null && from.Links[to.Name] != null && !this.hasEdge(from, to)) {
                    this.edges.add({
                        from: from.Id,
                        to: to.Id,
                        label: from.Links[to.Name]
                    });
                }
            };

            this.addVolumeEdgeIfExists = function (from, to) {
                if (from.VolumesFrom != null && (from.VolumesFrom[to.Id] != null || from.VolumesFrom[to.Name] != null) && !this.hasEdge(from, to)) {
                    this.edges.add({
                        from: from.Id,
                        to: to.Id,
                        color: {color: '#A0A0A0', highlight: '#A0A0A0', hover: '#848484'}
                    });
                }
            };

            this.removeContainersNodes = function (containersIds) {
                this.nodes.remove(containersIds);
            };
        }

        function ContainersNetwork() {
            this.data = new ContainersNetworkData();
            this.containers = {};
            this.selectedContainersIds = [];
            this.shownContainersIds = [];
            this.events = {
                select: function (event) {
                    $scope.network.selectedContainersIds = event.nodes;
                    $scope.$apply(function () {
                        $scope.query = '';
                    });
                },
                doubleClick: function (event) {
                    $scope.$apply(function () {
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
                    barnesHut: {
                        springLength: 200
                    }
                }
            };

            this.addContainer = function (data) {
                var container = new ContainerNode(data);
                this.containers[container.Id] = container;
                this.shownContainersIds.push(container.Id);
                this.data.addContainerNode(container);
                for (var otherContainerId in this.containers) {
                    var otherContainer = this.containers[otherContainerId];
                    this.data.addLinkEdgeIfExists(container, otherContainer);
                    this.data.addLinkEdgeIfExists(otherContainer, container);
                    this.data.addVolumeEdgeIfExists(container, otherContainer);
                    this.data.addVolumeEdgeIfExists(otherContainer, container);
                }
            };

            this.selectContainers = function (query) {
                if (this.component != null) {
                    this.selectedContainersIds = this.searchContainers(query);
                    this.component.selectNodes(this.selectedContainersIds);
                }
            };

            this.searchContainers = function (query) {
                if (query.trim() === "") {
                    return [];
                }
                var selectedContainersIds = [];
                for (var i = 0; i < this.shownContainersIds.length; i++) {
                    var container = this.containers[this.shownContainersIds[i]];
                    if (container.Name.indexOf(query) > -1 ||
                        container.Image.indexOf(query) > -1 ||
                        container.Id.indexOf(query) > -1) {
                        selectedContainersIds.push(container.Id);
                    }
                }
                return selectedContainersIds;
            };

            this.hideSelected = function () {
                var i = 0;
                while (i < this.shownContainersIds.length) {
                    if (this.selectedContainersIds.indexOf(this.shownContainersIds[i]) > -1) {
                        this.shownContainersIds.splice(i, 1);
                    } else {
                        i++;
                    }
                }
                this.data.removeContainersNodes(this.selectedContainersIds);
                $scope.query = '';
                this.selectedContainersIds = [];
            };

            this.searchDownstream = function (containerId, downstreamContainersIds) {
                if (downstreamContainersIds.indexOf(containerId) > -1) {
                    return;
                }
                downstreamContainersIds.push(containerId);
                var container = this.containers[containerId];
                if (container.Links == null && container.VolumesFrom == null) {
                    return;
                }
                for (var otherContainerId in this.containers) {
                    var otherContainer = this.containers[otherContainerId];
                    if (container.Links != null && container.Links[otherContainer.Name] != null) {
                        this.searchDownstream(otherContainer.Id, downstreamContainersIds);
                    } else if (container.VolumesFrom != null &&
                        container.VolumesFrom[otherContainer.Id] != null) {
                        this.searchDownstream(otherContainer.Id, downstreamContainersIds);
                    }
                }
            };

            this.updateShownContainers = function (newShownContainersIds) {
                for (var containerId in this.containers) {
                    if (newShownContainersIds.indexOf(containerId) > -1 &&
                        this.shownContainersIds.indexOf(containerId) === -1) {
                        this.data.addContainerNode(this.containers[containerId]);
                    } else if (newShownContainersIds.indexOf(containerId) === -1 &&
                        this.shownContainersIds.indexOf(containerId) > -1) {
                        this.data.removeContainersNodes(containerId);
                    }
                }
                this.shownContainersIds = newShownContainersIds;
            };

            this.showSelectedDownstream = function () {
                var downstreamContainersIds = [];
                for (var i = 0; i < this.selectedContainersIds.length; i++) {
                    this.searchDownstream(this.selectedContainersIds[i], downstreamContainersIds);
                }
                this.updateShownContainers(downstreamContainersIds);
            };

            this.searchUpstream = function (containerId, upstreamContainersIds) {
                if (upstreamContainersIds.indexOf(containerId) > -1) {
                    return;
                }
                upstreamContainersIds.push(containerId);
                var container = this.containers[containerId];
                for (var otherContainerId in this.containers) {
                    var otherContainer = this.containers[otherContainerId];
                    if (otherContainer.Links != null && otherContainer.Links[container.Name] != null) {
                        this.searchUpstream(otherContainer.Id, upstreamContainersIds);
                    } else if (otherContainer.VolumesFrom != null &&
                        otherContainer.VolumesFrom[container.Id] != null) {
                        this.searchUpstream(otherContainer.Id, upstreamContainersIds);
                    }
                }
            };

            this.showSelectedUpstream = function () {
                var upstreamContainersIds = [];
                for (var i = 0; i < this.selectedContainersIds.length; i++) {
                    this.searchUpstream(this.selectedContainersIds[i], upstreamContainersIds);
                }
                this.updateShownContainers(upstreamContainersIds);
            };

            this.showAll = function () {
                for (var containerId in this.containers) {
                    if (this.shownContainersIds.indexOf(containerId) === -1) {
                        this.data.addContainerNode(this.containers[containerId]);
                        this.shownContainersIds.push(containerId);
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

        var update = function (data) {
            Container.query(data, function (d) {
                for (var i = 0; i < d.length; i++) {
                    Container.get({id: d[i].Id}, addContainer, showFailure);
                }
            });
        };
        update({all: 0});

        $scope.includeStopped = false;
        $scope.toggleIncludeStopped = function () {
            $scope.network.updateShownContainers([]);
            update({all: $scope.includeStopped ? 1 : 0});
        };

    }]);
