import { useMemo, useState } from 'react';
import { CircleCheck, CircleX, Shield, TriangleAlert } from 'lucide-react';

import { EnvironmentId } from '@/react/portainer/environments/types';

import { Widget } from '@@/Widget';

import {
  CheckStatus,
  SecurityCheck,
  useContainerSecurity,
} from './useContainerSecurity';

const COLORS: Record<CheckStatus, { main: string; bg: string }> = {
  pass: { main: '#3f8a2f', bg: 'rgba(63,138,47,0.15)' },
  warn: { main: '#b7791f', bg: 'rgba(183,121,31,0.15)' },
  fail: { main: '#c53030', bg: 'rgba(197,48,48,0.15)' },
};

const SEVERITY_COLORS: Record<string, { main: string; bg: string }> = {
  critical: { main: '#9b2c2c', bg: 'rgba(155,44,44,0.15)' },
  high: { main: '#c53030', bg: 'rgba(197,48,48,0.12)' },
  medium: { main: '#b7791f', bg: 'rgba(183,121,31,0.12)' },
  low: { main: '#718096', bg: 'rgba(113,128,150,0.12)' },
};

const LABELS: Record<CheckStatus, string> = {
  pass: 'Pass',
  warn: 'Warn',
  fail: 'Fail',
};

const ICONS = {
  pass: CircleCheck,
  warn: TriangleAlert,
  fail: CircleX,
};

const STATUS_ORDER: Record<CheckStatus, number> = {
  fail: 0,
  warn: 1,
  pass: 2,
};

const CIRCUMFERENCE = 2 * Math.PI * 52;

function getGaugeColor(score: number) {
  if (score >= 80) return COLORS.pass.main;
  if (score >= 50) return COLORS.warn.main;
  return COLORS.fail.main;
}

type Filter = 'all' | CheckStatus;

export function SecurityScoreSection({
  environmentId,
  containerId,
  nodeName,
}: {
  environmentId: EnvironmentId;
  containerId: string;
  nodeName?: string;
}) {
  const [filter, setFilter] = useState<Filter>('all');

  const securityQuery = useContainerSecurity(environmentId, containerId, {
    nodeName,
  });

  const sortedChecks = useMemo(() => {
    if (!securityQuery.data) return [];
    const list = [...securityQuery.data.checks];
    list.sort((a, b) => {
      const byStatus = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
      if (byStatus !== 0) return byStatus;
      return (b.weight ?? 0) - (a.weight ?? 0);
    });
    if (filter === 'all') return list;
    return list.filter((c) => c.status === filter);
  }, [securityQuery.data, filter]);

  if (!securityQuery.data) {
    return null;
  }

  const { checks, score } = securityQuery.data;

  const counts: Record<CheckStatus, number> = {
    pass: securityQuery.data.passCount,
    warn: securityQuery.data.warnCount,
    fail: securityQuery.data.failCount,
  };

  return (
    <Widget>
      <Widget.Title icon={Shield} title="Security score" />
      <Widget.Body>
        <p className="mb-4 text-sm opacity-70">
          The score is based on weighted security checks. A higher score indicates a safer configuration.
          Pass, Warn, and Fail show the current result; severity describes the potential impact if a check fails.
        </p>
        <div className="mb-4 flex flex-wrap items-center gap-8">
          <svg width="130" height="130" viewBox="0 0 130 130" role="img">
            <title>{`Security score ${score} out of 100`}</title>
            <circle
              cx="65"
              cy="65"
              r="52"
              fill="none"
              stroke="rgba(128,128,128,0.25)"
              strokeWidth="12"
            />
            <circle
              cx="65"
              cy="65"
              r="52"
              fill="none"
              stroke={getGaugeColor(score)}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={`${(score / 100) * CIRCUMFERENCE} ${CIRCUMFERENCE}`}
              transform="rotate(-90 65 65)"
            />
            <text
              x="65"
              y="68"
              textAnchor="middle"
              fontSize="30"
              fontWeight="500"
              fill="currentColor"
            >
              {score}
            </text>
          </svg>

          <div className="min-w-[180px] flex-1">
            <p className="mb-2 text-sm opacity-70">Checks by result</p>
            <div className="space-y-2">
              {(['pass', 'warn', 'fail'] as CheckStatus[]).map((status) => (
                <button
                  key={status}
                  type="button"
                  className="flex w-full items-center gap-3 border-0 bg-transparent p-0 text-left text-sm"
                  onClick={() =>
                    setFilter((prev) => (prev === status ? 'all' : status))
                  }
                  style={{
                    opacity: filter === 'all' || filter === status ? 1 : 0.45,
                  }}
                >
                  <span className="w-10">{LABELS[status]}</span>
                  <div
                    className="h-2.5 flex-1 rounded"
                    style={{ background: 'rgba(128,128,128,0.2)' }}
                  >
                    <div
                      className="h-2.5 rounded"
                      style={{
                        width: `${checks.length ? (counts[status] / checks.length) * 100 : 0}%`,
                        background: COLORS[status].main,
                      }}
                    />
                  </div>
                  <span className="w-4 text-right">{counts[status]}</span>
                </button>
              ))}
            </div>
            {filter !== 'all' && (
              <button
                type="button"
                className="mt-2 border-0 bg-transparent p-0 text-xs opacity-70 underline"
                onClick={() => setFilter('all')}
              >
                Show all checks
              </button>
            )}
          </div>
        </div>

        <div>
          {sortedChecks.map((check) => (
            <CheckRow key={check.id} check={check} />
          ))}
          {sortedChecks.length === 0 && (
            <p className="py-4 text-center text-sm opacity-60">
              No checks match this filter.
            </p>
          )}
        </div>
      </Widget.Body>
    </Widget>
  );
}

function CheckRow({ check }: { check: SecurityCheck }) {
  const Icon = ICONS[check.status];
  const severity = check.severity ?? 'medium';
  const sevColor = SEVERITY_COLORS[severity] ?? SEVERITY_COLORS.medium;

  return (
    <div
      className="flex items-start gap-3 border-0 border-t border-solid py-2.5"
      style={{ borderColor: 'rgba(128,128,128,0.25)' }}
    >
      <Icon size={18} color={COLORS[check.status].main} className="mt-0.5" />
      <div className="min-w-0 flex-1 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{check.title}</span>
          <span
            className="rounded px-1.5 py-0.5 text-[10px] uppercase tracking-wide"
            style={{ background: sevColor.bg, color: sevColor.main }}
          >
            {check.status === 'pass'
              ? `Potential risk: ${severity}`
              : `Severity: ${severity}`}
          </span>
          {typeof check.weight === 'number' && (
            <span className="text-[10px] opacity-50">w{check.weight}</span>
          )}
        </div>
        <div className="opacity-70">{check.description}</div>
        {check.status !== 'pass' && (
          <div className="mt-1 space-y-0.5 text-xs">
            <div>
              <span className="font-medium">Why it matters: </span>
              {check.risk}
            </div>
            <div>
              <span className="font-medium">How to fix: </span>
              {check.fix}
            </div>
          </div>
        )}
      </div>
      <span
        className="shrink-0 rounded px-2 py-0.5 text-xs"
        style={{
          background: COLORS[check.status].bg,
          color: COLORS[check.status].main,
        }}
      >
        {LABELS[check.status]}
      </span>
    </div>
  );
}
