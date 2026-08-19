import { Meta, StoryObj } from '@storybook/react-webpack5';

import { ExpandableMessageByLines } from './ExpandableMessageByLines';

export default {
  component: ExpandableMessageByLines,
  title: 'Components/ExpandableMessageByLines',
  argTypes: {
    maxLines: {
      control: {
        type: 'select',
        options: [2, 5, 10, 20, 50],
      },
      description: 'Maximum number of lines to show before truncating',
    },
    children: {
      control: 'text',
      description: 'The text content to display',
    },
  },
} as Meta;

interface Args {
  children: string;
  maxLines?: 2 | 5 | 10 | 20 | 50;
}

// Short text that won't be truncated
export const ShortText: StoryObj<Args> = {
  args: {
    children: 'This is a short message that should not be truncated.',
    maxLines: 10,
  },
};

// Long text that will be truncated
export const LongText: StoryObj<Args> = {
  args: {
    children: `This is a very long message that should be truncated after the specified number of lines.
It contains multiple lines of text to demonstrate the expandable functionality.
The component will show a "Show more" button when the content exceeds the maxLines limit.
When clicked, it will expand to show the full content and change to "Show less".
This is useful for displaying long error messages, logs, or any text content that might be too long for the UI.`,
    maxLines: 5,
  },
};

// Text with line breaks
export const TextWithLineBreaks: StoryObj<Args> = {
  args: {
    children: `Line 1: This is the first line
Line 2: This is the second line
Line 3: This is the third line
Line 4: This is the fourth line
Line 5: This is the fifth line
Line 6: This is the sixth line
Line 7: This is the seventh line
Line 8: This is the eighth line
Line 9: This is the ninth line
Line 10: This is the tenth line`,
    maxLines: 5,
  },
};

// Very short maxLines
export const VeryShortMaxLines: StoryObj<Args> = {
  args: {
    children: `This text will be truncated after just 2 lines.
This is the second line.
This is the third line that should be hidden initially.
This is the fourth line that should also be hidden.`,
    maxLines: 2,
  },
};

// Error message example
export const ErrorMessage: StoryObj<Args> = {
  args: {
    children: `Error: Failed to connect to the Docker daemon at unix:///var/run/docker.sock.
Is the docker daemon running?

This error typically occurs when:
1. Docker daemon is not running
2. User doesn't have permission to access the Docker socket
3. Docker socket path is incorrect
4. Docker service has crashed

To resolve this issue:
1. Start the Docker daemon: sudo systemctl start docker
2. Add user to docker group: sudo usermod -aG docker $USER
3. Verify Docker is running: docker ps
4. Check Docker socket permissions: ls -la /var/run/docker.sock`,
    maxLines: 5,
  },
};

// Log output example
export const LogOutput: StoryObj<Args> = {
  args: {
    children: `2024-01-15T10:30:45.123Z INFO  [ContainerService] Starting container nginx:latest
2024-01-15T10:30:45.234Z DEBUG [ContainerService] Container ID: abc123def456
2024-01-15T10:30:45.345Z INFO  [ContainerService] Container started successfully
2024-01-15T10:30:45.456Z DEBUG [NetworkService] Creating network bridge
2024-01-15T10:30:45.567Z INFO  [NetworkService] Network created: portainer_network
2024-01-15T10:30:45.678Z DEBUG [VolumeService] Mounting volume /data
2024-01-15T10:30:45.789Z INFO  [VolumeService] Volume mounted successfully
2024-01-15T10:30:45.890Z DEBUG [ContainerService] Setting up port mapping 80:80
2024-01-15T10:30:45.901Z INFO  [ContainerService] Port mapping configured
2024-01-15T10:30:45.912Z DEBUG [ContainerService] Setting environment variables
2024-01-15T10:30:45.923Z INFO  [ContainerService] Environment variables set
2024-01-15T10:30:45.934Z DEBUG [ContainerService] Starting container process
2024-01-15T10:30:45.945Z INFO  [ContainerService] Container process started`,
    maxLines: 10,
  },
};
