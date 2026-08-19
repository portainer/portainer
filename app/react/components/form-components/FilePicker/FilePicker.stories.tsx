import { Meta, StoryObj } from '@storybook/react-webpack5';
import { useEffect, useState } from 'react';

import { Button } from '@@/buttons/Button';
import { FileNode } from '@@/form-components/FilePicker/types';

import { FilePicker } from './FilePicker';
import { FilePickerSkeleton } from './FilePickerSkeleton';

const meta: Meta<typeof FilePicker> = {
  title: 'Components/Forms/File Picker',
  component: FilePicker,
  tags: [],
  decorators: [
    (Story, { viewMode }) => (
      <div
        style={{
          background: 'var(--bg, #f9fafb)',
          padding: 'var(--space-16)',
          minHeight: viewMode === 'story' ? '100vh' : undefined,
          fontFamily: "'DM Sans', system-ui, sans-serif",
        }}
      >
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '`FilePicker` lets users select individual files or build wildcard expressions (e.g. `*.yml`, `src/**/*.ts`) from a repository tree. Selected items surface as **File** or **Expression** chips. A blue dot marks every tree row that is selected or matched by an expression. Typing in the filter bar shows a live preview of matching files and offers a one-click "Add expression (N matches)" button.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof FilePicker>;

// ─── Demo data ────────────────────────────────────────────────────────────────

const REPO_NODES: FileNode[] = [
  {
    name: '.github',
    children: [
      {
        name: 'workflows',
        children: [
          { name: 'ci.yml' },
          { name: 'deploy.yml' },
          { name: 'release.yml' },
        ],
      },
    ],
  },
  {
    name: 'config',
    children: [
      { name: 'app.yml' },
      { name: 'database.yml' },
      { name: 'cache.yml' },
      { name: 'logging.yml' },
    ],
  },
  {
    name: 'deploy',
    children: [
      { name: 'k8s.yaml' },
      { name: 'helm-values.yaml' },
      { name: 'terraform.tfvars' },
    ],
  },
  {
    name: 'docs',
    children: [
      { name: 'README.md' },
      { name: 'architecture.md' },
      { name: 'CONTRIBUTING.md' },
    ],
  },
  {
    name: 'scripts',
    children: [
      { name: 'build.sh' },
      { name: 'deploy.sh' },
      { name: 'seed.sh' },
    ],
  },
  {
    name: 'src',
    children: [
      {
        name: 'api',
        children: [
          { name: 'routes.ts' },
          { name: 'handlers.ts' },
          { name: 'middleware.ts' },
        ],
      },
      {
        name: 'components',
        children: [
          { name: 'Button.tsx' },
          { name: 'Modal.tsx' },
          { name: 'Table.tsx' },
        ],
      },
      {
        name: 'utils',
        children: [{ name: 'helpers.ts' }, { name: 'types.ts' }],
      },
    ],
  },
  {
    name: 'tests',
    children: [
      { name: 'setup.ts' },
      { name: 'integration.ts' },
      { name: 'e2e.ts' },
    ],
  },
  { name: '.gitignore' },
  { name: 'docker-compose.yml' },
  { name: 'docker-compose.prod.yml' },
  { name: 'docker-compose.staging.yml' },
  { name: 'Dockerfile' },
  { name: 'package.json' },
  { name: 'tsconfig.json' },
];

const HUGE_REPO_NODES: FileNode[] = Array.from({ length: 100 }, (_, dir) => ({
  name: `service-${dir}`,
  children: Array.from({ length: 100 }, (_, file) => ({
    name: `config-${file}.yml`,
  })),
}));

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export const Skeleton: StoryObj<{ loading: boolean }> = {
  render: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [loading, setLoading] = useState(true);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [value, setValue] = useState<string[]>([]);

    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      const id = setTimeout(() => setLoading(false), 2000);
      return () => clearTimeout(id);
    }, []);

    return (
      <div className="flex flex-col gap-2 p-2">
        {loading ? (
          <FilePickerSkeleton />
        ) : (
          <FilePicker
            files={REPO_NODES}
            value={value}
            onChange={setValue}
            exampleExpressions={[
              '*.yml',
              '*.yaml',
              '*.ts',
              'src/**',
              'deploy/**',
            ]}
          />
        )}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Shows a skeleton placeholder while file tree data is loading, then transitions to the real `FilePicker` after 2 seconds. Reload the story to replay the transition.',
      },
    },
  },
};

// ─── Default ──────────────────────────────────────────────────────────────────

export const Default: Story = {
  args: {
    files: REPO_NODES,
    exampleExpressions: ['*.yml', '*.yaml', '*.ts', 'src/**', 'deploy/**'],
  },
  render: (args) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [value, setValue] = useState<string[]>([]);
    return (
      <div className="flex flex-col gap-2 p-2">
        <FilePicker {...args} value={value} onChange={setValue} />
        <Button
          color="primary"
          size="small"
          data-cy="file-picker-add-paths"
          onClick={() => alert(`Files:\n${value.join('\n') || '(none)'}`)}
        >
          Add Paths
        </Button>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Default state — header shows total file count, suggested pattern chips for one-click expression adding, and an empty tree with all folders collapsed. Click a pattern chip (e.g. `*.yml`) to add it as an expression immediately.',
      },
      source: {
        code: `<FilePicker
  files={REPO_NODES}
  value={value}
  onChange={setValue}
  exampleExpressions={['*.yml', '*.yaml', '*.ts', 'src/**', 'deploy/**']}
/>`,
      },
    },
  },
};

// ─── Huge repo (BE-13263) ──────────────────────────────────────────────────────

export const HugeRepo: Story = {
  args: {
    files: HUGE_REPO_NODES,
    exampleExpressions: ['*.yml'],
  },
  render: (args) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [value, setValue] = useState<string[]>([]);
    return (
      <div className="flex flex-col gap-2 p-2">
        <FilePicker {...args} value={value} onChange={setValue} />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Repro for BE-13263: 10,000 files, all matching `*.yml`. Click the `*.yml` chip (or type it into the filter bar) to render the full 10,000-row match list and see how the dropdown behaves at that scale.',
      },
    },
  },
};
