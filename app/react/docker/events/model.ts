import { EventMessage } from 'docker-types/generated/1.41';

type EventType = NonNullable<EventMessage['Type']>;
type Action = string;

type Attributes = {
  id: string;
  name: string;
  exitCode: string;
};

type EventToTemplateMap = Record<EventType, ActionToTemplateMap>;
type ActionToTemplateMap = Record<Action, TemplateBuilder>;
type TemplateBuilder = (attr: Attributes) => string;

/**
 * {
 *  [EventType]: {
 *    [Action]: TemplateBuilder,
 *    [Action]: TemplateBuilder
 *  },
 *  [EventType]: {
 *    [Action]: TemplateBuilder,
 *  }
 * }
 *
 * EventType are known and defined by Docker specs
 * Action are unknown and specific for each EventType
 */
const templates: EventToTemplateMap = {
  builder: {},
  config: {},
  container: {
    stop: ({ name }) => `Container ${name} stopped`,
    destroy: ({ name }) => `Container ${name} deleted`,
    create: ({ name }) => `Container ${name} created`,
    start: ({ name }) => `Container ${name} started`,
    kill: ({ name }) => `Container ${name} killed`,
    die: ({ name, exitCode }) =>
      `Container ${name} exited with status code ${exitCode}`,
    commit: ({ name }) => `Container ${name} committed`,
    restart: ({ name }) => `Container ${name} restarted`,
    pause: ({ name }) => `Container ${name} paused`,
    unpause: ({ name }) => `Container ${name} unpaused`,
    attach: ({ name }) => `Container ${name} attached`,
    detach: ({ name }) => `Container ${name} detached`,
    copy: ({ name }) => `Container ${name} copied`,
    export: ({ name }) => `Container ${name} exported`,
    health_status: ({ name }) => `Container ${name} executed health status`,
    oom: ({ name }) => `Container ${name} goes in out of memory`,
    rename: ({ name }) => `Container ${name} renamed`,
    resize: ({ name }) => `Container ${name} resized`,
    top: ({ name }) => `Showed running processes for container ${name}`,
    update: ({ name }) => `Container ${name} updated`,
    exec_create: () => `Exec instance created`,
    exec_start: () => `Exec instance started`,
    exec_die: () => `Exec instance exited`,
  },
  daemon: {},
  image: {
    delete: () => `Image deleted`,
    import: ({ id }) => `Image ${id} imported`,
    load: ({ id }) => `Image ${id} loaded`,
    tag: ({ name }) => `New tag created for ${name}`,
    untag: () => `Image untagged`,
    save: ({ id }) => `Image ${id} saved`,
    pull: ({ id }) => `Image ${id} pulled`,
    push: ({ id }) => `Image ${id} pushed`,
  },
  network: {
    create: ({ name }) => `Network ${name} created`,
    destroy: ({ name }) => `Network ${name} deleted`,
    remove: ({ name }) => `Network ${name} removed`,
    connect: ({ name }) => `Container connected to ${name} network`,
    disconnect: ({ name }) => `Container disconnected from ${name} network`,
    prune: () => `Networks pruned`,
  },
  node: {},
  plugin: {},
  secret: {},
  service: {},
  volume: {
    create: ({ id }) => `Volume ${id} created`,
    destroy: ({ id }) => `Volume ${id} deleted`,
    mount: ({ id }) => `Volume ${id} mounted`,
    unmount: ({ id }) => `Volume ${id} unmounted`,
  },
};

export function createEventDetails(event: EventMessage) {
  const eventType = event.Type ?? '';

  // An action can be `action:extra`
  // For example `docker exec -it CONTAINER sh`
  // Generates the action `exec_create: sh`
  let extra = '';
  let action = event.Action ?? '';
  const hasColon = action?.indexOf(':') ?? -1;
  if (hasColon !== -1) {
    extra = action?.substring(hasColon) ?? '';
    action = action?.substring(0, hasColon);
  }

  const attr: Attributes = {
    id: event.Actor?.ID || '',
    name: event.Actor?.Attributes?.name || '',
    exitCode: event.Actor?.Attributes?.exitCode || '',
  };

  // Event types are defined by the docker API specs
  // Each event has it own set of actions, which a unknown/not defined by specs
  // If the received event or action has no builder associated to it
  // We consider the event unsupported and we provide the raw data
  const detailsBuilder = templates[eventType as EventType]?.[action];
  const details = detailsBuilder
    ? detailsBuilder(attr)
    : `Unsupported event: ${eventType} / ${action}`;

  return details + extra;
}
