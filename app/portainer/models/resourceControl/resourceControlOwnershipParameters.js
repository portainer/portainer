/**
 * Transcient type from view data to payload
 * @param {bool} adminOnly is ResourceControl restricted to admin only
 * @param {bool} publicOnly is ResourceControl exposed to public
 * @param {[]int} users Authorized UserIDs array
 * @param {[]int} teams Authorized TeamIDs array
 * @param {[]int} subResources subResourceIDs array
 */
export function ResourceControlOwnershipParameters(adminOnly = false, publicOnly = false, users = [], teams = [], subResources = []) {
  this.AdministratorsOnly = adminOnly;
  this.Public = publicOnly;
  this.Users = users;
  this.Teams = teams;
  this.SubResourceIDs = subResources;
}
