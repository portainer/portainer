export default function AccessViewerPolicyModel(policy, endpoint, roles, group, team) {
  this.EndpointId = endpoint.Id;
  this.EndpointName = endpoint.Name;
  this.RoleId = policy.RoleId;
  this.RoleName = roles[policy.RoleId].Name;
  this.RolePriority = roles[policy.RoleId].Priority;
  if (group) {
    this.GroupId = group.Id;
    this.GroupName = group.Name;
  }
  if (team) {
    this.TeamId = team.Id;
    this.TeamName = team.Name;
  }
  this.AccessLocation = group ? 'environment group' : 'environment';
}
