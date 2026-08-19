import { renderHook } from '@testing-library/react-hooks';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { CustomTemplate } from '@/react/portainer/templates/custom-templates/types';
import { Platform } from '@/react/portainer/templates/types';
import { StackType } from '@/react/common/stacks/types';

import { useTemplateInitialization } from './useTemplateInitialization';

describe('useTemplateInitialization', () => {
  const mockOnVariablesChange = vi.fn();
  const mockOnFileContentChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not initialize when templateFile is empty', () => {
    renderHook(() =>
      useTemplateInitialization({
        selectedTemplate: createMockCustomTemplate(),
        templateFile: '',
        onVariablesChange: mockOnVariablesChange,
        onFileContentChange: mockOnFileContentChange,
      })
    );

    expect(mockOnVariablesChange).not.toHaveBeenCalled();
    expect(mockOnFileContentChange).not.toHaveBeenCalled();
  });

  it('should not initialize when selectedTemplate is undefined', () => {
    renderHook(() =>
      useTemplateInitialization({
        selectedTemplate: undefined,
        templateFile: 'version: "3"\nservices:\n  web:\n    image: nginx',
        onVariablesChange: mockOnVariablesChange,
        onFileContentChange: mockOnFileContentChange,
      })
    );

    expect(mockOnVariablesChange).not.toHaveBeenCalled();
    expect(mockOnFileContentChange).not.toHaveBeenCalled();
  });

  it('should set file content directly when template has no variables', () => {
    const fileContent = 'version: "3"\nservices:\n  web:\n    image: nginx';

    renderHook(() =>
      useTemplateInitialization({
        selectedTemplate: createMockCustomTemplate({ Variables: [] }),
        templateFile: fileContent,
        onVariablesChange: mockOnVariablesChange,
        onFileContentChange: mockOnFileContentChange,
      })
    );

    expect(mockOnFileContentChange).toHaveBeenCalledWith(fileContent);
    expect(mockOnVariablesChange).toHaveBeenCalledWith([]);
  });

  it('should initialize variables with defaults when template has variables', () => {
    const fileContent =
      'version: "3"\nservices:\n  web:\n    image: {{ IMAGE_NAME }}\n    ports:\n      - {{ PORT }}:80';

    renderHook(() =>
      useTemplateInitialization({
        selectedTemplate: createMockCustomTemplate({
          Variables: [
            {
              name: 'IMAGE_NAME',
              label: 'Image Name',
              defaultValue: 'nginx',
              description: 'Docker image name',
            },
            {
              name: 'PORT',
              label: 'Port',
              defaultValue: '80',
              description: 'Exposed port',
            },
          ],
        }),
        templateFile: fileContent,
        onVariablesChange: mockOnVariablesChange,
        onFileContentChange: mockOnFileContentChange,
      })
    );

    expect(mockOnVariablesChange).toHaveBeenCalledWith([
      { key: 'IMAGE_NAME', value: 'nginx' },
      { key: 'PORT', value: '80' },
    ]);
    expect(mockOnFileContentChange).not.toHaveBeenCalled();
  });

  it('should only initialize once per template', () => {
    const template = createMockCustomTemplate();
    const fileContent = 'version: "3"\nservices:\n  web:\n    image: nginx';

    const { rerender } = renderHook(
      ({ selectedTemplate, templateFile }) =>
        useTemplateInitialization({
          selectedTemplate,
          templateFile,
          onVariablesChange: mockOnVariablesChange,
          onFileContentChange: mockOnFileContentChange,
        }),
      {
        initialProps: { selectedTemplate: template, templateFile: fileContent },
      }
    );

    expect(mockOnFileContentChange).toHaveBeenCalledTimes(1);
    expect(mockOnVariablesChange).toHaveBeenCalledTimes(1);

    mockOnFileContentChange.mockClear();
    mockOnVariablesChange.mockClear();

    rerender({ selectedTemplate: template, templateFile: fileContent });

    expect(mockOnFileContentChange).not.toHaveBeenCalled();
    expect(mockOnVariablesChange).not.toHaveBeenCalled();
  });

  it('should reinitialize when template changes', () => {
    const template1 = createMockCustomTemplate({
      Id: 1,
      Title: 'Template 1',
      Variables: [],
    });
    const template2 = createMockCustomTemplate({
      Id: 2,
      Title: 'Template 2',
      Variables: [],
    });
    const fileContent1 = 'version: "3"\nservices:\n  web:\n    image: nginx';
    const fileContent2 = 'version: "3"\nservices:\n  app:\n    image: postgres';

    const { rerender } = renderHook(
      ({ selectedTemplate, templateFile }) =>
        useTemplateInitialization({
          selectedTemplate,
          templateFile,
          onVariablesChange: mockOnVariablesChange,
          onFileContentChange: mockOnFileContentChange,
        }),
      {
        initialProps: {
          selectedTemplate: template1,
          templateFile: fileContent1,
        },
      }
    );

    expect(mockOnFileContentChange).toHaveBeenCalledWith(fileContent1);
    expect(mockOnFileContentChange).toHaveBeenCalledTimes(1);

    mockOnFileContentChange.mockClear();
    mockOnVariablesChange.mockClear();

    rerender({ selectedTemplate: template2, templateFile: fileContent2 });

    expect(mockOnFileContentChange).toHaveBeenCalledWith(fileContent2);
    expect(mockOnFileContentChange).toHaveBeenCalledTimes(1);
  });

  it('should handle template with undefined Variables property', () => {
    const template = createMockCustomTemplate({
      Id: 1,
      Title: 'Test Template',
      Variables: undefined,
    });
    const fileContent = 'version: "3"\nservices:\n  web:\n    image: nginx';

    renderHook(() =>
      useTemplateInitialization({
        selectedTemplate: template,
        templateFile: fileContent,
        onVariablesChange: mockOnVariablesChange,
        onFileContentChange: mockOnFileContentChange,
      })
    );

    expect(mockOnFileContentChange).toHaveBeenCalledWith(fileContent);
    expect(mockOnVariablesChange).toHaveBeenCalledWith([]);
  });

  it('should handle template with empty Variables array', () => {
    const fileContent = 'version: "3"\nservices:\n  web:\n    image: nginx';

    renderHook(() =>
      useTemplateInitialization({
        selectedTemplate: createMockCustomTemplate({
          Id: 1,
          Title: 'Test Template',
          Variables: [],
        }),
        templateFile: fileContent,
        onVariablesChange: mockOnVariablesChange,
        onFileContentChange: mockOnFileContentChange,
      })
    );

    expect(mockOnFileContentChange).toHaveBeenCalledWith(fileContent);
    expect(mockOnVariablesChange).toHaveBeenCalledWith([]);
  });
});

function createMockCustomTemplate(
  overrides: Partial<CustomTemplate> = {}
): CustomTemplate {
  return {
    Id: 1,
    Title: 'Test Template',
    Variables: [],
    CreatedByUserId: 5,
    Description: '',
    ProjectPath: '',
    EdgeTemplate: false,
    EntryPoint: '',
    Note: '',
    Platform: Platform.LINUX,
    Logo: '',
    Type: StackType.DockerCompose,
    IsComposeFormat: true,
    ...overrides,
  };
}
