export function RegistryViewModel(data) {
  this.Id = data.Id;
  this.Type = data.Type;
  this.Name = data.Name;
  this.URL = data.URL;
  this.Authentication = data.Authentication;
  this.Username = data.Username;
  this.Password = data.Password;
  this.AuthorizedUsers = data.AuthorizedUsers;
  this.AuthorizedTeams = data.AuthorizedTeams;
  this.UserAccessPolicies = data.UserAccessPolicies;
  this.TeamAccessPolicies = data.TeamAccessPolicies;
  this.Checked = false;
}

export function RegistryManagementConfigurationDefaultModel(registry) {
  this.Authentication = false;
  this.Password = '';
  this.TLS = false;
  this.TLSSkipVerify = false;
  this.TLSCACertFile = null;
  this.TLSCertFile = null;
  this.TLSKeyFile = null;

  if (registry.Type === 1 || registry.Type === 2 ) {
    this.Authentication = true;
    this.Username = registry.Username;
    this.TLS = true;
  }

  if (registry.Type === 3 && registry.Authentication) {
    this.Authentication = true;
    this.Username = registry.Username;
  }
}

export function RegistryDefaultModel() {
  this.Type = 3;
  this.URL = '';
  this.Name = '';
  this.Authentication = false;
  this.Username = '';
  this.Password = '';
}

export function RegistryCreateRequest(model) {
  this.Name = model.Name;
  this.Type = model.Type;
  this.URL = model.URL;
  this.Authentication = model.Authentication;
  if (model.Authentication) {
    this.Username = model.Username;
    this.Password = model.Password;
  }
}

// {
//   "id": 254761,
//   "description": "",
//   "name": "bugs",
//   "name_with_namespace": "epitest / bugs",
//   "path": "bugs",
//   "path_with_namespace": "epitest/bugs",
//   "created_at": "2015-04-30T12:51:49.767Z",
//   "default_branch": "master",
//   "tag_list": [],
//   "ssh_url_to_repo": "git@gitlab.com:epitest/bugs.git",
//   "http_url_to_repo": "https://gitlab.com/epitest/bugs.git",
//   "web_url": "https://gitlab.com/epitest/bugs",
//   "readme_url": "https://gitlab.com/epitest/bugs/blob/master/README.md",
//   "avatar_url": null,
//   "star_count": 4,
//   "forks_count": 0,
//   "last_activity_at": "2019-07-30T00:32:06.474Z",
//   "namespace": {
//     "id": 1564358,
//     "name": "epitest",
//     "path": "epitest",
//     "kind": "group",
//     "full_path": "epitest",
//     "parent_id": null,
//     "avatar_url": null,
//     "web_url": "https://gitlab.com/groups/epitest"
//   },
//   "_links": {
//     "self": "https://gitlab.com/api/v4/projects/254761",
//     "issues": "https://gitlab.com/api/v4/projects/254761/issues",
//     "merge_requests": "https://gitlab.com/api/v4/projects/254761/merge_requests",
//     "repo_branches": "https://gitlab.com/api/v4/projects/254761/repository/branches",
//     "labels": "https://gitlab.com/api/v4/projects/254761/labels",
//     "events": "https://gitlab.com/api/v4/projects/254761/events",
//     "members": "https://gitlab.com/api/v4/projects/254761/members"
//   },
//   "empty_repo": false,
//   "archived": true,
//   "visibility": "private",
//   "resolve_outdated_diff_discussions": null,
//   "container_registry_enabled": null,
//   "issues_enabled": true,
//   "merge_requests_enabled": true,
//   "wiki_enabled": true,
//   "jobs_enabled": false,
//   "snippets_enabled": false,
//   "issues_access_level": "enabled",
//   "repository_access_level": "enabled",
//   "merge_requests_access_level": "enabled",
//   "wiki_access_level": "enabled",
//   "builds_access_level": "disabled",
//   "snippets_access_level": "disabled",
//   "shared_runners_enabled": true,
//   "lfs_enabled": true,
//   "creator_id": 112007,
//   "import_status": "none",
//   "open_issues_count": 0,
//   "ci_default_git_depth": null,
//   "public_jobs": true,
//   "build_timeout": 3600,
//   "auto_cancel_pending_pipelines": "enabled",
//   "build_coverage_regex": null,
//   "ci_config_path": null,
//   "shared_with_groups": [
//     {
//       "group_id": 299185,
//       "group_name": "Epitech-Moulinette",
//       "group_full_path": "Epitech-Moulinette",
//       "group_access_level": 20,
//       "expires_at": null
//     }
//   ],
//   "only_allow_merge_if_pipeline_succeeds": false,
//   "request_access_enabled": true,
//   "only_allow_merge_if_all_discussions_are_resolved": null,
//   "printing_merge_request_link_enabled": true,
//   "merge_method": "merge",
//   "auto_devops_enabled": false,
//   "auto_devops_deploy_strategy": "continuous",
//   "permissions": {
//     "project_access": {
//       "access_level": 30,
//       "notification_level": 3
//     },
//     "group_access": null
//   },
//   "mirror": false,
//   "external_authorization_classification_label": ""
// }

export function RegistryGitlabProject(project) {
  this.Id = project.id;
  this.Description = project.description;
  this.Name = project.name;
  this.NameWithNamespace = project.name_with_namespace;
  this.Path = project.path;
  this.PathWithNamespace = project.path_with_namespace;
}