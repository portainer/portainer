// This model is based on https://github.com/moby/moby/blob/0ac25dfc751fa4304ab45afd5cd8705c2235d101/api/types/plugin.go#L8-L31
// instead of the official documentation.
// See: https://github.com/moby/moby/issues/34241
export function PluginViewModel(data) {
  this.Id = data.Id;
  this.Name = data.Name;
  this.Enabled = data.Enabled;
  this.Config = data.Config;
}
