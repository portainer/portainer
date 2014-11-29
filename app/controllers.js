function newLineChart(id, data, getkey) {
    var chart = getChart(id);
    var map = {};

    for (var i = 0; i < data.length; i++) {
        var c = data[i];
        var key = getkey(c);
        
        var count = map[key];
        if (count === undefined) {
            count = 0;
        }
        count += 1;
        map[key] = count;
    }

    var labels = [];
    var data = [];
    var keys = Object.keys(map);

    for (var i = keys.length - 1; i > -1; i--) {
        var k = keys[i];
        labels.push(k);
        data.push(map[k]);
    }
    var dataset = {
        fillColor : "rgba(151,187,205,0.5)",
        strokeColor : "rgba(151,187,205,1)",
        pointColor : "rgba(151,187,205,1)",
        pointStrokeColor : "#fff",
        data : data
    };
    chart.Line({
        labels: labels,
        datasets: [dataset]
    }, 
    {
        scaleStepWidth: 1, 
        pointDotRadius:1,
        scaleOverride: true,
        scaleSteps: labels.length
    });
}

function getChart(id) {
    var ctx = $(id).get(0).getContext("2d");
    return new Chart(ctx);
}

function BuilderController($scope, Dockerfile, Messages) {
    $scope.template = 'partials/builder.html';
}

function failedRequestHandler(e, Messages) {
    Messages.send({class: 'text-error', data: e.data});
}

// This gonna get messy but we don't have a good way to do this right now
function getContainersFromImage($q, Container, tag) {
    var defer = $q.defer();
    
    Container.query({all:1, notruc:1}, function(d) {
        var containers = [];
        for (var i = 0; i < d.length; i++) {
            var c = d[i];
            if (c.Image == tag) {
                containers.push(new ContainerViewModel(c));
            }
        }
        defer.resolve(containers);
    });

    return defer.promise;
}
