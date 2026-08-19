import { describe, it, expect } from 'vitest';

import { validateYAML, hasYamlChanged } from './stackYamlValidation';

describe('validateYAML', () => {
  describe('YAML syntax validation', () => {
    it('should return empty string for valid YAML', () => {
      const yaml = `
version: '3'
services:
  web:
    image: nginx
    container_name: my-nginx
`;

      const result = validateYAML(yaml);

      expect(result).toBe('');
    });

    it('should return error message for invalid YAML syntax', () => {
      const yaml = `
version: '3'
services:
  web:
    image: nginx
    container_name: [invalid
`;

      const result = validateYAML(yaml);

      expect(result).toContain('There is an error in the yaml syntax:');
    });

    it('should handle empty YAML string', () => {
      const result = validateYAML('');

      expect(result).toBe('');
    });

    it('should handle YAML with comments', () => {
      const yaml = `
# This is a comment
version: '3'
services:
  web:
    image: nginx  # inline comment
`;

      const result = validateYAML(yaml);

      expect(result).toBe('');
    });
  });

  describe('container name conflict detection', () => {
    it('should detect single container name conflict', () => {
      const yaml = `
version: '3'
services:
  web:
    image: nginx
    container_name: existing-container
`;
      const containerNames = ['existing-container', 'other-container'];
      const originalContainerNames: string[] = [];

      const result = validateYAML(yaml, containerNames, originalContainerNames);

      expect(result).toBe(
        'This container name is already used by another container running in this environment: existing-container.'
      );
    });

    it('should detect multiple container name conflicts', () => {
      const yaml = `
version: '3'
services:
  web:
    image: nginx
    container_name: existing-1
  db:
    image: postgres
    container_name: existing-2
`;
      const containerNames = ['existing-1', 'existing-2', 'other-container'];
      const originalContainerNames: string[] = [];

      const result = validateYAML(yaml, containerNames, originalContainerNames);

      expect(result).toBe(
        'These container names are already used by another container running in this environment: existing-1, existing-2.'
      );
    });

    it('should ignore conflicts with original container names', () => {
      const yaml = `
version: '3'
services:
  web:
    image: nginx
    container_name: my-container
`;
      const containerNames = ['my-container', 'other-container'];
      const originalContainerNames = ['my-container'];

      const result = validateYAML(yaml, containerNames, originalContainerNames);

      expect(result).toBe('');
    });

    it('should detect conflict when editing container names in existing stack', () => {
      const yaml = `
version: '3'
services:
  web:
    image: nginx
    container_name: conflicting-name
`;
      const containerNames = [
        'original-name',
        'conflicting-name',
        'other-container',
      ];
      const originalContainerNames = ['original-name'];

      const result = validateYAML(yaml, containerNames, originalContainerNames);

      expect(result).toBe(
        'This container name is already used by another container running in this environment: conflicting-name.'
      );
    });

    it('should allow renaming container in same stack', () => {
      const yaml = `
version: '3'
services:
  web:
    image: nginx
    container_name: new-name
`;
      const containerNames = ['old-name', 'other-container'];
      const originalContainerNames = ['old-name'];

      const result = validateYAML(yaml, containerNames, originalContainerNames);

      expect(result).toBe('');
    });

    it('should handle empty containerNames array', () => {
      const yaml = `
version: '3'
services:
  web:
    image: nginx
    container_name: my-container
`;

      const result = validateYAML(yaml, [], []);

      expect(result).toBe('');
    });

    it('should handle YAML without container_name properties', () => {
      const yaml = `
version: '3'
services:
  web:
    image: nginx
  db:
    image: postgres
`;
      const containerNames = ['existing-container'];

      const result = validateYAML(yaml, containerNames);

      expect(result).toBe('');
    });

    it('should detect partial conflicts in multi-service stack', () => {
      const yaml = `
version: '3'
services:
  web:
    image: nginx
    container_name: unique-name
  db:
    image: postgres
    container_name: conflicting-name
  cache:
    image: redis
    container_name: another-unique
`;
      const containerNames = ['conflicting-name', 'other-container'];
      const originalContainerNames: string[] = [];

      const result = validateYAML(yaml, containerNames, originalContainerNames);

      expect(result).toBe(
        'This container name is already used by another container running in this environment: conflicting-name.'
      );
    });

    it('should use default empty arrays when containerNames not provided', () => {
      const yaml = `
version: '3'
services:
  web:
    image: nginx
    container_name: my-container
`;

      const result = validateYAML(yaml);

      expect(result).toBe('');
    });
  });

  describe('edge cases', () => {
    it('should handle YAML with duplicate container names in same stack', () => {
      const yaml = `
version: '3'
services:
  web:
    image: nginx
    container_name: duplicate-name
  api:
    image: node
    container_name: duplicate-name
`;
      const containerNames = ['duplicate-name'];
      const originalContainerNames: string[] = [];

      const result = validateYAML(yaml, containerNames, originalContainerNames);

      expect(result).toBe(
        'This container name is already used by another container running in this environment: duplicate-name.'
      );
    });

    it('should handle nested container_name properties', () => {
      const yaml = `
version: '3'
services:
  web:
    image: nginx
    container_name: main-container
    deploy:
      metadata:
        container_name: nested-container
`;
      const containerNames = ['nested-container'];
      const originalContainerNames: string[] = [];

      const result = validateYAML(yaml, containerNames, originalContainerNames);

      expect(result).toBe(
        'This container name is already used by another container running in this environment: nested-container.'
      );
    });

    it('should return validation error before checking conflicts for invalid YAML', () => {
      const yaml = 'invalid: [yaml: syntax';
      const containerNames = ['existing-container'];

      const result = validateYAML(yaml, containerNames);

      expect(result).toContain('There is an error in the yaml syntax:');
    });
  });
});

describe('hasYamlChanged', () => {
  it('should return false for identical strings', () => {
    const original = 'version: "3"\nservices:\n  web:\n    image: nginx';
    const updated = 'version: "3"\nservices:\n  web:\n    image: nginx';

    const result = hasYamlChanged(original, updated);

    expect(result).toBe(false);
  });

  it('should return true for different content', () => {
    const original = 'version: "3"\nservices:\n  web:\n    image: nginx';
    const updated = 'version: "3"\nservices:\n  web:\n    image: apache';

    const result = hasYamlChanged(original, updated);

    expect(result).toBe(true);
  });

  it('should ignore line ending differences (LF vs CRLF)', () => {
    const original = 'version: "3"\nservices:\n  web:\n    image: nginx';
    const updated = 'version: "3"\r\nservices:\r\n  web:\r\n    image: nginx';

    const result = hasYamlChanged(original, updated);

    expect(result).toBe(false);
  });

  it('should ignore mixed line endings', () => {
    const original = 'version: "3"\nservices:\r\n  web:\n    image: nginx';
    const updated = 'version: "3"\r\nservices:\n  web:\r\n    image: nginx';

    const result = hasYamlChanged(original, updated);

    expect(result).toBe(false);
  });

  it('should detect changes when whitespace differs significantly', () => {
    const original = 'version: "3"\nservices:\n  web:\n    image: nginx';
    const updated = 'version: "3"\nservices:\n   web:\n    image: nginx'; // Extra space

    const result = hasYamlChanged(original, updated);

    expect(result).toBe(true);
  });

  it('should return false for empty strings', () => {
    const result = hasYamlChanged('', '');

    expect(result).toBe(false);
  });

  it('should return true when one string is empty', () => {
    const original = 'version: "3"';
    const updated = '';

    const result = hasYamlChanged(original, updated);

    expect(result).toBe(true);
  });

  it('should ignore old Mac line endings (CR)', () => {
    const original = 'version: "3"\nservices:\n  web:\n    image: nginx';
    const updated = 'version: "3"\rservices:\r  web:\r    image: nginx';

    const result = hasYamlChanged(original, updated);

    expect(result).toBe(false);
  });

  it('should handle strings with only line ending differences', () => {
    const original = '\n\n\n';
    const updated = '\r\n\r\n\r\n';

    const result = hasYamlChanged(original, updated);

    expect(result).toBe(false);
  });
});
