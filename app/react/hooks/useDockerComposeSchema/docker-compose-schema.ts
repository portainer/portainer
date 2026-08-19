// based on https://github.com/compose-spec/compose-spec/blob/master/schema/compose-spec.json
// with added descriptions from https://github.com/microsoft/compose-language-service/blob/7a74283ddb866988fed86241f461a657f0aee6d0/src/service/providers/KeyHoverProvider.ts#L57-L184
// hopefully https://github.com/compose-spec/compose-spec/pull/581 will apply these same changes
export const dockerComposeSchema = {
  $schema: 'https://json-schema.org/draft-07/schema',
  $id: 'compose_spec.json',
  type: 'object',
  title: 'Compose Specification',
  description:
    'The Compose file is a YAML file defining a multi-containers based application.',

  properties: {
    version: {
      type: 'string',
      description:
        'The version of the Docker Compose document. Declared for backward compatibility, ignored in recent versions.',
    },

    name: {
      type: 'string',
      description:
        'Define the Compose project name, until user defines one explicitly.',
    },

    include: {
      type: 'array',
      items: {
        $ref: '#/definitions/include',
      },
      description: 'Compose sub-projects to be included.',
    },

    services: {
      type: 'object',
      description: 'The services in your project.',
      patternProperties: {
        '^[a-zA-Z0-9._-]+$': {
          $ref: '#/definitions/service',
        },
      },
      additionalProperties: false,
    },

    networks: {
      type: 'object',
      description: 'Networks that are shared among multiple services.',
      patternProperties: {
        '^[a-zA-Z0-9._-]+$': {
          $ref: '#/definitions/network',
        },
      },
    },

    volumes: {
      type: 'object',
      description: 'Named volumes that are shared among multiple services.',
      patternProperties: {
        '^[a-zA-Z0-9._-]+$': {
          $ref: '#/definitions/volume',
        },
      },
      additionalProperties: false,
    },

    secrets: {
      type: 'object',
      description: 'Secrets that are shared among multiple services.',
      patternProperties: {
        '^[a-zA-Z0-9._-]+$': {
          $ref: '#/definitions/secret',
        },
      },
      additionalProperties: false,
    },

    configs: {
      type: 'object',
      description: 'Configurations for services in the project.',
      patternProperties: {
        '^[a-zA-Z0-9._-]+$': {
          $ref: '#/definitions/config',
        },
      },
      additionalProperties: false,
    },
  },

  patternProperties: { '^x-': {} },
  additionalProperties: false,

  definitions: {
    service: {
      type: 'object',

      properties: {
        develop: { $ref: '#/definitions/development' },
        deploy: { $ref: '#/definitions/deployment' },
        annotations: { $ref: '#/definitions/list_or_dict' },
        attach: { type: ['boolean', 'string'] },
        build: {
          oneOf: [
            { type: 'string' },
            {
              type: 'object',
              description: 'The context used for building the image.',
              properties: {
                context: {
                  type: 'string',
                  description: 'The context used for building the image.',
                },
                dockerfile: {
                  type: 'string',
                  description: 'The Dockerfile used for building the image.',
                },
                dockerfile_inline: { type: 'string' },
                entitlements: { type: 'array', items: { type: 'string' } },
                args: {
                  $ref: '#/definitions/list_or_dict',
                  description: 'Arguments used during the image build process.',
                },
                ssh: { $ref: '#/definitions/list_or_dict' },
                labels: { $ref: '#/definitions/list_or_dict' },
                cache_from: { type: 'array', items: { type: 'string' } },
                cache_to: { type: 'array', items: { type: 'string' } },
                no_cache: { type: ['boolean', 'string'] },
                additional_contexts: { $ref: '#/definitions/list_or_dict' },
                network: { type: 'string' },
                pull: { type: ['boolean', 'string'] },
                target: { type: 'string' },
                shm_size: { type: ['integer', 'string'] },
                extra_hosts: { $ref: '#/definitions/extra_hosts' },
                isolation: { type: 'string' },
                privileged: { type: ['boolean', 'string'] },
                secrets: { $ref: '#/definitions/service_config_or_secret' },
                tags: { type: 'array', items: { type: 'string' } },
                ulimits: { $ref: '#/definitions/ulimits' },
                platforms: { type: 'array', items: { type: 'string' } },
              },
              additionalProperties: false,
              patternProperties: { '^x-': {} },
            },
          ],
        },
        blkio_config: {
          type: 'object',
          properties: {
            device_read_bps: {
              type: 'array',
              items: { $ref: '#/definitions/blkio_limit' },
            },
            device_read_iops: {
              type: 'array',
              items: { $ref: '#/definitions/blkio_limit' },
            },
            device_write_bps: {
              type: 'array',
              items: { $ref: '#/definitions/blkio_limit' },
            },
            device_write_iops: {
              type: 'array',
              items: { $ref: '#/definitions/blkio_limit' },
            },
            weight: { type: ['integer', 'string'] },
            weight_device: {
              type: 'array',
              items: { $ref: '#/definitions/blkio_weight' },
            },
          },
          additionalProperties: false,
        },
        cap_add: {
          type: 'array',
          items: { type: 'string' },
          uniqueItems: true,
        },
        cap_drop: {
          type: 'array',
          items: { type: 'string' },
          uniqueItems: true,
        },
        cgroup: { type: 'string', enum: ['host', 'private'] },
        cgroup_parent: { type: 'string' },
        command: {
          $ref: '#/definitions/command',
          description: 'The command that will be run in the container.',
        },
        configs: {
          $ref: '#/definitions/service_config_or_secret',
          description: 'Configurations the service will have access to.',
        },
        container_name: {
          type: 'string',
          description: 'The name that will be given to the container.',
        },
        cpu_count: {
          oneOf: [{ type: 'string' }, { type: 'integer', minimum: 0 }],
        },
        cpu_percent: {
          oneOf: [
            { type: 'string' },
            { type: 'integer', minimum: 0, maximum: 100 },
          ],
        },
        cpu_shares: { type: ['number', 'string'] },
        cpu_quota: { type: ['number', 'string'] },
        cpu_period: { type: ['number', 'string'] },
        cpu_rt_period: { type: ['number', 'string'] },
        cpu_rt_runtime: { type: ['number', 'string'] },
        cpus: { type: ['number', 'string'] },
        cpuset: { type: 'string' },
        credential_spec: {
          type: 'object',
          properties: {
            config: { type: 'string' },
            file: { type: 'string' },
            registry: { type: 'string' },
          },
          additionalProperties: false,
          patternProperties: { '^x-': {} },
        },
        depends_on: {
          oneOf: [
            { $ref: '#/definitions/list_of_strings' },
            {
              type: 'object',
              additionalProperties: false,
              patternProperties: {
                '^[a-zA-Z0-9._-]+$': {
                  type: 'object',
                  additionalProperties: false,
                  patternProperties: { '^x-': {} },
                  properties: {
                    restart: { type: ['boolean', 'string'] },
                    required: {
                      type: 'boolean',
                      default: true,
                    },
                    condition: {
                      type: 'string',
                      enum: [
                        'service_started',
                        'service_healthy',
                        'service_completed_successfully',
                      ],
                    },
                  },
                  required: ['condition'],
                },
              },
            },
          ],
          description:
            'Other services that this service depends on, which will be started before this one.',
        },
        device_cgroup_rules: { $ref: '#/definitions/list_of_strings' },
        devices: {
          type: 'array',
          items: {
            oneOf: [
              { type: 'string' },
              {
                type: 'object',
                required: ['source'],
                properties: {
                  source: { type: 'string' },
                  target: { type: 'string' },
                  permissions: { type: 'string' },
                },
                additionalProperties: false,
                patternProperties: { '^x-': {} },
              },
            ],
          },
        },
        dns: { $ref: '#/definitions/string_or_list' },
        dns_opt: {
          type: 'array',
          items: { type: 'string' },
          uniqueItems: true,
        },
        dns_search: { $ref: '#/definitions/string_or_list' },
        domainname: { type: 'string' },
        entrypoint: {
          $ref: '#/definitions/command',
          description: 'The entrypoint to the application in the container.',
        },
        env_file: {
          $ref: '#/definitions/env_file',
          description:
            'Files containing environment variables that will be included.',
        },
        label_file: { $ref: '#/definitions/label_file' },
        environment: {
          $ref: '#/definitions/list_or_dict',
          description: 'Environment variables that will be included.',
        },

        expose: {
          type: 'array',
          items: {
            type: ['string', 'number'],
          },
          uniqueItems: true,
          description:
            'Ports exposed to the other services but not to the host machine.',
        },
        extends: {
          oneOf: [
            { type: 'string' },
            {
              type: 'object',

              properties: {
                service: { type: 'string' },
                file: { type: 'string' },
              },
              required: ['service'],
              additionalProperties: false,
            },
          ],
        },
        external_links: {
          type: 'array',
          items: { type: 'string' },
          uniqueItems: true,
        },
        extra_hosts: { $ref: '#/definitions/extra_hosts' },
        gpus: { $ref: '#/definitions/gpus' },
        group_add: {
          type: 'array',
          items: {
            type: ['string', 'number'],
          },
          uniqueItems: true,
        },
        healthcheck: {
          $ref: '#/definitions/healthcheck',
          description: 'A command for checking if the container is healthy.',
        },
        hostname: { type: 'string' },
        image: {
          type: 'string',
          description:
            'The image that will be pulled for the service. If `build` is specified, the built image will be given this tag.',
        },
        init: { type: ['boolean', 'string'] },
        ipc: { type: 'string' },
        isolation: { type: 'string' },
        labels: {
          $ref: '#/definitions/list_or_dict',
          description: 'Labels that will be given to the container.',
        },
        links: { type: 'array', items: { type: 'string' }, uniqueItems: true },
        logging: {
          type: 'object',
          description: 'Settings for logging for this service.',
          properties: {
            driver: { type: 'string' },
            options: {
              type: 'object',
              patternProperties: {
                '^.+$': { type: ['string', 'number', 'null'] },
              },
            },
          },
          additionalProperties: false,
          patternProperties: { '^x-': {} },
        },
        mac_address: { type: 'string' },
        mem_limit: { type: ['number', 'string'] },
        mem_reservation: { type: ['string', 'integer'] },
        mem_swappiness: { type: ['integer', 'string'] },
        memswap_limit: { type: ['number', 'string'] },
        network_mode: { type: 'string' },
        networks: {
          oneOf: [
            { $ref: '#/definitions/list_of_strings' },
            {
              type: 'object',
              properties: {},
              patternProperties: {
                '^[a-zA-Z0-9._-]+$': {
                  oneOf: [
                    { type: 'null' },
                    {
                      type: 'object',
                      properties: {
                        aliases: { $ref: '#/definitions/list_of_strings' },
                        ipv4_address: { type: 'string' },
                        ipv6_address: { type: 'string' },
                        link_local_ips: {
                          $ref: '#/definitions/list_of_strings',
                        },
                        priority: { type: ['number', 'string'] },
                      },
                      additionalProperties: false,
                      patternProperties: { '^x-': {} },
                    },
                  ],
                },
              },
              additionalProperties: false,
            },
          ],
          description:
            'The service will be included in these networks, allowing it to reach other containers on the same network.',
        },
        oom_kill_disable: { type: ['boolean', 'string'] },
        oom_score_adj: {
          oneOf: [
            { type: 'string' },
            { type: 'integer', minimum: -1000, maximum: 1000 },
          ],
        },
        pid: { type: ['string', 'null'] },
        pids_limit: { type: ['number', 'string'] },
        platform: { type: 'string' },
        ports: {
          type: 'array',
          items: {
            oneOf: [
              { type: ['number', 'string'] },
              {
                type: 'object',
                properties: {
                  mode: { type: 'string' },
                  host_ip: { type: 'string' },
                  target: { type: ['number', 'string'] },
                  published: { type: ['number', 'string'] },
                  protocol: { type: 'string' },
                },
                additionalProperties: false,
                patternProperties: { '^x-': {} },
              },
            ],
          },
          uniqueItems: true,
          description: 'Ports that will be exposed to the host.',
        },
        post_start: {
          type: 'array',
          items: { $ref: '#/definitions/service_hook' },
        },
        pre_stop: {
          type: 'array',
          items: { $ref: '#/definitions/service_hook' },
        },
        privileged: { type: ['boolean', 'string'] },
        profiles: {
          type: 'array',
          items: { type: 'string' },
          uniqueItems: true,
          description:
            'Profiles that this service is a part of. When the profile is started, this service will be started.',
        },
        pull_policy: {
          type: 'string',
          pattern:
            'always|never|build|if_not_present|missing|refresh|daily|weekly|every_([0-9]+[wdhms])+',
        },
        pull_refresh_after: { type: 'string' },
        read_only: { type: ['boolean', 'string'] },
        restart: { type: 'string' },
        runtime: {
          type: 'string',
        },
        scale: {
          type: ['integer', 'string'],
        },
        security_opt: {
          type: 'array',
          items: { type: 'string' },
          uniqueItems: true,
        },
        shm_size: { type: ['number', 'string'] },
        secrets: {
          $ref: '#/definitions/service_config_or_secret',
          description: 'Secrets the service will have access to.',
        },
        sysctls: { $ref: '#/definitions/list_or_dict' },
        stdin_open: { type: ['boolean', 'string'] },
        stop_grace_period: { type: 'string' },
        stop_signal: { type: 'string' },
        storage_opt: { type: 'object' },
        tmpfs: { $ref: '#/definitions/string_or_list' },
        tty: { type: ['boolean', 'string'] },
        ulimits: { $ref: '#/definitions/ulimits' },
        user: {
          type: 'string',
          description:
            'The username under which the app in the container will be started.',
        },
        uts: { type: 'string' },
        userns_mode: { type: 'string' },
        volumes: {
          type: 'array',
          items: {
            oneOf: [
              { type: 'string' },
              {
                type: 'object',
                required: ['type'],
                properties: {
                  type: { type: 'string' },
                  source: { type: 'string' },
                  target: { type: 'string' },
                  read_only: { type: ['boolean', 'string'] },
                  consistency: { type: 'string' },
                  bind: {
                    type: 'object',
                    properties: {
                      propagation: { type: 'string' },
                      create_host_path: { type: ['boolean', 'string'] },
                      selinux: { type: 'string', enum: ['z', 'Z'] },
                    },
                    additionalProperties: false,
                    patternProperties: { '^x-': {} },
                  },
                  volume: {
                    type: 'object',
                    properties: {
                      nocopy: { type: ['boolean', 'string'] },
                    },
                    additionalProperties: false,
                    patternProperties: { '^x-': {} },
                  },
                  tmpfs: {
                    type: 'object',
                    properties: {
                      size: { type: ['number', 'string'] },
                      mode: { type: ['number', 'string'] },
                    },
                    additionalProperties: false,
                    patternProperties: { '^x-': {} },
                  },
                },
                additionalProperties: false,
                patternProperties: { '^x-': {} },
              },
            ],
          },
          uniqueItems: true,
          description:
            'Named volumes and paths on the host mapped to paths in the container.',
        },
        volumes_from: {
          type: 'array',
          items: { type: 'string' },
          uniqueItems: true,
        },
        working_dir: {
          type: 'string',
          description:
            'The working directory in which the entrypoint or command will be run.',
        },
      },
      patternProperties: { '^x-': {} },
      additionalProperties: false,
    },

    healthcheck: {
      type: 'object',
      properties: {
        disable: { type: ['boolean', 'string'] },
        interval: { type: 'string' },
        retries: { type: ['number', 'string'] },
        test: {
          oneOf: [
            { type: 'string' },
            { type: 'array', items: { type: 'string' } },
          ],
        },
        timeout: { type: 'string' },
        start_period: { type: 'string' },
        start_interval: { type: 'string' },
      },
      additionalProperties: false,
      patternProperties: { '^x-': {} },
    },
    development: {
      type: ['object', 'null'],
      properties: {
        watch: {
          type: 'array',
          items: {
            type: 'object',
            required: ['path', 'action'],
            properties: {
              ignore: { $ref: '#/definitions/string_or_list' },
              include: { $ref: '#/definitions/string_or_list' },
              path: { type: 'string' },
              action: {
                type: 'string',
                enum: [
                  'rebuild',
                  'sync',
                  'restart',
                  'sync+restart',
                  'sync+exec',
                ],
              },
              target: { type: 'string' },
              exec: { $ref: '#/definitions/service_hook' },
            },
            additionalProperties: false,
            patternProperties: { '^x-': {} },
          },
        },
      },
      additionalProperties: false,
      patternProperties: { '^x-': {} },
    },
    deployment: {
      type: ['object', 'null'],
      properties: {
        mode: { type: 'string' },
        endpoint_mode: { type: 'string' },
        replicas: { type: ['integer', 'string'] },
        labels: { $ref: '#/definitions/list_or_dict' },
        rollback_config: {
          type: 'object',
          properties: {
            parallelism: { type: ['integer', 'string'] },
            delay: { type: 'string' },
            failure_action: { type: 'string' },
            monitor: { type: 'string' },
            max_failure_ratio: { type: ['number', 'string'] },
            order: { type: 'string', enum: ['start-first', 'stop-first'] },
          },
          additionalProperties: false,
          patternProperties: { '^x-': {} },
        },
        update_config: {
          type: 'object',
          properties: {
            parallelism: { type: ['integer', 'string'] },
            delay: { type: 'string' },
            failure_action: { type: 'string' },
            monitor: { type: 'string' },
            max_failure_ratio: { type: ['number', 'string'] },
            order: { type: 'string', enum: ['start-first', 'stop-first'] },
          },
          additionalProperties: false,
          patternProperties: { '^x-': {} },
        },
        resources: {
          type: 'object',
          properties: {
            limits: {
              type: 'object',
              properties: {
                cpus: { type: ['number', 'string'] },
                memory: { type: 'string' },
                pids: { type: ['integer', 'string'] },
              },
              additionalProperties: false,
              patternProperties: { '^x-': {} },
            },
            reservations: {
              type: 'object',
              properties: {
                cpus: { type: ['number', 'string'] },
                memory: { type: 'string' },
                generic_resources: { $ref: '#/definitions/generic_resources' },
                devices: { $ref: '#/definitions/devices' },
              },
              additionalProperties: false,
              patternProperties: { '^x-': {} },
            },
          },
          additionalProperties: false,
          patternProperties: { '^x-': {} },
        },
        restart_policy: {
          type: 'object',
          properties: {
            condition: { type: 'string' },
            delay: { type: 'string' },
            max_attempts: { type: ['integer', 'string'] },
            window: { type: 'string' },
          },
          additionalProperties: false,
          patternProperties: { '^x-': {} },
        },
        placement: {
          type: 'object',
          properties: {
            constraints: { type: 'array', items: { type: 'string' } },
            preferences: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  spread: { type: 'string' },
                },
                additionalProperties: false,
                patternProperties: { '^x-': {} },
              },
            },
            max_replicas_per_node: { type: ['integer', 'string'] },
          },
          additionalProperties: false,
          patternProperties: { '^x-': {} },
        },
      },
      additionalProperties: false,
      patternProperties: { '^x-': {} },
    },

    generic_resources: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          discrete_resource_spec: {
            type: 'object',
            properties: {
              kind: { type: 'string' },
              value: { type: ['number', 'string'] },
            },
            additionalProperties: false,
            patternProperties: { '^x-': {} },
          },
        },
        additionalProperties: false,
        patternProperties: { '^x-': {} },
      },
    },

    devices: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          capabilities: { $ref: '#/definitions/list_of_strings' },
          count: { type: ['string', 'integer'] },
          device_ids: { $ref: '#/definitions/list_of_strings' },
          driver: { type: 'string' },
          options: { $ref: '#/definitions/list_or_dict' },
        },
        additionalProperties: false,
        patternProperties: { '^x-': {} },
        required: ['capabilities'],
      },
    },

    gpus: {
      oneOf: [
        { type: 'string', enum: ['all'] },
        {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              capabilities: { $ref: '#/definitions/list_of_strings' },
              count: { type: ['string', 'integer'] },
              device_ids: { $ref: '#/definitions/list_of_strings' },
              driver: { type: 'string' },
              options: { $ref: '#/definitions/list_or_dict' },
            },
          },
          additionalProperties: false,
          patternProperties: { '^x-': {} },
        },
      ],
    },

    include: {
      oneOf: [
        { type: 'string' },
        {
          type: 'object',
          properties: {
            path: { $ref: '#/definitions/string_or_list' },
            env_file: { $ref: '#/definitions/string_or_list' },
            project_directory: { type: 'string' },
          },
          additionalProperties: false,
        },
      ],
    },

    network: {
      type: ['object', 'null'],
      properties: {
        name: { type: 'string' },
        driver: {
          type: 'string',
          description: 'The driver used for this network.',
        },
        driver_opts: {
          type: 'object',
          patternProperties: {
            '^.+$': { type: ['string', 'number'] },
          },
        },
        ipam: {
          type: 'object',
          properties: {
            driver: { type: 'string' },
            config: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  subnet: { type: 'string' },
                  ip_range: { type: 'string' },
                  gateway: { type: 'string' },
                  aux_addresses: {
                    type: 'object',
                    additionalProperties: false,
                    patternProperties: { '^.+$': { type: 'string' } },
                  },
                },
                additionalProperties: false,
                patternProperties: { '^x-': {} },
              },
            },
            options: {
              type: 'object',
              additionalProperties: false,
              patternProperties: { '^.+$': { type: 'string' } },
            },
          },
          additionalProperties: false,
          patternProperties: { '^x-': {} },
        },
        external: {
          type: ['boolean', 'string', 'object'],
          properties: {
            name: {
              deprecated: true,
              type: 'string',
            },
          },
          additionalProperties: false,
          patternProperties: { '^x-': {} },
        },
        internal: { type: ['boolean', 'string'] },
        enable_ipv4: { type: ['boolean', 'string'] },
        enable_ipv6: { type: ['boolean', 'string'] },
        attachable: { type: ['boolean', 'string'] },
        labels: { $ref: '#/definitions/list_or_dict' },
      },
      additionalProperties: false,
      patternProperties: { '^x-': {} },
    },

    volume: {
      type: ['object', 'null'],
      properties: {
        name: { type: 'string' },
        driver: {
          type: 'string',
          description: 'The driver used for this volume.',
        },
        driver_opts: {
          type: 'object',
          patternProperties: {
            '^.+$': { type: ['string', 'number'] },
          },
        },
        external: {
          type: ['boolean', 'string', 'object'],
          properties: {
            name: {
              deprecated: true,
              type: 'string',
            },
          },
          additionalProperties: false,
          patternProperties: { '^x-': {} },
        },
        labels: { $ref: '#/definitions/list_or_dict' },
      },
      additionalProperties: false,
      patternProperties: { '^x-': {} },
    },

    secret: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        environment: { type: 'string' },
        file: { type: 'string' },
        external: {
          type: ['boolean', 'string', 'object'],
          properties: {
            name: { type: 'string' },
          },
        },
        labels: { $ref: '#/definitions/list_or_dict' },
        driver: { type: 'string' },
        driver_opts: {
          type: 'object',
          patternProperties: {
            '^.+$': { type: ['string', 'number'] },
          },
        },
        template_driver: { type: 'string' },
      },
      additionalProperties: false,
      patternProperties: { '^x-': {} },
    },

    config: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        content: { type: 'string' },
        environment: { type: 'string' },
        file: { type: 'string' },
        external: {
          type: ['boolean', 'string', 'object'],
          properties: {
            name: {
              deprecated: true,
              type: 'string',
            },
          },
        },
        labels: { $ref: '#/definitions/list_or_dict' },
        template_driver: { type: 'string' },
      },
      additionalProperties: false,
      patternProperties: { '^x-': {} },
    },

    command: {
      oneOf: [
        { type: 'null' },
        { type: 'string' },
        { type: 'array', items: { type: 'string' } },
      ],
    },

    service_hook: {
      type: 'object',
      properties: {
        command: { $ref: '#/definitions/command' },
        user: { type: 'string' },
        privileged: { type: ['boolean', 'string'] },
        working_dir: { type: 'string' },
        environment: { $ref: '#/definitions/list_or_dict' },
      },
      additionalProperties: false,
      patternProperties: { '^x-': {} },
      required: ['command'],
    },

    env_file: {
      oneOf: [
        { type: 'string' },
        {
          type: 'array',
          items: {
            oneOf: [
              { type: 'string' },
              {
                type: 'object',
                additionalProperties: false,
                properties: {
                  path: {
                    type: 'string',
                  },
                  format: {
                    type: 'string',
                  },
                  required: {
                    type: ['boolean', 'string'],
                    default: true,
                  },
                },
                required: ['path'],
              },
            ],
          },
        },
      ],
    },

    label_file: {
      oneOf: [
        { type: 'string' },
        {
          type: 'array',
          items: { type: 'string' },
        },
      ],
    },

    string_or_list: {
      oneOf: [{ type: 'string' }, { $ref: '#/definitions/list_of_strings' }],
    },

    list_of_strings: {
      type: 'array',
      items: { type: 'string' },
      uniqueItems: true,
    },

    list_or_dict: {
      oneOf: [
        {
          type: 'object',
          patternProperties: {
            '.+': {
              type: ['string', 'number', 'boolean', 'null'],
            },
          },
          additionalProperties: false,
        },
        { type: 'array', items: { type: 'string' }, uniqueItems: true },
      ],
    },

    extra_hosts: {
      oneOf: [
        {
          type: 'object',
          patternProperties: {
            '.+': {
              oneOf: [
                {
                  type: 'string',
                },
                {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                  uniqueItems: false,
                },
              ],
            },
          },
          additionalProperties: false,
        },
        { type: 'array', items: { type: 'string' }, uniqueItems: true },
      ],
    },

    blkio_limit: {
      type: 'object',
      properties: {
        path: { type: 'string' },
        rate: { type: ['integer', 'string'] },
      },
      additionalProperties: false,
    },
    blkio_weight: {
      type: 'object',
      properties: {
        path: { type: 'string' },
        weight: { type: ['integer', 'string'] },
      },
      additionalProperties: false,
    },
    service_config_or_secret: {
      type: 'array',
      items: {
        oneOf: [
          { type: 'string' },
          {
            type: 'object',
            properties: {
              source: { type: 'string' },
              target: { type: 'string' },
              uid: { type: 'string' },
              gid: { type: 'string' },
              mode: { type: ['number', 'string'] },
            },
            additionalProperties: false,
            patternProperties: { '^x-': {} },
          },
        ],
      },
    },
    ulimits: {
      type: 'object',
      patternProperties: {
        '^[a-z]+$': {
          oneOf: [
            { type: ['integer', 'string'] },
            {
              type: 'object',
              properties: {
                hard: { type: ['integer', 'string'] },
                soft: { type: ['integer', 'string'] },
              },
              required: ['soft', 'hard'],
              additionalProperties: false,
              patternProperties: { '^x-': {} },
            },
          ],
        },
      },
    },
  },
};
