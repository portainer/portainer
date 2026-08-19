import { describe, it, expect } from 'vitest';

import {
  extractContainerNames,
  extractContainerNamesFromYaml,
} from './container-names';

describe('extractContainerNames', () => {
  it('should extract container names from valid Docker Compose YAML', () => {
    const yaml = `
version: '3'
services:
  web:
    image: nginx
    container_name: my-nginx
  db:
    image: postgres
    container_name: my-postgres
`;

    const result = extractContainerNames(yaml);

    expect(result).toEqual(['my-nginx', 'my-postgres']);
  });

  it('should return unique container names when duplicates exist', () => {
    const yaml = `
version: '3'
services:
  web:
    image: nginx
    container_name: my-app
  api:
    image: node
    container_name: my-app
`;

    const result = extractContainerNames(yaml);

    expect(result).toEqual(['my-app']);
  });

  it('should handle services without container_name property', () => {
    const yaml = `
version: '3'
services:
  web:
    image: nginx
  db:
    image: postgres
    container_name: my-postgres
`;

    const result = extractContainerNames(yaml);

    expect(result).toEqual(['my-postgres']);
  });

  it('should return empty array for invalid YAML syntax', () => {
    const yaml = `
version: '3'
services:
  web:
    image: nginx
    container_name: [invalid syntax
`;

    const result = extractContainerNames(yaml);

    expect(result).toEqual([]);
  });

  it('should return empty array for empty YAML', () => {
    const result = extractContainerNames('');

    expect(result).toEqual([]);
  });

  it('should return empty array when no services are defined', () => {
    const yaml = `
version: '3'
services: {}
`;

    const result = extractContainerNames(yaml);

    expect(result).toEqual([]);
  });

  it('should handle nested container_name properties', () => {
    const yaml = `
version: '3'
services:
  web:
    image: nginx
    container_name: my-nginx
    deploy:
      replicas: 2
      metadata:
        container_name: nested-name
`;

    const result = extractContainerNames(yaml);

    expect(result).toEqual(['my-nginx', 'nested-name']);
  });

  it('should handle YAML with multiple top-level sections', () => {
    const yaml = `
version: '3'
services:
  web:
    image: nginx
    container_name: web-container
volumes:
  data:
    driver: local
networks:
  backend:
    driver: bridge
`;

    const result = extractContainerNames(yaml);

    expect(result).toEqual(['web-container']);
  });
});

describe('extractContainerNamesFromYaml', () => {
  it('should extract container names from parsed YAML object', () => {
    const yamlObject = {
      version: '3',
      services: {
        web: {
          image: 'nginx',
          container_name: 'my-nginx',
        },
        db: {
          image: 'postgres',
          container_name: 'my-postgres',
        },
      },
    };

    const result = extractContainerNamesFromYaml(yamlObject);

    expect(result).toEqual(['my-nginx', 'my-postgres']);
  });

  it('should return empty array for null input', () => {
    const result = extractContainerNamesFromYaml(null);

    expect(result).toEqual([]);
  });

  it('should return empty array for undefined input', () => {
    const result = extractContainerNamesFromYaml(undefined);

    expect(result).toEqual([]);
  });

  it('should return empty array for primitive input', () => {
    const result = extractContainerNamesFromYaml('string');

    expect(result).toEqual([]);
  });

  it('should handle deeply nested objects', () => {
    const yamlObject = {
      level1: {
        level2: {
          level3: {
            container_name: 'deep-container',
          },
        },
      },
      services: {
        web: {
          container_name: 'shallow-container',
        },
      },
    };

    const result = extractContainerNamesFromYaml(yamlObject);

    expect(result).toEqual(['deep-container', 'shallow-container']);
  });

  it('should handle arrays containing objects with container_name', () => {
    const yamlObject = {
      services: [
        {
          name: 'web',
          container_name: 'array-container-1',
        },
        {
          name: 'db',
          container_name: 'array-container-2',
        },
      ],
    };

    const result = extractContainerNamesFromYaml(yamlObject);

    expect(result).toEqual(['array-container-1', 'array-container-2']);
  });

  it('should return unique names when duplicates exist in parsed object', () => {
    const yamlObject = {
      services: {
        web: {
          container_name: 'duplicate-name',
        },
        api: {
          container_name: 'duplicate-name',
        },
      },
    };

    const result = extractContainerNamesFromYaml(yamlObject);

    expect(result).toEqual(['duplicate-name']);
  });
});
