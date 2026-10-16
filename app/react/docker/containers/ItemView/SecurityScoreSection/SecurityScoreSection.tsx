import { CircleCheck, CircleX, Shield, TriangleAlert } from 'lucide-react';

import { EnvironmentId } from '@/react/portainer/environments/types';

import { Widget } from '@@/Widget';

import { useContainerInspect } from '../../queries/useContainerInspect';

import { CheckStatus, getScore, getSecurityChecks } from './securityChecks';

const COLORS: Record<CheckStatus, { main: string; bg: string }> = {
  pass: { main: '#3f8a2f', bg: 'rgba(63,138,47,0.15)' },
  warn: { main: '#b7791f', bg: 'rgba(183,121,31,0.15)' },
  fail: { main: '#c53030', bg: 'rgba(197,48,48,0.15)' },
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

const CIRCUMFERENCE = 2 * Math.PI * 52;

function getGaugeColor(score: number) {
  if (score >= 80) {
    return COLORS.pass.main;
  }
  if (score >= 50) {
    return COLORS.warn.main;
  }
  return COLORS.fail.main;
}

export function SecurityScoreSection({
  environmentId,
  containerId,
  nodeName,
}: {
  environmentId: EnvironmentId;
  containerId: string;
  nodeName?: string;
}) {
  const inspectQuery = useContainerInspect(environmentId, containerId, {
    nodeName,
  });

  if (!inspectQuery.data) {
    return null;
  }

  const checks = getSecurityChecks(inspectQuery.data);
  const score = getScore(checks);

  const counts: Record<CheckStatus, number> = { pass: 0, warn: 0, fail: 0 };
  checks.forEach((c) => {
    counts[c.status] += 1;
  });

  return (
    <Widget>
      <Widget.Title icon={Shield} title="Security score" />
      <Widget.Body>
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
            <text
              x="65"
              y="88"
              textAnchor="middle"
              fontSize="12"
              fill="currentColor"
              opacity="0.7"
            >
              out of 100
            </text>
          </svg>

          <div className="min-w-[200px] flex-1">
            <p className="mb-2 text-sm opacity-70">Checks by result</p>
            <div className="space-y-2">
              {(['pass', 'warn', 'fail'] as CheckStatus[]).map((status) => (
                <div key={status} className="flex items-center gap-3 text-sm">
                  <span className="w-10">{LABELS[status]}</span>
                  <div
                    className="h-2.5 flex-1 rounded"
                    style={{ background: 'rgba(128,128,128,0.2)' }}
                  >
                    <div
                      className="h-2.5 rounded"
                      style={{
                        width: `${(counts[status] / checks.length) * 100}%`,
                        background: COLORS[status].main,
                      }}
                    />
                  </div>
                  <span className="w-4 text-right">{counts[status]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          {checks.map((check) => {
            const Icon = ICONS[check.status];
            return (
              <div
                key={check.id}
                className="flex items-center gap-3 border-0 border-t border-solid py-2.5"
                style={{ borderColor: 'rgba(128,128,128,0.25)' }}
              >
                <Icon size={18} color={COLORS[check.status].main} />
                <div className="flex-1 text-sm">
                  <div className="font-medium">{check.title}</div>
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
                  className="rounded px-2 py-0.5 text-xs"
                  style={{
                    background: COLORS[check.status].bg,
                    color: COLORS[check.status].main,
                  }}
                >
                  {LABELS[check.status]}
                </span>
              </div>
            );
          })}
        </div>
      </Widget.Body>
    </Widget>
  );
}
