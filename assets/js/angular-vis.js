angular.module('ngVis', [])

    .factory('VisDataSet', function () {
        'use strict';
        return function (data, options) {
            // Create the new dataSets
            return new vis.DataSet(data, options);
        };
    })

/**
 * TimeLine directive
 */
    .directive('visTimeline', function () {
        'use strict';
        return {
            restrict: 'EA',
            transclude: false,
            scope: {
                data: '=',
                options: '=',
                events: '=',
                component: '='
            },
            link: function (scope, element, attr) {
                var timelineEvents = [
                    'rangechange',
                    'rangechanged',
                    'timechange',
                    'timechanged'
                ];

                // Declare the timeline
                var timeline = null;

                scope.$watch('data', function () {
                    // Sanity check
                    if (scope.data == null) {
                        return;
                    }

                    // If we've actually changed the data set, then recreate the graph
                    // We can always update the data by adding more data to the existing data set
                    if (timeline != null) {
                        timeline.destroy();
                    }

                    // Create the timeline object
                    timeline = new vis.Timeline(element[0]);
                    scope.component = timeline;

                    // Attach an event handler if defined
                    angular.forEach(scope.events, function (callback, event) {
                        if (timelineEvents.indexOf(String(event)) >= 0) {
                            timeline.on(event, callback);
                        }
                    });

                    // Set the options first
                    timeline.setOptions(scope.options);

                    // Add groups and items
                    if (scope.data.groups != null) {
                        timeline.setGroups(scope.data.groups);
                    }
                    if (scope.data.items != null) {
                        timeline.setItems(scope.data.items);
                    }

                    // onLoad callback
                    if (scope.events != null && scope.events.onload != null && angular.isFunction(scope.events.onload)) {
                        scope.events.onload(timeline);
                    }
                });

                scope.$watchCollection('options', function (options) {
                    if(timeline == null) {
                        return;
                    }
                    timeline.setOptions(options);
                });
            }
        };
    })


/**
 * Directive for network chart.
 */
    .directive('visNetwork', function () {
        return {
            restrict: 'EA',
            transclude: false,
            scope: {
                data: '=',
                options: '=',
                events: '=',
                component: '='
            },
            link: function (scope, element, attr) {
                var networkEvents = [
                    'rangechange',
                    'rangechanged',
                    'timechange',
                    'timechanged'
                ];

                var network = new vis.Network(element[0], scope.data, scope.options);
                scope.component = network;

                scope.$watch('data', function () {
                    // Sanity check
                    if (scope.data == null) {
                        return;
                    }

                    // If we've actually changed the data set, then recreate the graph
                    // We can always update the data by adding more data to the existing data set
//                    if (network !== undefined) {
//                        network.destroy();
                    //                   }

                    // Create the graph2d object
                    network = new vis.Network(element[0]);
                    scope.component = network;

                    // Attach an event handler if defined
                    angular.forEach(scope.events, function (callback, event) {
                        if (networkEvents.indexOf(String(event)) >= 0) {
                            network.on(event, callback);
                        }
                    });

                    // Set the options first
                    network.setOptions(scope.options);
                    network.setData(scope.data);


                    // onLoad callback
//                    if (scope.events != null && scope.events.onload != null && angular.isFunction(scope.events.onload)) {
//                        scope.events.onload(graph);
//                    }
                });

                scope.$watchCollection('options', function (options) {
                    if(network == null) {
                        return;
                    }
                    network.setOptions(options);
                });

                scope.$watch('events', function (events) {
                    angular.forEach(events, function (callback, event) {
                        if (['select', 'click', 'hoverNode', 'doubleClick'].indexOf(String(event)) >= 0) {
                            network.on(event, callback);
                        }
                    });
                });
            }
        };
    })

/**
 * Directive for graph2d.
 */
    .directive('visGraph2d', function () {
        'use strict';
        return {
            restrict: 'EA',
            transclude: false,
            scope: {
                data: '=',
                options: '=',
                events: '=',
                component: '='
            },
            link: function (scope, element, attr) {
                var graphEvents = [
                    'rangechange',
                    'rangechanged',
                    'timechange',
                    'timechanged'
                ];

                // Create the chart
                var graph = new vis.Graph2d(element[0]);
                scope.component = graph;

                scope.$watch('data', function () {
                    // Sanity check
                    if (scope.data == null) {
                        return;
                    }

                    // If we've actually changed the data set, then recreate the graph
                    // We can always update the data by adding more data to the existing data set
                    if (graph != null) {
                        graph.destroy();
                    }

                    // Create the graph2d object
                    graph = new vis.Graph2d(element[0]);
                    scope.component = graph;

                    // Attach an event handler if defined
                    angular.forEach(scope.events, function (callback, event) {
                        if (graphEvents.indexOf(String(event)) >= 0) {
                            graph.on(event, callback);
                        }
                    });

                    // Set the options first
                    graph.setOptions(scope.options);

                    // Add groups and items
                    if (scope.data.groups != null) {
                        graph.setGroups(scope.data.groups);
                    }
                    if (scope.data.items != null) {
                        graph.setItems(scope.data.items);
                    }

                    // onLoad callback
                    if (scope.events != null && scope.events.onload != null && angular.isFunction(scope.events.onload)) {
                        scope.events.onload(graph);
                    }
                });

                scope.$watchCollection('options', function (options) {
                    if(graph == null) {
                        return;
                    }
                    graph.setOptions(options);
                });
            }
        };
    })
;
