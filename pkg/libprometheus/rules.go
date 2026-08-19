package libprometheus

import (
	"context"
	"slices"
	"strconv"
	"time"

	pkgmetrics "github.com/portainer/portainer/pkg/metrics"
	prometheusreg "github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/prometheus/model/labels"
	"github.com/prometheus/prometheus/promql"
	"github.com/prometheus/prometheus/rules"
	"github.com/prometheus/prometheus/storage"
)

// RuleManagerConfig holds the parameters needed to construct a Prometheus rules.Manager.
type RuleManagerConfig struct {
	Engine     *promql.Engine
	Queryable  storage.Queryable
	Appendable storage.Appendable
	NotifyFunc rules.NotifyFunc
	Context    context.Context
	Registerer prometheusreg.Registerer
}

// NewRuleManager constructs a Prometheus rules.Manager from the given config.
func NewRuleManager(cfg RuleManagerConfig) *rules.Manager {
	return rules.NewManager(&rules.ManagerOptions{
		QueryFunc:  rules.EngineQueryFunc(cfg.Engine, cfg.Queryable),
		Appendable: cfg.Appendable,
		Queryable:  cfg.Queryable,
		NotifyFunc: cfg.NotifyFunc,
		Context:    cfg.Context,
		Logger:     NewZerologSlogger(),
		Registerer: cfg.Registerer,
	})
}

// ReloadRules updates the active rule set on a rules.Manager from a YAML file.
// Pass an empty alertsFilePath to clear all rules.
func ReloadRules(mgr *rules.Manager, evalInterval time.Duration, alertsFilePath string) error {
	var files []string
	if alertsFilePath != "" {
		files = []string{alertsFilePath}
	}

	return mgr.Update(evalInterval, files, labels.EmptyLabels(), "", nil)
}

// ExtractAlertStates returns the current evaluation state for each alerting rule
// managed by the given rules.Manager.
func ExtractAlertStates(mgr *rules.Manager) []pkgmetrics.EdgeAlertRuleState {
	type aggregateState struct {
		state          pkgmetrics.AlertRuleStateType
		lastEvaluation int64
		lastError      string
		severity       string
	}

	aggregated := make(map[int]aggregateState)

	for _, group := range mgr.RuleGroups() {
		for _, rule := range group.Rules() {
			alertRule, ok := rule.(*rules.AlertingRule)
			if !ok {
				continue
			}

			ruleIDStr := alertRule.Labels().Get(pkgmetrics.AlertRuleIDLabel)
			ruleID, err := strconv.Atoi(ruleIDStr)
			if err != nil || ruleID <= 0 {
				continue
			}

			state := pkgmetrics.AlertRuleStateOK
			for _, a := range alertRule.ActiveAlerts() {
				switch a.State {
				case rules.StateFiring:
					state = pkgmetrics.AlertRuleStateFiring
				case rules.StatePending:
					if state != pkgmetrics.AlertRuleStateFiring {
						state = pkgmetrics.AlertRuleStatePending
					}
				}
			}

			var lastErr string
			if alertRule.LastError() != nil {
				lastErr = alertRule.LastError().Error()
			}

			tierSeverity := alertRule.Labels().Get(pkgmetrics.AlertTierLabel)
			statePriority := alertStatePriority(state)
			evalMillis := alertRule.GetEvaluationTimestamp().UnixMilli()

			existing, exists := aggregated[ruleID]
			if !exists {
				aggregated[ruleID] = aggregateState{
					state:          state,
					lastEvaluation: evalMillis,
					lastError:      lastErr,
					severity:       tierSeverity,
				}
				continue
			}

			existingStatePriority := alertStatePriority(existing.state)
			winsState := statePriority > existingStatePriority
			tiebreakWins := statePriority == existingStatePriority && tierSeverityPriority(tierSeverity) > tierSeverityPriority(existing.severity)

			if winsState || tiebreakWins {
				existing.state = state
				existing.severity = tierSeverity
				existing.lastError = lastErr
			}

			if evalMillis > existing.lastEvaluation {
				existing.lastEvaluation = evalMillis
			}

			aggregated[ruleID] = existing
		}
	}

	if len(aggregated) == 0 {
		return nil
	}

	ruleIDs := make([]int, 0, len(aggregated))
	for ruleID := range aggregated {
		ruleIDs = append(ruleIDs, ruleID)
	}
	slices.Sort(ruleIDs)

	states := make([]pkgmetrics.EdgeAlertRuleState, 0, len(ruleIDs))
	for _, ruleID := range ruleIDs {
		state := aggregated[ruleID]
		states = append(states, pkgmetrics.EdgeAlertRuleState{
			RuleID:         ruleID,
			State:          state.state,
			LastEvaluation: state.lastEvaluation,
			LastError:      state.lastError,
		})
	}

	return states
}

func alertStatePriority(state pkgmetrics.AlertRuleStateType) int {
	switch state {
	case pkgmetrics.AlertRuleStateFiring:
		return 2
	case pkgmetrics.AlertRuleStatePending:
		return 1
	default:
		return 0
	}
}

// tierSeverityPriority mirrors the canonical severity ordering from the EE
// alertexpr package. CE cannot import EE, so this is a
// deliberate duplicate — keep the values aligned if the canonical list changes.
func tierSeverityPriority(severity string) int {
	switch severity {
	case "critical":
		return 2
	case "warning":
		return 1
	case "info":
		return 0
	default:
		return -1
	}
}
