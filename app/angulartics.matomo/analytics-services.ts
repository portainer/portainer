import _ from 'lodash';

const categories = [
  'docker',
  'kubernetes',
  'aci',
  'portainer',
  'edge',
] as const;
type Category = typeof categories[number];

enum DimensionConfig {
  PortainerVersion = 1,
  PortainerInstanceID,
  PortainerUserRole,
  PortainerEndpointUserRole,
}

interface TrackEventProps {
  category: Category;
  metadata?: Record<string, unknown>;
  value?: string | number;
  dimensions?: DimensionConfig;
}

export function setPortainerStatus(instanceID: string, version: string) {
  setCustomDimension(DimensionConfig.PortainerInstanceID, instanceID);
  setCustomDimension(DimensionConfig.PortainerVersion, version);
}

export function setUserRole(role: string) {
  setCustomDimension(DimensionConfig.PortainerUserRole, role);
}

export function clearUserRole() {
  deleteCustomDimension(DimensionConfig.PortainerUserRole);
}

export function setUserEndpointRole(role: string) {
  setCustomDimension(DimensionConfig.PortainerEndpointUserRole, role);
}

export function clearUserEndpointRole() {
  deleteCustomDimension(DimensionConfig.PortainerEndpointUserRole);
}

function setCustomDimension(dimensionId: number, value: string) {
  push('setCustomDimension', dimensionId, value);
}

function deleteCustomDimension(dimensionId: number) {
  push('deleteCustomDimension', dimensionId.toString());
}

export function push(
  name: string,
  ...args: (string | number | DimensionConfig)[]
) {
  if (typeof window !== 'undefined') {
    window._paq.push([name, ...args]);
  }
}

export function trackEvent(action: string, properties: TrackEventProps) {
  /**
   * @description Logs an event with an event category (Videos, Music, Games...), an event
   * action (Play, Pause, Duration, Add Playlist, Downloaded, Clicked...), and an optional
   * event name and optional numeric value.
   *
   * @link https://piwik.org/docs/event-tracking/
   * @link https://developer.piwik.org/api-reference/tracking-javascript#using-the-tracker-object
   *
   */

  let { value } = properties;
  const { metadata, dimensions, category } = properties;
  // PAQ requires that eventValue be an integer, see: http://piwik.org/docs/event-tracking
  if (value) {
    const parsed = parseInt(value.toString(), 10);
    value = Number.isNaN(parsed) ? 0 : parsed;
  }

  if (!category) {
    throw new Error('missing category');
  }

  if (!categories.includes(category)) {
    throw new Error('unsupported category');
  }

  let metadataString = '';
  if (metadata) {
    const kebabCasedMetadata = Object.fromEntries(
      Object.entries(metadata).map(([key, value]) => [_.kebabCase(key), value])
    );
    metadataString = JSON.stringify(kebabCasedMetadata).toLowerCase();
  }

  push(
    'trackEvent',
    category,
    action.toLowerCase(),
    metadataString, // Changed in favour of Piwik documentation. Added fallback so it's backwards compatible.
    value || '',
    dimensions || <DimensionConfig>{}
  );
}

declare global {
  interface Window {
    _paq: [string, ...(string | number)[]][];
  }
}
