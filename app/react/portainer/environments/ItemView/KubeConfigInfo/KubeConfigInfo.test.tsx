import { render, screen } from '@testing-library/react';

import {
  EnvironmentType,
  EnvironmentStatus,
} from '@/react/portainer/environments/types';
import { withTestRouter } from '@/react/test-utils/withRouter';

import { KubeConfigInfo } from './KubeConfigInfo';

function renderPanel(
  environmentType: EnvironmentType,
  status: EnvironmentStatus = EnvironmentStatus.Up,
  edgeId?: string
) {
  const Wrapped = withTestRouter(KubeConfigInfo);
  return render(
    <Wrapped
      environmentId={1}
      environmentType={environmentType}
      status={status}
      edgeId={edgeId}
    />
  );
}

describe('KubeConfigInfo', () => {
  describe('Visibility', () => {
    it('should display for KubernetesLocal environment', () => {
      renderPanel(EnvironmentType.KubernetesLocal);

      expect(
        screen.getByText('Kubernetes features configuration')
      ).toBeVisible();
      expect(screen.getByText('Kubernetes configuration')).toBeVisible();
    });

    it('should display for AgentOnKubernetes environment', () => {
      renderPanel(EnvironmentType.AgentOnKubernetes);

      expect(
        screen.getByText('Kubernetes features configuration')
      ).toBeVisible();
    });

    it('should display for EdgeAgentOnKubernetes with EdgeID', () => {
      renderPanel(
        EnvironmentType.EdgeAgentOnKubernetes,
        EnvironmentStatus.Up,
        'edge-123'
      );

      expect(
        screen.getByText('Kubernetes features configuration')
      ).toBeVisible();
    });

    it('should not display for EdgeAgentOnKubernetes without EdgeID', () => {
      renderPanel(EnvironmentType.EdgeAgentOnKubernetes);

      expect(
        screen.queryByText('Kubernetes features configuration')
      ).not.toBeInTheDocument();
    });

    it('should not display when status is Down', () => {
      renderPanel(EnvironmentType.KubernetesLocal, EnvironmentStatus.Down);

      expect(
        screen.queryByText('Kubernetes features configuration')
      ).not.toBeInTheDocument();
    });

    it('should not display for Docker environment', () => {
      renderPanel(EnvironmentType.Docker);

      expect(
        screen.queryByText('Kubernetes features configuration')
      ).not.toBeInTheDocument();
    });

    it('should not display for Azure environment', () => {
      renderPanel(EnvironmentType.Azure);

      expect(
        screen.queryByText('Kubernetes features configuration')
      ).not.toBeInTheDocument();
    });
  });

  describe('Content', () => {
    it('should display wrench icon', () => {
      const { container } = renderPanel(EnvironmentType.KubernetesLocal);

      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should display correct title', () => {
      renderPanel(EnvironmentType.KubernetesLocal);

      expect(
        screen.getByText('Kubernetes features configuration')
      ).toBeVisible();
    });

    it('should display correct message text', () => {
      renderPanel(EnvironmentType.KubernetesLocal);

      expect(
        screen.getByText(/You should configure the features available/i)
      ).toBeVisible();
    });

    it('should display link with correct text', () => {
      renderPanel(EnvironmentType.KubernetesLocal);

      const link = screen.getByTestId('kubernetes-config-link');
      expect(link).toBeVisible();
      expect(link).toHaveTextContent('Kubernetes configuration');
    });

    it('should have link element', () => {
      renderPanel(EnvironmentType.KubernetesLocal);

      const link = screen.getByTestId('kubernetes-config-link');

      // Link component renders an anchor tag
      expect(link.tagName).toBe('A');
    });
  });
});
