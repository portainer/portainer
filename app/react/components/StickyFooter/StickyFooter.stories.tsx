import { Meta, StoryObj } from '@storybook/react';

import { Button } from '@@/buttons';

import { StickyFooter } from './StickyFooter';

export default {
  component: StickyFooter,
  title: 'Components/StickyActionBar',
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <div style={{ height: '200vh', paddingTop: '50px' }}>
        <p className="px-6">
          Scroll down to see the sticky action bar at the bottom of the
          viewport.
        </p>
        <Story />
      </div>
    ),
  ],
} as Meta<typeof StickyFooter>;

type Story = StoryObj<typeof StickyFooter>;

export function SpaceBetween() {
  return (
    <StickyFooter className="justify-between">
      <Button color="default" onClick={() => {}} data-cy="cancel-button">
        Cancel
      </Button>
      <Button color="primary" onClick={() => {}} data-cy="save-button">
        Save
      </Button>
    </StickyFooter>
  );
}

export function RightAligned() {
  return (
    <StickyFooter className="justify-end gap-3">
      <Button color="default" onClick={() => {}} data-cy="cancel-button">
        Cancel
      </Button>
      <Button color="primary" onClick={() => {}} data-cy="save-button">
        Save
      </Button>
    </StickyFooter>
  );
}

export function LeftAligned() {
  return (
    <StickyFooter className="justify-start gap-3">
      <Button color="default" onClick={() => {}} data-cy="back-button">
        Back
      </Button>
      <Button color="primary" onClick={() => {}} data-cy="next-button">
        Next
      </Button>
    </StickyFooter>
  );
}

export function Centered() {
  return (
    <StickyFooter className="justify-center gap-3">
      <Button color="default" onClick={() => {}} data-cy="cancel-button">
        Cancel
      </Button>
      <Button color="primary" onClick={() => {}} data-cy="submit-button">
        Submit
      </Button>
    </StickyFooter>
  );
}

export function ComplexLayout() {
  return (
    <StickyFooter className="justify-between">
      <div className="flex items-center gap-3">
        <Button color="default" onClick={() => {}} data-cy="cancel-button">
          Cancel
        </Button>
        <Button color="dangerlight" onClick={() => {}} data-cy="delete-button">
          Delete
        </Button>
      </div>
      <div className="flex items-center gap-3">
        <Button
          color="default"
          onClick={() => {}}
          data-cy="save-as-draft-button"
        >
          Save as Draft
        </Button>
        <Button color="primary" onClick={() => {}} data-cy="publish-button">
          Publish
        </Button>
      </div>
    </StickyFooter>
  );
}

export const Default: Story = {
  args: {
    className: 'justify-end gap-3',
    children: (
      <>
        <Button color="default" data-cy="cancel-button">
          Cancel
        </Button>
        <Button color="primary" data-cy="save-button">
          Save
        </Button>
      </>
    ),
  },
};
