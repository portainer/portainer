import { Meta, StoryObj } from '@storybook/react-webpack5';

import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';

import {
  RegistryFormDockerhub,
  RegistryFormDockerhubValues,
} from './RegistryFormDockerhub';

const meta: Meta<typeof RegistryFormDockerhub> = {
  component: withTestQueryProvider(RegistryFormDockerhub),
  title: 'Components/Forms/RegistryFormDockerhub',
  argTypes: {
    isLoading: { control: 'boolean' },
    submitLabel: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof RegistryFormDockerhub>;

const defaultInitialValues: RegistryFormDockerhubValues = {
  Name: '',
  Username: '',
  Password: '',
};

export const CreateForm: Story = {
  args: {
    initialValues: defaultInitialValues,
    onSubmit: (values) => {
      // eslint-disable-next-line no-console
      console.log('Form submitted:', values);
      return Promise.resolve();
    },
    submitLabel: 'Add registry',
    isLoading: false,
    nameIsUsed: () => Promise.resolve(false),
  },
};

export const EditForm: Story = {
  args: {
    initialValues: {
      Name: 'dockerhub-prod',
      Username: 'myusername',
      Password: '••••••••••••',
    },
    onSubmit: (values) => {
      // eslint-disable-next-line no-console
      console.log('Form updated:', values);
      return Promise.resolve();
    },
    submitLabel: 'Update registry',
    isLoading: false,
    nameIsUsed: () => Promise.resolve(false),
  },
};

export const LoadingState: Story = {
  args: {
    initialValues: defaultInitialValues,
    onSubmit: () => new Promise(() => {}), // Never resolves to keep loading
    submitLabel: 'Add registry',
    isLoading: true,
    nameIsUsed: () => Promise.resolve(false),
  },
};

export const WithNameConflict: Story = {
  args: {
    initialValues: {
      Name: 'existing-registry',
      Username: '',
      Password: '',
    },
    onSubmit: (values) => {
      // eslint-disable-next-line no-console
      console.log('Form submitted:', values);
      return Promise.resolve();
    },
    submitLabel: 'Add registry',
    isLoading: false,
    nameIsUsed: (name) => Promise.resolve(name === 'existing-registry'),
  },
};
