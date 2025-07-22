export function mockCodeMirror() {
  vi.mock('@uiw/react-codemirror', () => ({
    __esModule: true,
    default: ({
      value,
      onChange,
      readOnly,
      placeholder,
      height,
      className,
      id,
      'data-cy': dataCy,
    }: {
      value?: string;
      onChange?: (value: string) => void;
      readOnly?: boolean;
      placeholder?: string;
      height?: string;
      className?: string;
      id?: string;
      'data-cy'?: string;
    }) => (
      <textarea
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        readOnly={readOnly}
        placeholder={placeholder}
        style={height ? { height } : undefined}
        className={className}
        id={id}
        data-cy={dataCy}
      />
    ),
    oneDarkHighlightStyle: {},
    keymap: {
      of: () => ({}),
    },
  }));

  vi.mock('react-codemirror-merge', () => {
    const components = {
      MergeView: () => <div />,
      Original: () => <div />,
      Modified: () => <div />,
    };

    return {
      __esModule: true,
      default: components,
      ...components,
    };
  });

  vi.mock('yaml-schema', () => ({
    yamlSchema: () => [],
    validation: () => ({
      of: () => ({}),
    }),
  }));
}
