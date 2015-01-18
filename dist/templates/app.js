angular.module('dockerui.templates', ['app/components/builder/builder.html', 'app/components/container/container.html', 'app/components/containerLogs/containerlogs.html', 'app/components/containers/containers.html', 'app/components/dashboard/dashboard.html', 'app/components/footer/statusbar.html', 'app/components/image/image.html', 'app/components/images/images.html', 'app/components/masthead/masthead.html', 'app/components/settings/settings.html', 'app/components/sidebar/sidebar.html', 'app/components/startContainer/startcontainer.html']);

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
    "    \n" +
    "    <h4>Container: {{ container.Name }}</h4>\n" +
    "\n" +
    "    <div class=\"btn-group detail\">\n" +
    "      <button class=\"btn btn-success\"\n" +
    "            ng-click=\"start()\"\n" +
    "            ng-show=\"!container.State.Running\">Start</button>\n" +
    "      <button class=\"btn btn-warning\"\n" +
    "            ng-click=\"stop()\"\n" +
    "            ng-show=\"container.State.Running && !container.State.Paused\">Stop</button>\n" +
    "      <button class=\"btn btn-danger\"\n" +
    "            ng-click=\"kill()\"\n" +
    "            ng-show=\"container.State.Running && !container.State.Paused\">Kill</button>\n" +
    "      <button class=\"btn btn-info\"\n" +
    "            ng-click=\"pause()\"\n" +
    "            ng-show=\"container.State.Running && !container.State.Paused\">Pause</button>\n" +
    "      <button class=\"btn btn-success\"\n" +
    "            ng-click=\"unpause()\"\n" +
    "            ng-show=\"container.State.Running && container.State.Paused\">Unpause</button>\n" +
    "    </div>\n" +
    "\n" +
    "    <table class=\"table table-striped\">\n" +
    "         <tbody>\n" +
    "            <tr>\n" +
    "                <td>Created:</td>\n" +
    "                <td>{{ container.Created }}</td>\n" +
    "            </tr>\n" +
    "            <tr>\n" +
    "                <td>Path:</td>\n" +
    "                <td>{{ container.Path }}</td>\n" +
    "            </tr>\n" +
    "            <tr>\n" +
    "                <td>Args:</td>\n" +
    "                <td>{{ container.Args }}</td>\n" +
    "            </tr>\n" +
    "            <tr>\n" +
    "                <td>Exposed Ports:</td>\n" +
    "                <td>\n" +
    "                    <ul>\n" +
    "                        <li ng-repeat=\"(k, v) in container.Config.ExposedPorts\">{{ k }}</li>\n" +
    "                    </ul>\n" +
    "                </td>\n" +
    "            </tr>\n" +
    "            <tr>\n" +
    "                <td>Environment:</td>\n" +
    "                <td>\n" +
    "                    <ul>\n" +
    "                        <li ng-repeat=\"k in container.Config.Env\">{{ k }}</li>\n" +
    "                    </ul>\n" +
    "                </td>\n" +
    "            </tr>\n" +
    "\n" +
    "            <tr>\n" +
    "                <td>Publish All:</td>\n" +
    "                <td>{{ container.HostConfig.PublishAllPorts }}</td>\n" +
    "            </tr>\n" +
    "            <tr>\n" +
    "                <td>Ports:</td>\n" +
    "                <td>\n" +
    "                    <ul style=\"display:inline-table\">\n" +
    "                        <li ng-repeat=\"(containerport, hostports) in container.HostConfig.PortBindings\">\n" +
    "                            {{ containerport }} => <span class=\"label\" ng-repeat=\"(k,v) in hostports\">{{ v.HostIp }}:{{ v.HostPort }}</span>\n" +
    "                        </li>\n" +
    "                    </ul>\n" +
    "                </td>\n" +
    "\n" +
    "            </tr>\n" +
    "            <tr>\n" +
    "                <td>Hostname:</td>\n" +
    "                <td>{{ container.Config.Hostname }}</td>\n" +
    "            </tr>\n" +
    "            <tr>\n" +
    "                <td>IPAddress:</td>\n" +
    "                <td>{{ container.NetworkSettings.IPAddress }}</td>\n" +
    "            </tr>\n" +
    "            <tr>\n" +
    "                <td>Cmd:</td>\n" +
    "                <td>{{ container.Config.Cmd }}</td>\n" +
    "            </tr>\n" +
    "            <tr>\n" +
    "                <td>Entrypoint:</td>\n" +
    "                <td>{{ container.Config.Entrypoint }}</td>\n" +
    "            </tr>\n" +
    "            <tr>\n" +
    "                <td>Volumes:</td>\n" +
    "                <td>{{ container.Volumes }}</td>\n" +
    "            </tr>\n" +
    "\n" +
    "            <tr>\n" +
    "                <td>SysInitpath:</td>\n" +
    "                <td>{{ container.SysInitPath }}</td>\n" +
    "            </tr>\n" +
    "            <tr>\n" +
    "                <td>Image:</td>\n" +
    "                <td><a href=\"#/images/{{ container.Image }}/\">{{ container.Image }}</a></td>\n" +
    "            </tr>\n" +
    "            <tr>\n" +
    "                <td>State:</td>\n" +
    "                <td><span class=\"label {{ container.State|getstatelabel }}\">{{ container.State|getstatetext }}</span></td>\n" +
    "            </tr>\n" +
    "            <tr>\n" +
    "                 <td>Logs:</td>\n" +
    "                 <td><a href=\"#/containers/{{ container.Id }}/logs\">stdout/stderr</a></td>\n" +
    "            </tr>\n" +
    "        </tbody>\n" +
    "    </table>\n" +
    "    \n" +
    "    <div class=\"row-fluid\">\n" +
    "        <div class=\"span1\">\n" +
    "            Changes:\n" +
    "        </div>\n" +
    "        <div class=\"span5\">\n" +
    "            <i class=\"icon-refresh\" style=\"width:32px;height:32px;\" ng-click=\"getChanges()\"></i>\n" +
    "        </div>\n" +
    "    </div> \n" +
    "\n" +
    "    <div class=\"well well-large\">\n" +
    "        <ul>\n" +
    "            <li ng-repeat=\"change in changes | filter:hasContent\">\n" +
    "                <strong>{{ change.Path }}</strong> {{ change.Kind }}\n" +
    "            </li>\n" +
    "        </ul>\n" +
    "    </div>\n" +
    "\n" +
    "    <hr />\n" +
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
    "        <div class=\"pull-right\">\n" +
    "            <input id=\"timestampToggle\" type=\"checkbox\" ng-model=\"showTimestamps\" \n" +
    "                ng-change=\"toggleTimestamps()\"/> <label for=\"timestampToggle\">Display Timestamps</label>\n" +
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
    "                <li><a tabindex=\"-1\" href=\"\" ng-click=\"killAction()\">Kill</a></li>\n" +
    "                <li><a tabindex=\"-1\" href=\"\" ng-click=\"pauseAction()\">Pause</a></li>\n" +
    "                <li><a tabindex=\"-1\" href=\"\" ng-click=\"unpauseAction()\">Unpause</a></li>\n" +
    "                <li><a tabindex=\"-1\" href=\"\" ng-click=\"removeAction()\">Remove</a></li>\n" +
    "            </ul>\n" +
    "        </li>\n" +
    "    </ul>\n" +
    "\n" +
    "    <div class=\"pull-right\">\n" +
    "        <input type=\"checkbox\" ng-model=\"displayAll\" \n" +
    "            ng-change=\"toggleGetAll()\"/> Display All\n" +
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
    "                    Get a better browser... Your holding everyone back.\n" +
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
    "                Get a better browser... You're holding everyone back.\n" +
    "           </canvas>\n" +
    "            <h4>Images created</h4>\n" +
    "           <canvas id=\"images-created-chart\" width=\"700\">\n" +
    "                Get a better browser... You're holding everyone back.\n" +
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
    "                Get a better broswer... Your holding everyone back.\n" +
    "       </canvas>\n" +
    "    </div>\n" +
    "\n" +
    "    <table class=\"table table-striped\">\n" +
    "         <tbody>\n" +
    "            <tr>\n" +
    "                <td>Created:</td>\n" +
    "                <td>{{ image.created }}</td>\n" +
    "            </tr>\n" +
    "            <tr>\n" +
    "                <td>Parent:</td>\n" +
    "                <td><a href=\"#/images/{{ image.parent }}/\">{{ image.parent }}</a></td>\n" +
    "            </tr>\n" +
    "            <tr>\n" +
    "                <td>Size:</td>\n" +
    "                <td>{{ image.Size|humansize }}</td>\n" +
    "            </tr>\n" +
    "\n" +
    "            <tr>\n" +
    "                <td>Hostname:</td>\n" +
    "                <td>{{ image.container_config.Hostname }}</td>\n" +
    "            </tr>\n" +
    "            <tr>\n" +
    "                <td>User:</td>\n" +
    "                <td>{{ image.container_config.User }}</td>\n" +
    "            </tr>\n" +
    "            <tr>\n" +
    "                <td>Cmd:</td>\n" +
    "                <td>{{ image.container_config.Cmd }}</td>\n" +
    "            </tr>\n" +
    "            <tr>\n" +
    "                <td>Volumes:</td>\n" +
    "                <td>{{ image.container_config.Volumes }}</td>\n" +
    "            </tr>\n" +
    "            <tr>\n" +
    "                <td>Volumes from:</td>\n" +
    "                <td>{{ image.container_config.VolumesFrom }}</td>\n" +
    "            </tr>\n" +
    "            <tr>\n" +
    "                <td>Comment:</td>\n" +
    "                <td>{{ image.comment }}</td>\n" +
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

angular.module("app/components/masthead/masthead.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("app/components/masthead/masthead.html",
    "  <div class=\"masthead\">\n" +
    "    <h3 class=\"text-muted\">DockerUI</h3>\n" +
    "      <ul class=\"nav well\">\n" +
    "        <li><a href=\"#\">Dashboard</a></li>\n" +
    "        <li><a href=\"#/containers/\">Containers</a></li>\n" +
    "        <li><a href=\"#/images/\">Images</a></li>\n" +
    "        <li><a href=\"#/settings/\">Settings</a></li>\n" +
    "      </ul>\n" +
    "  </div>\n" +
    "");
}]);

angular.module("app/components/settings/settings.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("app/components/settings/settings.html",
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
    "                <td>NFd:</td>\n" +
    "                <td>{{ info.NFd }}</td>\n" +
    "            </tr>\n" +
    "            <tr>\n" +
    "                <td>NGoroutines:</td>\n" +
    "                <td>{{ info.NGoroutines }}</td>\n" +
    "            </tr>\n" +
    "            <tr>\n" +
    "                <td>MemoryLimit:</td>\n" +
    "                <td>{{ info.MemoryLimit }}</td>\n" +
    "            </tr>\n" +
    "            <tr>\n" +
    "                <td>SwapLimit:</td>\n" +
    "                <td>{{ info.SwapLimit }}</td>\n" +
    "            </tr>\n" +
    "            <tr>\n" +
    "                <td>NFd:</td>\n" +
    "                <td>{{ info.NFd }}</td>\n" +
    "            </tr>\n" +
    "        </tbody>\n" +
    "    </table>\n" +
    "</div>\n" +
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
    "                <form role=\"form\">\n" +
    "                        <fieldset>\n" +
    "                                <div class=\"form-group\">\n" +
    "                                    <label>Cmd:</label>\n" +
    "                                    <input type=\"text\" placeholder=\"{{ commandPlaceholder }}\" ng-model=\"config.commands\" class=\"form-control\"/>\n" +
    "                                    <small>Input commands as an array</small>\n" +
    "                                </div>\n" +
    "                                <div class=\"form-group\">\n" +
    "                                    <label>Name:</label>\n" +
    "                                    <input type=\"text\" ng-model=\"config.name\" class=\"form-control\"/>\n" +
    "                                </div>\n" +
    "                                <div class=\"form-group\">\n" +
    "                                    <label>Memory:</label>\n" +
    "                                    <input type=\"number\" ng-model=\"config.memory\" class=\"form-control\"/>\n" +
    "                                </div>\n" +
    "                                <div class=\"form-group\">\n" +
    "                                    <label>Memory Swap:</label>\n" +
    "                                    <input type=\"number\" ng-model=\"config.memorySwap\" class=\"form-control\"/>\n" +
    "                                </div>\n" +
    "                                <div class=\"form-group\">\n" +
    "                                    <label>CPU Shares:</label>\n" +
    "                                    <input type=\"number\" ng-model=\"config.cpuShares\" class=\"form-control\"/>\n" +
    "                                </div>\n" +
    "                                <div class=\"form-group\">\n" +
    "                                    <label>Volumes From:</label>\n" +
    "                                    <input type=\"text\" ng-model=\"config.volumesFrom\" class=\"form-control\"/>\n" +
    "                                </div>\n" +
    "                        </fieldset>\n" +
    "                </form>\n" +
    "            </div>\n" +
    "            <div class=\"modal-footer\">\n" +
    "                <a href=\"\" class=\"btn btn-primary\" ng-click=\"create()\">Create</a>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
}]);
