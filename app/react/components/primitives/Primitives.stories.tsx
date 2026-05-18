import { Meta, StoryFn } from '@storybook/react-webpack5';
import { Check, Edit2, Layers, RefreshCw, Trash2, Users } from 'lucide-react';
import { ReactNode } from 'react';

import { Badge } from '@@/Badge';
import { Button } from '@@/buttons/Button';

import { Card } from './Card';
import { StatusDot } from './StatusDot';

export default {
  title: 'Design System/Primitives/Overview',
  parameters: { msw: { handlers: [] } },
} as Meta;

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-8">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-6">
        {title}
      </p>
      <hr className="mb-4 border-gray-5" />
      {children}
    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mb-4 flex items-center gap-8">
      <span className="w-32 shrink-0 text-sm text-gray-6">{label}</span>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

function Labeled({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {children}
      <span className="text-sm text-gray-6">{label}</span>
    </span>
  );
}

export const Overview: StoryFn = () => {
  return (
    <>
      <Section title="StatusDot">
        <Row label="Tones">
          <Labeled label="success">
            <StatusDot color="success" />
          </Labeled>
          <Labeled label="warning">
            <StatusDot color="warn" />
          </Labeled>
          <Labeled label="danger">
            <StatusDot color="danger" />
          </Labeled>
          <Labeled label="neutral">
            <StatusDot color="muted" />
          </Labeled>
          <Labeled label="accent">
            <StatusDot color="info" />
          </Labeled>
        </Row>
        <Row label="Sizes">
          <Labeled label="xs">
            <StatusDot color="success" size="xs" />
          </Labeled>
          <Labeled label="sm">
            <StatusDot color="success" size="sm" />
          </Labeled>
          <Labeled label="md">
            <StatusDot color="success" size="md" />
          </Labeled>
        </Row>
        <Row label="Pulse">
          <Labeled label="warning + pulse">
            <StatusDot color="warn" pulse />
          </Labeled>
          <Labeled label="accent + pulse">
            <StatusDot color="info" pulse />
          </Labeled>
        </Row>
      </Section>

      <Section title="Badge">
        <Row label="Tones (pill)">
          <Badge type="muted">neutral</Badge>
          <Badge type="success">success</Badge>
          <Badge type="danger">danger</Badge>
          <Badge type="warn">warning</Badge>
          <Badge type="info">info</Badge>
          <Badge type="successSecondary">successSecondary</Badge>
          <Badge type="dangerSecondary">dangerSecondary</Badge>
          <Badge type="warnSecondary">warnSecondary</Badge>
          <Badge type="infoSecondary">infoSecondary</Badge>
        </Row>
        <Row label="Tones (rect)">
          <Badge type="muted" shape="rect">
            neutral
          </Badge>
          <Badge type="success" shape="rect">
            success
          </Badge>
          <Badge type="danger" shape="rect">
            danger
          </Badge>
          <Badge type="warn" shape="rect">
            warning
          </Badge>
          <Badge type="info" shape="rect">
            info
          </Badge>
          <Badge type="successSecondary" shape="rect">
            successSecondary
          </Badge>
          <Badge type="dangerSecondary" shape="rect">
            dangerSecondary
          </Badge>
          <Badge type="warnSecondary" shape="rect">
            warnSecondary
          </Badge>
          <Badge type="infoSecondary" shape="rect">
            infoSecondary
          </Badge>
        </Row>
        <Row label="Sizes">
          <Badge type="info" size="sm">
            sm
          </Badge>
          <Badge type="info" size="md">
            md
          </Badge>
        </Row>
        <Row label="With StatusDot">
          <Badge type="success">
            <StatusDot color="success" size="xs" className="mr-1" />
            Running
          </Badge>
          <Badge type="warn">
            <StatusDot color="warn" size="xs" className="mr-1" />
            Starting
          </Badge>
          <Badge type="danger">
            <StatusDot color="danger" size="xs" className="mr-1" />
            Error
          </Badge>
        </Row>
      </Section>

      <Section title="Button">
        <Row label="Variants">
          <Button color="primary" data-cy="btn">
            Primary
          </Button>
          <Button color="secondary" data-cy="btn">
            Secondary
          </Button>
          <Button color="light" data-cy="btn">
            Ghost
          </Button>
          <Button color="danger" data-cy="btn">
            Danger
          </Button>
        </Row>
        <Row label="With icon">
          <Button color="primary" icon={Check} data-cy="btn">
            Save
          </Button>
          <Button color="secondary" icon={Edit2} data-cy="btn">
            Edit
          </Button>
          <Button color="light" icon={RefreshCw} data-cy="btn">
            Restart
          </Button>
          <Button color="danger" icon={Trash2} data-cy="btn">
            Delete
          </Button>
        </Row>
        <Row label="Icon only">
          <Button color="secondary" icon={Edit2} data-cy="btn" />
          <Button color="light" icon={RefreshCw} data-cy="btn" />
        </Row>
        <Row label="Sizes">
          <Button color="secondary" size="small" data-cy="btn">
            Small
          </Button>
          <Button color="secondary" size="medium" data-cy="btn">
            Medium
          </Button>
        </Row>
        <Row label="Disabled">
          <Button color="primary" disabled data-cy="btn">
            Primary
          </Button>
          <Button color="secondary" disabled data-cy="btn">
            Secondary
          </Button>
        </Row>
      </Section>

      <Section title="Card + CardHeader">
        <Row label="With icon, subtitle, actions">
          <div className="w-[600px]">
            <Card.Container>
              <Card.Header
                title="Access Rules"
                subtitle="All users and teams with access to this resource"
                icon={Users}
                actions={
                  <Button color="secondary" icon={Edit2} data-cy="btn">
                    Edit
                  </Button>
                }
              />
              <p className="p-5 text-sm text-gray-6">
                Card body content goes here.
              </p>
            </Card.Container>
          </div>
        </Row>
        <Row label="With shadow">
          <div className="w-[600px]">
            <Card.Container shadow>
              <Card.Header
                title="Services"
                subtitle="Search and manage stack services"
                icon={Layers}
              />
              <p className="p-5 text-sm text-gray-6">
                Card with drop shadow (list style).
              </p>
            </Card.Container>
          </div>
        </Row>
        <Row label="Title only">
          <div className="w-[500px]">
            <Card.Container>
              <Card.Header
                title="Connection Settings"
                subtitle="Define how this endpoint is reached"
              />
              <p className="p-5 text-sm text-gray-6">No icon, no actions.</p>
            </Card.Container>
          </div>
        </Row>
      </Section>
    </>
  );
};
