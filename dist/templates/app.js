angular.module('dockerui.templates', ['app/components/builder/builder.html', 'app/components/container/container.html', 'app/components/containerLogs/containerlogs.html', 'app/components/containerTop/containerTop.html', 'app/components/containers/containers.html', 'app/components/dashboard/dashboard.html', 'app/components/footer/statusbar.html', 'app/components/image/image.html', 'app/components/images/images.html', 'app/components/info/info.html', 'app/components/masthead/masthead.html', 'app/components/sidebar/sidebar.html', 'app/components/startContainer/startcontainer.html']);

angular.module("app/components/builder/builder.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("app/components/builder/builder.html",
    "<div id=\"build-modal\" class=\"modal fade\">\n" +
    "    <div class=\"modal-dialog\">\n" +
    "        <div class=\"modal-content\">\n" +
    "            <div class=\"modal-header\">\n" +
    "                <button type=\"button\" class=\"close\" data-dismiss=\"modal\" aria-hidden=\"true\">&times;</button>\n" +
    "                <h3>Build Image</h3>\n" +
    "            </div>\n" +
    "            <div class=\"modal-body\">\n" +
    "                <div id=\"editor\"></div>\n" +
    "                <p>{{ messages }}</p>\n" +
    "            </div>\n" +
    "            <div class=\"modal-footer\">\n" +
    "                <a href=\"\" class=\"btn btn-primary\" ng-click=\"build()\">Build</a>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
}]);

angular.module("app/components/container/container.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("app/components/container/container.html",
    "<div class=\"detail\">\n" +
    "\n" +
    "    <div ng-if=\"!container.edit\">\n" +
    "        <h4>Container: {{ container.Name }}\n" +
    "            <button class=\"btn btn-primary\"\n" +
    "                    ng-click=\"container.edit = true;\">Rename\n" +
    "            </button>\n" +
    "        </h4>\n" +
    "    </div>\n" +
    "    <div ng-if=\"container.edit\">\n" +
    "        <h4>\n" +
    "            Container:\n" +
    "            <input type=\"text\" ng-model=\"container.newContainerName\">\n" +
    "            <button class=\"btn btn-success\"\n" +
    "                    ng-click=\"renameContainer()\">Edit\n" +
    "            </button>\n" +
    "            <button class=\"btn btn-danger\"\n" +
    "                    ng-click=\"container.edit = false;\">&times;</button>\n" +
    "        </h4>\n" +
    "    </div>\n" +
    "\n" +
    "    <div class=\"btn-group detail\">\n" +
    "        <button class=\"btn btn-success\"\n" +
    "                ng-click=\"start()\"\n" +
    "                ng-show=\"!container.State.Running\">Start\n" +
    "        </button>\n" +
    "        <button class=\"btn btn-warning\"\n" +
    "                ng-click=\"stop()\"\n" +
    "                ng-show=\"container.State.Running && !container.State.Paused\">Stop\n" +
    "        </button>\n" +
    "        <button class=\"btn btn-danger\"\n" +
    "                ng-click=\"kill()\"\n" +
    "                ng-show=\"container.State.Running && !container.State.Paused\">Kill\n" +
    "        </button>\n" +
    "        <button class=\"btn btn-info\"\n" +
    "                ng-click=\"pause()\"\n" +
    "                ng-show=\"container.State.Running && !container.State.Paused\">Pause\n" +
    "        </button>\n" +
    "        <button class=\"btn btn-success\"\n" +
    "                ng-click=\"unpause()\"\n" +
    "                ng-show=\"container.State.Running && container.State.Paused\">Unpause\n" +
    "        </button>\n" +
    "    </div>\n" +
    "\n" +
    "    <table class=\"table table-striped\">\n" +
    "        <tbody>\n" +
    "        <tr>\n" +
    "            <td>Created:</td>\n" +
    "            <td>{{ container.Created }}</td>\n" +
    "        </tr>\n" +
    "        <tr>\n" +
    "            <td>Path:</td>\n" +
    "            <td>{{ container.Path }}</td>\n" +
    "        </tr>\n" +
    "        <tr>\n" +
    "            <td>Args:</td>\n" +
    "            <td>{{ container.Args }}</td>\n" +
    "        </tr>\n" +
    "        <tr>\n" +
    "            <td>Exposed Ports:</td>\n" +
    "            <td>\n" +
    "                <ul>\n" +
    "                    <li ng-repeat=\"(k, v) in container.Config.ExposedPorts\">{{ k }}</li>\n" +
    "                </ul>\n" +
    "            </td>\n" +
    "        </tr>\n" +
    "        <tr>\n" +
    "            <td>Environment:</td>\n" +
    "            <td>\n" +
    "                <ul>\n" +
    "                    <li ng-repeat=\"k in container.Config.Env\">{{ k }}</li>\n" +
    "                </ul>\n" +
    "            </td>\n" +
    "        </tr>\n" +
    "\n" +
    "        <tr>\n" +
    "            <td>Publish All:</td>\n" +
    "            <td>{{ container.HostConfig.PublishAllPorts }}</td>\n" +
    "        </tr>\n" +
    "        <tr>\n" +
    "            <td>Ports:</td>\n" +
    "            <td>\n" +
    "                <ul style=\"display:inline-table\">\n" +
    "                    <li ng-repeat=\"(containerport, hostports) in container.HostConfig.PortBindings\">\n" +
    "                        {{ containerport }} => <span class=\"label label-default\" ng-repeat=\"(k,v) in hostports\">{{ v.HostIp }}:{{ v.HostPort }}</span>\n" +
    "                    </li>\n" +
    "                </ul>\n" +
    "            </td>\n" +
    "\n" +
    "        </tr>\n" +
    "        <tr>\n" +
    "            <td>Hostname:</td>\n" +
    "            <td>{{ container.Config.Hostname }}</td>\n" +
    "        </tr>\n" +
    "        <tr>\n" +
    "            <td>IPAddress:</td>\n" +
    "            <td>{{ container.NetworkSettings.IPAddress }}</td>\n" +
    "        </tr>\n" +
    "        <tr>\n" +
    "            <td>Cmd:</td>\n" +
    "            <td>{{ container.Config.Cmd }}</td>\n" +
    "        </tr>\n" +
    "        <tr>\n" +
    "            <td>Entrypoint:</td>\n" +
    "            <td>{{ container.Config.Entrypoint }}</td>\n" +
    "        </tr>\n" +
    "        <tr>\n" +
    "            <td>Volumes:</td>\n" +
    "            <td>{{ container.Volumes }}</td>\n" +
    "        </tr>\n" +
    "\n" +
    "        <tr>\n" +
    "            <td>SysInitpath:</td>\n" +
    "            <td>{{ container.SysInitPath }}</td>\n" +
    "        </tr>\n" +
    "        <tr>\n" +
    "            <td>Image:</td>\n" +
    "            <td><a href=\"#/images/{{ container.Image }}/\">{{ container.Image }}</a></td>\n" +
    "        </tr>\n" +
    "        <tr>\n" +
    "            <td>State:</td>\n" +
    "            <td><span class=\"label {{ container.State|getstatelabel }}\">{{ container.State|getstatetext }}</span></td>\n" +
    "        </tr>\n" +
    "        <tr>\n" +
    "            <td>Logs:</td>\n" +
    "            <td><a href=\"#/containers/{{ container.Id }}/logs\">stdout/stderr</a></td>\n" +
    "        </tr>\n" +
    "        <tr>\n" +
    "            <td>Top:</td>\n" +
    "            <td><a href=\"#/containers/{{ container.Id }}/top\">Top</a></td>\n" +
    "        </tr>\n" +
    "        </tbody>\n" +
    "    </table>\n" +
    "\n" +
    "    <div class=\"row-fluid\">\n" +
    "        <div class=\"span1\">\n" +
    "            Changes:\n" +
    "        </div>\n" +
    "        <div class=\"span5\">\n" +
    "            <i class=\"icon-refresh\" style=\"width:32px;height:32px;\" ng-click=\"getChanges()\"></i>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "\n" +
    "    <div class=\"well well-large\">\n" +
    "        <ul>\n" +
    "            <li ng-repeat=\"change in changes | filter:hasContent\">\n" +
    "                <strong>{{ change.Path }}</strong> {{ change.Kind }}\n" +
    "            </li>\n" +
    "        </ul>\n" +
    "    </div>\n" +
    "\n" +
    "    <hr/>\n" +
    "\n" +
    "    <div class=\"btn-remove\">\n" +
    "        <button class=\"btn btn-large btn-block btn-primary btn-danger\" ng-click=\"remove()\">Remove Container</button>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
}]);

angular.module("app/components/containerLogs/containerlogs.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("app/components/containerLogs/containerlogs.html",
    "<div class=\"row logs\">\n" +
    "    <div class=\"col-xs-12\">\n" +
    "        <h4>Logs for container: <a href=\"#/containers/{{ container.Id }}/\">{{ container.Name }}</a></td></h4>\n" +
    "        <div class=\"btn-group detail\">\n" +
    "            <button class=\"btn btn-info\" ng-click=\"scrollTo('stdout')\">stdout</button>\n" +
    "            <button class=\"btn btn-warning\" ng-click=\"scrollTo('stderr')\">stderr</button>\n" +
    "        </div>\n" +
    "        <div class=\"pull-right col-xs-6\">\n" +
    "            <div class=\"col-xs-6\">\n" +
    "                <a class=\"btn btn-primary\" ng-click=\"toggleTail()\" role=\"button\">Reload logs</a>\n" +
    "                <input id=\"tailLines\" type=\"number\" ng-style=\"{width: '45px'}\"\n" +
    "                    ng-model=\"tailLines\" ng-keypress=\"($event.which === 13)? toggleTail() : 0\"/>\n" +
    "                <label for=\"tailLines\">lines</label>\n" +
    "            </div>\n" +
    "            <div class=\"col-xs-4\">\n" +
    "                <input id=\"timestampToggle\" type=\"checkbox\" ng-model=\"showTimestamps\"\n" +
    "                    ng-change=\"toggleTimestamps()\"/> <label for=\"timestampToggle\">Timestamps</label>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "\n" +
    "    <div class=\"col-xs-12\">\n" +
    "        <div class=\"panel panel-default\">\n" +
    "            <div class=\"panel-heading\">\n" +
    "                <h3 id=\"stdout\" class=\"panel-title\">STDOUT</h3>\n" +
    "            </div>\n" +
    "            <div class=\"panel-body\">\n" +
    "                <pre id=\"stdoutLog\" class=\"pre-scrollable pre-x-scrollable\">{{stdout}}</pre>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "    <div class=\"col-xs-12\">\n" +
    "        <div class=\"panel panel-default\">\n" +
    "            <div class=\"panel-heading\">\n" +
    "                <h3 id=\"stderr\" class=\"panel-title\">STDERR</h3>\n" +
    "            </div>\n" +
    "            <div class=\"panel-body\">\n" +
    "                <pre id=\"stderrLog\" class=\"pre-scrollable pre-x-scrollable\">{{stderr}}</pre>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
}]);

angular.module("app/components/containerTop/containerTop.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("app/components/containerTop/containerTop.html",
    "<div class=\"containerTop\">\n" +
    "    <div class=\"form-group col-xs-2\">\n" +
    "        <input type=\"text\" class=\"form-control\" placeholder=\"[options] (aux)\" ng-model=\"ps_args\">\n" +
    "    </div>\n" +
    "    <button type=\"button\" class=\"btn btn-default\" ng-click=\"getTop()\">Submit</button>\n" +
    "\n" +
    "    <table class=\"table table-striped\">\n" +
    "        <thead>\n" +
    "        <tr>\n" +
    "            <th ng-repeat=\"title in containerTop.Titles\">{{title}}</th>\n" +
    "        </tr>\n" +
    "        </thead>\n" +
    "        <tbody>\n" +
    "        <tr ng-repeat=\"processInfos in containerTop.Processes\">\n" +
    "            <td ng-repeat=\"processInfo in processInfos track by $index\">{{processInfo}}</td>\n" +
    "        </tr>\n" +
    "        </tbody>\n" +
    "    </table>\n" +
    "</div>");
}]);

angular.module("app/components/containers/containers.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("app/components/containers/containers.html",
    "\n" +
    "<h2>Containers:</h2>\n" +
    "\n" +
    "<div>\n" +
    "    <ul class=\"nav nav-pills pull-left\">\n" +
    "        <li class=\"dropdown\">\n" +
    "            <a class=\"dropdown-toggle\" id=\"drop4\" role=\"button\" data-toggle=\"dropdown\" data-target=\"#\">Actions <b class=\"caret\"></b></a>\n" +
    "            <ul id=\"menu1\" class=\"dropdown-menu\" role=\"menu\" aria-labelledby=\"drop4\">\n" +
    "                <li><a tabindex=\"-1\" href=\"\" ng-click=\"startAction()\">Start</a></li>\n" +
    "                <li><a tabindex=\"-1\" href=\"\" ng-click=\"stopAction()\">Stop</a></li>\n" +
    "                <li><a tabindex=\"-1\" href=\"\" ng-click=\"restartAction()\">Restart</a></li>\n" +
    "                <li><a tabindex=\"-1\" href=\"\" ng-click=\"killAction()\">Kill</a></li>\n" +
    "                <li><a tabindex=\"-1\" href=\"\" ng-click=\"pauseAction()\">Pause</a></li>\n" +
    "                <li><a tabindex=\"-1\" href=\"\" ng-click=\"unpauseAction()\">Unpause</a></li>\n" +
    "                <li><a tabindex=\"-1\" href=\"\" ng-click=\"removeAction()\">Remove</a></li>\n" +
    "            </ul>\n" +
    "        </li>\n" +
    "    </ul>\n" +
    "\n" +
    "    <div class=\"pull-right\">\n" +
    "        <input type=\"checkbox\" ng-model=\"displayAll\" id=\"displayAll\" ng-change=\"toggleGetAll()\"/> <label for=\"displayAll\">Display All</label>\n" +
    "    </div>\n" +
    "</div>\n" +
    "<table class=\"table table-striped\">\n" +
    "    <thead>\n" +
    "        <tr>\n" +
    "            <th><input type=\"checkbox\" ng-model=\"toggle\" ng-change=\"toggleSelectAll()\" /> Action</th>\n" +
    "            <th>Name</th>\n" +
    "            <th>Image</th>\n" +
    "            <th>Command</th>\n" +
    "            <th>Created</th>\n" +
    "            <th>Status</th>\n" +
    "        </tr>\n" +
    "    </thead>\n" +
    "    <tbody>\n" +
    "        <tr ng-repeat=\"container in containers|orderBy:predicate\">\n" +
    "            <td><input type=\"checkbox\" ng-model=\"container.Checked\" /></td>\n" +
    "            <td><a href=\"#/containers/{{ container.Id }}/\">{{ container|containername}}</a></td>\n" +
    "            <td><a href=\"#/images/{{ container.Image }}/\">{{ container.Image }}</a></td>\n" +
    "            <td>{{ container.Command|truncate:40 }}</td>\n" +
    "            <td>{{ container.Created|getdate }}</td>\n" +
    "            <td><span class=\"label label-{{ container.Status|statusbadge }}\">{{ container.Status }}</span></td>\n" +
    "        </tr>\n" +
    "    </tbody>\n" +
    "</table>\n" +
    "");
}]);

angular.module("app/components/dashboard/dashboard.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("app/components/dashboard/dashboard.html",
    " \n" +
    "<div class=\"col-xs-offset-1\">\n" +
    "    <!--<div class=\"sidebar span4\">\n" +
    "        <div ng-include=\"template\" ng-controller=\"SideBarController\"></div>\n" +
    "    </div>-->\n" +
    "    <div class=\"row\">\n" +
    "        <div class=\"col-xs-10\" id=\"masthead\" style=\"display:none\">\n" +
    "            <div class=\"jumbotron\">\n" +
    "                <h1>DockerUI</h1>\n" +
    "                <p class=\"lead\">The Linux container engine</p>\n" +
    "                    <a class=\"btn btn-large btn-success\" href=\"http://docker.io\">Learn more.</a>\n" +
    "              </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "    \n" +
    "    <div class=\"row\">\n" +
    "        <div class=\"col-xs-10\">\n" +
    "            <div class=\"col-xs-5\">\n" +
    "                <h3>Running Containers</h3>\n" +
    "                <ul>\n" +
    "                    <li ng-repeat=\"container in containers|orderBy:predicate\">\n" +
    "                        <a href=\"#/containers/{{ container.Id }}/\">{{ container|containername }}</a>\n" +
    "                        <span class=\"label label-{{ container.Status|statusbadge }}\">{{ container.Status }}</span>\n" +
    "                    </li>\n" +
    "                </ul>\n" +
    "            </div>\n" +
    "            <div class=\"col-xs-5 text-right\">\n" +
    "                <h3>Status</h3>\n" +
    "                <canvas id=\"containers-chart\" class=\"pull-right\">\n" +
    "                    <p class=\"browserupgrade\">You are using an <strong>outdated</strong> browser. Please <a href=\"http://browsehappy.com/\">upgrade your browser</a> to improve your experience.</p>\n" +
    "                </canvas>\n" +
    "                <div id=\"chart-legend\"></div>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "\n" +
    "    <div class=\"row\">\n" +
    "        <div class=\"col-xs-10\" id=\"stats\">\n" +
    "            <h4>Containers created</h4>\n" +
    "           <canvas id=\"containers-started-chart\" width=\"700\">\n" +
    "                <p class=\"browserupgrade\">You are using an <strong>outdated</strong> browser. Please <a href=\"http://browsehappy.com/\">upgrade your browser</a> to improve your experience.</p>\n" +
    "           </canvas>\n" +
    "            <h4>Images created</h4>\n" +
    "           <canvas id=\"images-created-chart\" width=\"700\">\n" +
    "                <p class=\"browserupgrade\">You are using an <strong>outdated</strong> browser. Please <a href=\"http://browsehappy.com/\">upgrade your browser</a> to improve your experience.</p>\n" +
    "           </canvas>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
}]);

angular.module("app/components/footer/statusbar.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("app/components/footer/statusbar.html",
    "<footer class=\"center well\">\n" +
    "    <p><small>Docker API Version: <strong>{{ apiVersion }}</strong> UI Version: <strong>{{ uiVersion }}</strong> <a class=\"pull-right\" href=\"https://github.com/crosbymichael/dockerui\">dockerui</a></small></p>\n" +
    "</footer>\n" +
    "");
}]);

angular.module("app/components/image/image.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("app/components/image/image.html",
    "<div ng-include=\"template\" ng-controller=\"StartContainerController\"></div>\n" +
    "\n" +
    "<div class=\"alert alert-error\" id=\"error-message\" style=\"display:none\">\n" +
    "    {{ error }}\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"detail\">\n" +
    " \n" +
    "    <h4>Image: {{ tag }}</h4>\n" +
    "\n" +
    "    <div class=\"btn-group detail\">\n" +
    "      <button class=\"btn btn-success\" data-toggle=\"modal\" data-target=\"#create-modal\">Create</button>\n" +
    "    </div>\n" +
    "\n" +
    "    <div>\n" +
    "       <h4>Containers created:</h4>\n" +
    "       <canvas id=\"containers-started-chart\" width=\"750\">\n" +
    "          <p class=\"browserupgrade\">You are using an <strong>outdated</strong> browser. Please <a href=\"http://browsehappy.com/\">upgrade your browser</a> to improve your experience.</p>\n" +
    "       </canvas>\n" +
    "    </div>\n" +
    "\n" +
    "    <table class=\"table table-striped\">\n" +
    "         <tbody>\n" +
    "            <tr>\n" +
    "                <td>Created:</td>\n" +
    "                <td>{{ image.Created }}</td>\n" +
    "            </tr>\n" +
    "            <tr>\n" +
    "                <td>Parent:</td>\n" +
    "                <td><a href=\"#/images/{{ image.Parent }}/\">{{ image.Parent }}</a></td>\n" +
    "            </tr>\n" +
    "            <tr>\n" +
    "                <td>Size (Virtual Size):</td>\n" +
    "                <td>{{ image.Size|humansize }} ({{ image.VirtualSize|humansize }})</td>\n" +
    "            </tr>\n" +
    "\n" +
    "            <tr>\n" +
    "                <td>Hostname:</td>\n" +
    "                <td>{{ image.ContainerConfig.Hostname }}</td>\n" +
    "            </tr>\n" +
    "            <tr>\n" +
    "                <td>User:</td>\n" +
    "                <td>{{ image.ContainerConfig.User }}</td>\n" +
    "            </tr>\n" +
    "            <tr>\n" +
    "                <td>Cmd:</td>\n" +
    "                <td>{{ image.ContainerConfig.Cmd }}</td>\n" +
    "            </tr>\n" +
    "            <tr>\n" +
    "                <td>Volumes:</td>\n" +
    "                <td>{{ image.ContainerConfig.Volumes }}</td>\n" +
    "            </tr>\n" +
    "            <tr>\n" +
    "                <td>Volumes from:</td>\n" +
    "                <td>{{ image.ContainerConfig.VolumesFrom }}</td>\n" +
    "            </tr>\n" +
    "            <tr>\n" +
    "                <td>Built with:</td>\n" +
    "                <td>Docker {{ image.DockerVersion }} on {{ image.Os}}, {{ image.Architecture }}</td>\n" +
    "            </tr>\n" +
    "\n" +
    "        </tbody>\n" +
    "    </table>\n" +
    "\n" +
    "    <div class=\"row-fluid\">\n" +
    "        <div class=\"span1\">\n" +
    "            History:\n" +
    "        </div>\n" +
    "        <div class=\"span5\">\n" +
    "            <i class=\"icon-refresh\" style=\"width:32px;height:32px;\" ng-click=\"getHistory()\"></i>\n" +
    "        </div>\n" +
    "    </div> \n" +
    "\n" +
    "    <div class=\"well well-large\">\n" +
    "        <ul>\n" +
    "            <li ng-repeat=\"change in history\">\n" +
    "                <strong>{{ change.Id }}</strong>: Created: {{ change.Created|getdate }} Created by: {{ change.CreatedBy }}\n" +
    "            </li>\n" +
    "        </ul>\n" +
    "    </div>\n" +
    "\n" +
    "    <hr />\n" +
    "\n" +
    "    <div class=\"row-fluid\">\n" +
    "        <form class=\"form-inline\" role=\"form\">\n" +
    "            <fieldset>\n" +
    "                <legend>Tag image</legend>\n" +
    "                <div class=\"form-group\">\n" +
    "                    <label>Tag:</label>\n" +
    "                    <input type=\"text\" placeholder=\"repo...\" ng-model=\"tag.repo\" class=\"form-control\">\n" +
    "                </div>\n" +
    "                <div class=\"form-group\">\n" +
    "                    <label class=\"checkbox\">\n" +
    "                        <input type=\"checkbox\" ng-model=\"tag.force\" class=\"form-control\"/> Force?\n" +
    "                    </label>\n" +
    "                </div>\n" +
    "                 <input type=\"button\" ng-click=\"updateTag()\" value=\"Tag\" class=\"btn btn-primary\"/>\n" +
    "            </fieldset>\n" +
    "        </form>\n" +
    "    </div>\n" +
    "\n" +
    "    <hr />\n" +
    "\n" +
    "    <div class=\"btn-remove\">\n" +
    "        <button class=\"btn btn-large btn-block btn-primary btn-danger\" ng-click=\"remove()\">Remove Image</button>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
}]);

angular.module("app/components/images/images.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("app/components/images/images.html",
    "\n" +
    "<div ng-include=\"template\" ng-controller=\"BuilderController\"></div>\n" +
    "\n" +
    "<h2>Images:</h2>\n" +
    "\n" +
    "<ul class=\"nav nav-pills\">\n" +
    "    <li class=\"dropdown\">\n" +
    "        <a class=\"dropdown-toggle\" id=\"drop4\" role=\"button\" data-toggle=\"dropdown\" data-target=\"#\">Actions <b class=\"caret\"></b></a>\n" +
    "        <ul id=\"menu1\" class=\"dropdown-menu\" role=\"menu\" aria-labelledby=\"drop4\">\n" +
    "            <li><a tabindex=\"-1\" href=\"\" ng-click=\"removeAction()\">Remove</a></li>\n" +
    "        </ul>\n" +
    "    </li>\n" +
    "</ul>\n" +
    "<table class=\"table table-striped\">\n" +
    "    <thead>\n" +
    "        <tr>\n" +
    "            <th><input type=\"checkbox\" ng-model=\"toggle\" ng-change=\"toggleSelectAll()\" /> Action</th>\n" +
    "            <th>Id</th>\n" +
    "            <th>Repository</th>\n" +
    "            <th>VirtualSize</th>\n" +
    "            <th>Created</th>\n" +
    "        </tr>\n" +
    "    </thead>\n" +
    "    <tbody>\n" +
    "        <tr ng-repeat=\"image in images | orderBy:predicate\">\n" +
    "            <td><input type=\"checkbox\" ng-model=\"image.Checked\" /></td>\n" +
    "            <td><a href=\"#/images/{{ image.Id }}/?tag={{ image|repotag }}\">{{ image.Id|truncate:20}}</a></td>\n" +
    "            <td>{{ image|repotag }}</td>\n" +
    "            <td>{{ image.VirtualSize|humansize }}</td>\n" +
    "            <td>{{ image.Created|getdate }}</td>\n" +
    "        </tr>\n" +
    "    </tbody>\n" +
    "</table>\n" +
    "");
}]);

angular.module("app/components/info/info.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("app/components/info/info.html",
    "<div class=\"detail\">\n" +
    "    <h2>Docker Information</h2>\n" +
    "    <div>\n" +
    "        <p class=\"lead\">\n" +
    "            <strong>Endpoint: </strong>{{ endpoint }}<br />\n" +
    "            <strong>Api Version: </strong>{{ apiVersion }}<br />\n" +
    "            <strong>Version: </strong>{{ docker.Version }}<br />\n" +
    "            <strong>Git Commit: </strong>{{ docker.GitCommit }}<br />\n" +
    "            <strong>Go Version: </strong>{{ docker.GoVersion }}<br />\n" +
    "        </p>\n" +
    "    </div>\n" +
    "\n" +
    "    <table class=\"table table-striped\">\n" +
    "         <tbody>\n" +
    "            <tr>\n" +
    "                <td>Containers:</td>\n" +
    "                <td>{{ info.Containers }}</td>\n" +
    "            </tr>\n" +
    "            <tr>\n" +
    "                <td>Images:</td>\n" +
    "                <td>{{ info.Images }}</td>\n" +
    "            </tr>\n" +
    "            <tr>\n" +
    "                <td>Debug:</td>\n" +
    "                <td>{{ info.Debug }}</td>\n" +
    "            </tr>\n" +
    "            <tr>\n" +
    "                <td>CPUs:</td>\n" +
    "                <td>{{ info.NCPU }}</td>\n" +
    "            </tr>\n" +
    "            <tr>\n" +
    "                <td>Total Memory:</td>\n" +
    "                <td>{{ info.MemTotal|humansize }}</td>\n" +
    "            </tr>\n" +
    "            <tr>\n" +
    "                <td>Operating System:</td>\n" +
    "                <td>{{ info.OperatingSystem }}</td>\n" +
    "            </tr>\n" +
    "            <tr>\n" +
    "                <td>Kernel Version:</td>\n" +
    "                <td>{{ info.KernelVersion }}</td>\n" +
    "            </tr>\n" +
    "            <tr>\n" +
    "                <td>ID:</td>\n" +
    "                <td>{{ info.ID }}</td>\n" +
    "            </tr>\n" +
    "            <tr>\n" +
    "                <td>Labels:</td>\n" +
    "                <td>{{ info.Labels }}</td>\n" +
    "            </tr>\n" +
    "            <tr>\n" +
    "                <td>File Descriptors:</td>\n" +
    "                <td>{{ info.NFd }}</td>\n" +
    "            </tr>\n" +
    "            <tr>\n" +
    "                <td>Goroutines:</td>\n" +
    "                <td>{{ info.NGoroutines }}</td>\n" +
    "            </tr>\n" +
    "            <tr>\n" +
    "                <td>Storage Driver:</td>\n" +
    "                <td>{{ info.Driver }}</td>\n" +
    "            </tr>\n" +
    "            <tr>\n" +
    "                <td>Storage Driver Status:</td>\n" +
    "                <td>{{ info.DriverStatus }}</td>\n" +
    "            </tr>\n" +
    "            <tr>\n" +
    "                <td>Execution Driver:</td>\n" +
    "                <td>{{ info.ExecutionDriver }}</td>\n" +
    "            </tr>\n" +
    "            <tr>\n" +
    "                <td>IPv4 Forwarding:</td>\n" +
    "                <td>{{ info.IPv4Forwarding }}</td>\n" +
    "            </tr>\n" +
    "            <tr>\n" +
    "                <td>Index Server Address:</td>\n" +
    "                <td>{{ info.IndexServerAddress }}</td>\n" +
    "            </tr>\n" +
    "            <tr>\n" +
    "                <td>Init Path:</td>\n" +
    "                <td>{{ info.InitPath }}</td>\n" +
    "            </tr>\n" +
    "            <tr>\n" +
    "                <td>Docker Root Directory:</td>\n" +
    "                <td>{{ info.DockerRootDir }}</td>\n" +
    "            </tr>\n" +
    "            <tr>\n" +
    "                <td>Init SHA1</td>\n" +
    "                <td>{{ info.InitSha1 }}</td>\n" +
    "            </tr>\n" +
    "            <tr>\n" +
    "                <td>Memory Limit:</td>\n" +
    "                <td>{{ info.MemoryLimit }}</td>\n" +
    "            </tr>\n" +
    "            <tr>\n" +
    "                <td>Swap Limit:</td>\n" +
    "                <td>{{ info.SwapLimit }}</td>\n" +
    "            </tr>\n" +
    "        </tbody>\n" +
    "    </table>\n" +
    "</div>\n" +
    "");
}]);

angular.module("app/components/masthead/masthead.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("app/components/masthead/masthead.html",
    "  <div class=\"masthead\">\n" +
    "    <h3 class=\"text-muted\">DockerUI</h3>\n" +
    "      <ul class=\"nav well\">\n" +
    "        <li><a href=\"#\">Dashboard</a></li>\n" +
    "        <li><a href=\"#/containers/\">Containers</a></li>\n" +
    "        <li><a href=\"#/images/\">Images</a></li>\n" +
    "        <li><a href=\"#/info/\">Info</a></li>\n" +
    "      </ul>\n" +
    "  </div>\n" +
    "");
}]);

angular.module("app/components/sidebar/sidebar.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("app/components/sidebar/sidebar.html",
    "<div class=\"well\">\n" +
    "    <strong>Running containers:</strong>\n" +
    "    <br />\n" +
    "    <strong>Endpoint: </strong>{{ endpoint }}\n" +
    "    <ul>\n" +
    "        <li ng-repeat=\"container in containers\">\n" +
    "            <a href=\"#/containers/{{ container.Id }}/\">{{ container.Id|truncate:20 }}</a>\n" +
    "            <span class=\"pull-right label label-{{ container.Status|statusbadge }}\">{{ container.Status }}</span>   \n" +
    "        </li>\n" +
    "    </ul>\n" +
    "</div> \n" +
    "");
}]);

angular.module("app/components/startContainer/startcontainer.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("app/components/startContainer/startcontainer.html",
    "<div id=\"create-modal\" class=\"modal fade\">\n" +
    "    <div class=\"modal-dialog\">\n" +
    "        <div class=\"modal-content\">\n" +
    "            <div class=\"modal-header\">\n" +
    "                <button type=\"button\" class=\"close\" data-dismiss=\"modal\" aria-hidden=\"true\">&times;</button>\n" +
    "                <h3>Create And Start Container From Image</h3>\n" +
    "            </div>\n" +
    "            <div class=\"modal-body\">\n" +
    "            <form role=\"form\">\n" +
    "                <accordion close-others=\"true\">\n" +
    "                    <accordion-group heading=\"Container options\" is-open=\"menuStatus.containerOpen\">\n" +
    "                        <fieldset>\n" +
    "                            <div class=\"row\">\n" +
    "                                <div class=\"col-xs-6\">\n" +
    "                                    <div class=\"form-group\">\n" +
    "                                        <label>Cmd:</label>\n" +
    "                                        <input type=\"text\" placeholder='[\"/bin/echo\", \"Hello world\"]' ng-model=\"config.Cmd\" class=\"form-control\"/>\n" +
    "                                        <small>Input commands as a raw string or JSON array</small>\n" +
    "                                    </div>\n" +
    "                                    <div class=\"form-group\">\n" +
    "                                        <label>Entrypoint:</label>\n" +
    "                                        <input type=\"text\" ng-model=\"config.Entrypoint\" class=\"form-control\" placeholder=\"./entrypoint.sh\"/>\n" +
    "                                    </div>\n" +
    "                                    <div class=\"form-group\">\n" +
    "                                        <label>Name:</label>\n" +
    "                                        <input type=\"text\" ng-model=\"config.name\" class=\"form-control\"/>\n" +
    "                                    </div>\n" +
    "                                    <div class=\"form-group\">\n" +
    "                                        <label>Hostname:</label>\n" +
    "                                        <input type=\"text\" ng-model=\"config.Hostname\" class=\"form-control\"/>\n" +
    "                                    </div>\n" +
    "                                    <div class=\"form-group\">\n" +
    "                                        <label>Domainname:</label>\n" +
    "                                        <input type=\"text\" ng-model=\"config.Domainname\" class=\"form-control\"/>\n" +
    "                                    </div>\n" +
    "                                    <div class=\"form-group\">\n" +
    "                                        <label>User:</label>\n" +
    "                                        <input type=\"text\" ng-model=\"config.User\" class=\"form-control\"/>\n" +
    "                                    </div>\n" +
    "                                    <div class=\"form-group\">\n" +
    "                                        <label>Memory:</label>\n" +
    "                                        <input type=\"number\" ng-model=\"config.Memory\" class=\"form-control\"/>\n" +
    "                                    </div>\n" +
    "                                    <div class=\"form-group\">\n" +
    "                                        <label>Volumes:</label>\n" +
    "                                        <div ng-repeat=\"volume in config.Volumes\">\n" +
    "                                            <div class=\"form-group form-inline\">\n" +
    "                                                <input type=\"text\" ng-model=\"volume.name\" class=\"form-control\" placeholder=\"/var/data\"/>\n" +
    "                                                <button type=\"button\" class=\"btn btn-danger btn-sm\" ng-click=\"rmEntry(config.Volumes, volume)\">Remove</button>\n" +
    "                                            </div>\n" +
    "                                        </div>\n" +
    "                                        <button type=\"button\" class=\"btn btn-success btn-sm\" ng-click=\"addEntry(config.Volumes, {name: ''})\">Add Volume</button>\n" +
    "                                    </div>\n" +
    "                                </div>\n" +
    "                                <div class=\"col-xs-6\">\n" +
    "                                    <div class=\"form-group\">\n" +
    "                                        <label>MemorySwap:</label>\n" +
    "                                        <input type=\"number\" ng-model=\"config.MemorySwap\" class=\"form-control\"/>\n" +
    "                                    </div>\n" +
    "                                    <div class=\"form-group\">\n" +
    "                                        <label>CpuShares:</label>\n" +
    "                                        <input type=\"number\" ng-model=\"config.CpuShares\" class=\"form-control\"/>\n" +
    "                                    </div>\n" +
    "                                    <div class=\"form-group\">\n" +
    "                                        <label>Cpuset:</label>\n" +
    "                                        <input type=\"text\" ng-model=\"config.Cpuset\" class=\"form-control\" placeholder=\"1,2\"/>\n" +
    "                                        <small>Input as comma-separated list of numbers</small>\n" +
    "                                    </div>\n" +
    "                                    <div class=\"form-group\">\n" +
    "                                        <label>WorkingDir:</label>\n" +
    "                                        <input type=\"text\" ng-model=\"config.WorkingDir\" class=\"form-control\" placeholder=\"/app\"/>\n" +
    "                                    </div>\n" +
    "                                    <div class=\"form-group\">\n" +
    "                                        <label>MacAddress:</label>\n" +
    "                                        <input type=\"text\" ng-model=\"config.MacAddress\" class=\"form-control\" placeholder=\"12:34:56:78:9a:bc\"/>\n" +
    "                                    </div>\n" +
    "                                    <div class=\"form-group\">\n" +
    "                                        <label for=\"networkDisabled\">NetworkDisabled:</label>\n" +
    "                                        <input id=\"networkDisabled\" type=\"checkbox\" ng-model=\"config.NetworkDisabled\"/>\n" +
    "                                    </div>\n" +
    "                                    <div class=\"form-group\">\n" +
    "                                        <label for=\"tty\">Tty:</label>\n" +
    "                                        <input id=\"tty\" type=\"checkbox\" ng-model=\"config.Tty\"/>\n" +
    "                                    </div>\n" +
    "                                    <div class=\"form-group\">\n" +
    "                                        <label for=\"openStdin\">OpenStdin:</label>\n" +
    "                                        <input id=\"openStdin\" type=\"checkbox\" ng-model=\"config.OpenStdin\"/>\n" +
    "                                    </div>\n" +
    "                                    <div class=\"form-group\">\n" +
    "                                        <label for=\"stdinOnce\">StdinOnce:</label>\n" +
    "                                        <input id=\"stdinOnce\" type=\"checkbox\" ng-model=\"config.StdinOnce\"/>\n" +
    "                                    </div>\n" +
    "                                    <div class=\"form-group\">\n" +
    "                                        <label>SecurityOpts:</label>\n" +
    "                                        <div ng-repeat=\"opt in config.SecurityOpts\">\n" +
    "                                            <div class=\"form-group form-inline\">\n" +
    "                                                <input type=\"text\" ng-model=\"opt.name\" class=\"form-control\" placeholder=\"label:type:svirt_apache\"/>\n" +
    "                                                <button type=\"button\" class=\"btn btn-danger btn-sm\" ng-click=\"rmEntry(config.SecurityOpts, opt)\">Remove</button>\n" +
    "                                            </div>\n" +
    "                                        </div>\n" +
    "                                        <button type=\"button\" class=\"btn btn-success btn-sm\" ng-click=\"addEntry(config.SecurityOpts, {name: ''})\">Add Option</button>\n" +
    "                                    </div>\n" +
    "                                </div>\n" +
    "                            </div>\n" +
    "                            <hr>\n" +
    "                            <div class=\"form-group\">\n" +
    "                                <label>Env:</label>\n" +
    "                                <div ng-repeat=\"envar in config.Env\">\n" +
    "                                    <div class=\"form-group form-inline\">\n" +
    "                                        <div class=\"form-group\">\n" +
    "                                            <label class=\"sr-only\">Variable Name:</label>\n" +
    "                                            <input type=\"text\" ng-model=\"envar.name\" class=\"form-control\" placeholder=\"NAME\"/>\n" +
    "                                        </div>\n" +
    "                                        <div class=\"form-group\">\n" +
    "                                            <label class=\"sr-only\">Variable Value:</label>\n" +
    "                                            <input type=\"text\" ng-model=\"envar.value\" class=\"form-control\" placeholder=\"value\"/>\n" +
    "                                        </div>\n" +
    "                                        <div class=\"form-group\">\n" +
    "                                            <button class=\"btn btn-danger btn-xs form-control\" ng-click=\"rmEntry(config.Env, envar)\">Remove</button>\n" +
    "                                        </div>\n" +
    "                                    </div>\n" +
    "                                </div>\n" +
    "                                <button type=\"button\" class=\"btn btn-success btn-sm\" ng-click=\"addEntry(config.Env, {name: '', value: ''})\">Add environment variable</button>\n" +
    "                            </div>\n" +
    "                        </fieldset>\n" +
    "                    </accordion-group>\n" +
    "                    <accordion-group heading=\"HostConfig options\" is-open=\"menuStatus.hostConfigOpen\">\n" +
    "                        <fieldset>\n" +
    "                            <div class=\"row\">\n" +
    "                                <div class=\"col-xs-6\">\n" +
    "                                    <div class=\"form-group\">\n" +
    "                                        <label>Binds:</label>\n" +
    "                                        <div ng-repeat=\"bind in config.HostConfig.Binds\">\n" +
    "                                            <div class=\"form-group form-inline\">\n" +
    "                                                <input type=\"text\" ng-model=\"bind.name\" class=\"form-control\" placeholder=\"/host:/container\"/>\n" +
    "                                                <button type=\"button\" class=\"btn btn-danger btn-sm\" ng-click=\"rmEntry(config.HostConfig.Binds, bind)\">Remove</button>\n" +
    "                                            </div>\n" +
    "                                        </div>\n" +
    "                                        <button type=\"button\" class=\"btn btn-success btn-sm\" ng-click=\"addEntry(config.HostConfig.Binds, {name: ''})\">Add Bind</button>\n" +
    "                                    </div>\n" +
    "                                    <div class=\"form-group\">\n" +
    "                                        <label>Links:</label>\n" +
    "                                        <div ng-repeat=\"link in config.HostConfig.Links\">\n" +
    "                                            <div class=\"form-group form-inline\">\n" +
    "                                                <input type=\"text\" ng-model=\"link.name\" class=\"form-control\" placeholder=\"web:db\">\n" +
    "                                                <button type=\"button\" class=\"btn btn-danger btn-sm\" ng-click=\"rmEntry(config.HostConfig.Links, link)\">Remove</button>\n" +
    "                                            </div>\n" +
    "                                        </div>\n" +
    "                                        <button type=\"button\" class=\"btn btn-success btn-sm\" ng-click=\"addEntry(config.HostConfig.Links, {name: ''})\">Add Link</button>\n" +
    "                                    </div>\n" +
    "                                    <div class=\"form-group\">\n" +
    "                                        <label>Dns:</label>\n" +
    "                                        <div ng-repeat=\"entry in config.HostConfig.Dns\">\n" +
    "                                            <div class=\"form-group form-inline\">\n" +
    "                                                <input type=\"text\" ng-model=\"entry.name\" class=\"form-control\" placeholder=\"8.8.8.8\"/>\n" +
    "                                                <button type=\"button\" class=\"btn btn-danger btn-sm\" ng-click=\"rmEntry(config.HostConfig.Dns, entry)\">Remove</button>\n" +
    "                                            </div>\n" +
    "                                        </div>\n" +
    "                                        <button type=\"button\" class=\"btn btn-success btn-sm\" ng-click=\"addEntry(config.HostConfig.Dns, {name: ''})\">Add entry</button>\n" +
    "                                    </div>\n" +
    "                                    <div class=\"form-group\">\n" +
    "                                        <label>DnsSearch:</label>\n" +
    "                                        <div ng-repeat=\"entry in config.HostConfig.DnsSearch\">\n" +
    "                                            <div class=\"form-group form-inline\">\n" +
    "                                                <input type=\"text\" ng-model=\"entry.name\" class=\"form-control\" placeholder=\"example.com\"/>\n" +
    "                                                <button type=\"button\" class=\"btn btn-danger btn-sm\" ng-click=\"rmEntry(config.HostConfig.DnsSearch, entry)\">Remove</button>\n" +
    "                                            </div>\n" +
    "                                        </div>\n" +
    "                                        <button type=\"button\" class=\"btn btn-success btn-sm\" ng-click=\"addEntry(config.HostConfig.DnsSearch, {name: ''})\">Add entry</button>\n" +
    "                                    </div>\n" +
    "                                    <div class=\"form-group\">\n" +
    "                                        <label>CapAdd:</label>\n" +
    "                                        <div ng-repeat=\"entry in config.HostConfig.CapAdd\">\n" +
    "                                            <div class=\"form-group form-inline\">\n" +
    "                                                <input type=\"text\" ng-model=\"entry.name\" class=\"form-control\" placeholder=\"cap_sys_admin\"/>\n" +
    "                                                <button type=\"button\" class=\"btn btn-danger btn-sm\" ng-click=\"rmEntry(config.HostConfig.CapAdd, entry)\">Remove</button>\n" +
    "                                            </div>\n" +
    "                                        </div>\n" +
    "                                        <button type=\"button\" class=\"btn btn-success btn-sm\" ng-click=\"addEntry(config.HostConfig.CapAdd, {name: ''})\">Add entry</button>\n" +
    "                                    </div>\n" +
    "                                    <div class=\"form-group\">\n" +
    "                                        <label>CapDrop:</label>\n" +
    "                                        <div ng-repeat=\"entry in config.HostConfig.CapDrop\">\n" +
    "                                            <div class=\"form-group form-inline\">\n" +
    "                                                <input type=\"text\" ng-model=\"entry.name\" class=\"form-control\" placeholder=\"cap_sys_admin\"/>\n" +
    "                                                <button type=\"button\" class=\"btn btn-danger btn-sm\" ng-click=\"rmEntry(config.HostConfig.CapDrop, entry)\">Remove</button>\n" +
    "                                            </div>\n" +
    "                                        </div>\n" +
    "                                        <button type=\"button\" class=\"btn btn-success btn-sm\" ng-click=\"addEntry(config.HostConfig.CapDrop, {name: ''})\">Add entry</button>\n" +
    "                                    </div>\n" +
    "                                </div>\n" +
    "                                <div class=\"col-xs-6\">\n" +
    "                                    <div class=\"form-group\">\n" +
    "                                        <label>NetworkMode:</label>\n" +
    "                                        <input type=\"text\" ng-model=\"config.HostConfig.NetworkMode\" class=\"form-control\" placeholder=\"bridge\"/>\n" +
    "                                    </div>\n" +
    "                                    <div class=\"form-group\">\n" +
    "                                        <label for=\"publishAllPorts\">PublishAllPorts:</label>\n" +
    "                                        <input id=\"publishAllPorts\" type=\"checkbox\" ng-model=\"config.HostConfig.PublishAllPorts\"/>\n" +
    "                                    </div>\n" +
    "                                    <div class=\"form-group\">\n" +
    "                                        <label for=\"privileged\">Privileged:</label>\n" +
    "                                        <input id=\"privileged\" type=\"checkbox\" ng-model=\"config.HostConfig.Privileged\"/>\n" +
    "                                    </div>\n" +
    "                                    <div class=\"form-group\">\n" +
    "                                        <label>VolumesFrom:</label>\n" +
    "                                        <div ng-repeat=\"volume in config.HostConfig.VolumesFrom\">\n" +
    "                                            <div class=\"form-group form-inline\">\n" +
    "                                                <select ng-model=\"volume.name\" ng-options=\"name for name in containerNames track by name\" class=\"form-control\"/>\n" +
    "                                                <button class=\"btn btn-danger btn-xs form-control\" ng-click=\"rmEntry(config.HostConfig.VolumesFrom, volume)\">Remove</button>\n" +
    "                                            </div>\n" +
    "                                        </div>\n" +
    "                                        <button type=\"button\" class=\"btn btn-success btn-sm\" ng-click=\"addEntry(config.HostConfig.VolumesFrom, {name: ''})\">Add volume</button>\n" +
    "                                    </div>\n" +
    "                                    \n" +
    "                                    <div class=\"form-group\">\n" +
    "                                        <label>RestartPolicy:</label>\n" +
    "                                        <select ng-model=\"config.HostConfig.RestartPolicy.name\">\n" +
    "                                            <option value=\"\">disabled</option>\n" +
    "                                            <option value=\"always\">always</option>\n" +
    "                                            <option value=\"on-failure\">on-failure</option>\n" +
    "                                        </select>\n" +
    "                                        <label>MaximumRetryCount:</label>\n" +
    "                                        <input type=\"number\" ng-model=\"config.HostConfig.RestartPolicy.MaximumRetryCount\"/>\n" +
    "                                    </div>\n" +
    "                                </div>\n" +
    "                            </div>\n" +
    "                            <hr>\n" +
    "                            <div class=\"form-group\">\n" +
    "                                <label>ExtraHosts:</label>\n" +
    "                                <div ng-repeat=\"entry in config.HostConfig.ExtraHosts\">\n" +
    "                                    <div class=\"form-group form-inline\">\n" +
    "                                        <div class=\"form-group\">\n" +
    "                                            <label class=\"sr-only\">Hostname:</label>\n" +
    "                                            <input type=\"text\" ng-model=\"entry.host\" class=\"form-control\" placeholder=\"hostname\"/>\n" +
    "                                        </div>\n" +
    "                                        <div class=\"form-group\">\n" +
    "                                            <label class=\"sr-only\">IP Address:</label>\n" +
    "                                            <input type=\"text\" ng-model=\"entry.ip\" class=\"form-control\" placeholder=\"127.0.0.1\"/>\n" +
    "                                        </div>\n" +
    "                                        <div class=\"form-group\">\n" +
    "                                            <button class=\"btn btn-danger btn-xs form-control\" ng-click=\"rmEntry(config.HostConfig.ExtraHosts, entry)\">Remove</button>\n" +
    "                                        </div>\n" +
    "                                    </div>\n" +
    "                                </div>\n" +
    "                                <button type=\"button\" class=\"btn btn-success btn-sm\" ng-click=\"addEntry(config.HostConfig.ExtraHosts, {host: '', ip: ''})\">Add extra host</button>\n" +
    "                            </div>\n" +
    "                            <div class=\"form-group\">\n" +
    "                                <label>LxcConf:</label>\n" +
    "                                <div ng-repeat=\"entry in config.HostConfig.LxcConf\">\n" +
    "                                    <div class=\"form-group form-inline\">\n" +
    "                                        <div class=\"form-group\">\n" +
    "                                            <label class=\"sr-only\">Name:</label>\n" +
    "                                            <input type=\"text\" ng-model=\"entry.name\" class=\"form-control\" placeholder=\"lxc.utsname\"/>\n" +
    "                                        </div>\n" +
    "                                        <div class=\"form-group\">\n" +
    "                                            <label class=\"sr-only\">Value:</label>\n" +
    "                                            <input type=\"text\" ng-model=\"entry.value\" class=\"form-control\" placeholder=\"docker\"/>\n" +
    "                                        </div>\n" +
    "                                        <div class=\"form-group\">\n" +
    "                                            <button class=\"btn btn-danger btn-xs form-control\" ng-click=\"rmEntry(config.HostConfig.LxcConf, entry)\">Remove</button>\n" +
    "                                        </div>\n" +
    "                                    </div>\n" +
    "                                </div>\n" +
    "                                <button type=\"button\" class=\"btn btn-success btn-sm\" ng-click=\"addEntry(config.HostConfig.LxcConf, {name: '', value: ''})\">Add Entry</button>\n" +
    "                            </div>\n" +
    "                            <div class=\"form-group\">\n" +
    "                                <label>Devices:</label>\n" +
    "                                <div ng-repeat=\"device in config.HostConfig.Devices\">\n" +
    "                                    <div class=\"form-group form-inline inline-four\">\n" +
    "                                        <label class=\"sr-only\">PathOnHost:</label>\n" +
    "                                        <input type=\"text\" ng-model=\"device.PathOnHost\" class=\"form-control\" placeholder=\"PathOnHost\"/>\n" +
    "                                        <label class=\"sr-only\">PathInContainer:</label>\n" +
    "                                        <input type=\"text\" ng-model=\"device.PathInContainer\" class=\"form-control\" placeholder=\"PathInContainer\"/>\n" +
    "                                        <label class=\"sr-only\">CgroupPermissions:</label>\n" +
    "                                        <input type=\"text\" ng-model=\"device.CgroupPermissions\" class=\"form-control\" placeholder=\"CgroupPermissions\"/>\n" +
    "                                        <button class=\"btn btn-danger btn-xs form-control\" ng-click=\"rmEntry(config.HostConfig.Devices, device)\">Remove</button>\n" +
    "                                    </div>\n" +
    "                                </div>\n" +
    "                                <button type=\"button\" class=\"btn btn-success btn-sm\" ng-click=\"addEntry(config.HostConfig.Devices, { PathOnHost: '', PathInContainer: '', CgroupPermissions: ''})\">Add Device</button>\n" +
    "                            </div>\n" +
    "                            <div class=\"form-group\">\n" +
    "                                <label>PortBindings:</label>\n" +
    "                                <div ng-repeat=\"portBinding in config.HostConfig.PortBindings\">\n" +
    "                                    <div class=\"form-group form-inline inline-four\">\n" +
    "                                        <label class=\"sr-only\">Host IP:</label>\n" +
    "                                        <input type=\"text\" ng-model=\"portBinding.ip\" class=\"form-control\" placeholder=\"Host IP Address\"/>\n" +
    "                                        <label class=\"sr-only\">Host Port:</label>\n" +
    "                                        <input type=\"text\" ng-model=\"portBinding.extPort\" class=\"form-control\" placeholder=\"Host Port\"/>\n" +
    "                                        <label class=\"sr-only\">Container port:</label>\n" +
    "                                        <input type=\"text\" ng-model=\"portBinding.intPort\" class=\"form-control\" placeholder=\"Container Port\"/>\n" +
    "                                        <button class=\"btn btn-danger btn-xs form-control\" ng-click=\"rmEntry(config.HostConfig.PortBindings, portBinding)\">Remove</button>\n" +
    "                                    </div>\n" +
    "                                </div>\n" +
    "                                <button type=\"button\" class=\"btn btn-success btn-sm\" ng-click=\"addEntry(config.HostConfig.PortBindings, {ip: '', extPort: '', intPort: ''})\">Add Port Binding</button>\n" +
    "                            </div>\n" +
    "                        </fieldset>\n" +
    "                    </accordion-group>\n" +
    "                  </accordion>\n" +
    "                </form>\n" +
    "            </div>\n" +
    "            <div class=\"modal-footer\">\n" +
    "                <a href=\"\" class=\"btn btn-primary btn-lg\" ng-click=\"create()\">Create</a>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
}]);
