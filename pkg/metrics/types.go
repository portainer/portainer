package metrics

const (
	// AlertRuleIDLabel is the Prometheus label key used to correlate alerts
	// with their Portainer alert rule ID across agent and server packages.
	AlertRuleIDLabel = "alert_rule_id"
	// AlertTierLabel marks generated evaluator rules that belong to a parent tiered rule.
	AlertTierLabel = "portainer_alert_tier"

	ClusterCPUUsageCoresMetric                 = "portainer_edge_agent_cluster_cpu_usage_cores"
	ClusterCPUCapacityCoresMetric              = "portainer_edge_agent_cluster_cpu_capacity_cores"
	ClusterMemoryWorkingSetBytesMetric         = "portainer_edge_agent_cluster_memory_working_set_bytes"
	ClusterMemoryCapacityBytesMetric           = "portainer_edge_agent_cluster_memory_capacity_bytes"
	ClusterFilesystemUsedBytesMetric           = "portainer_edge_agent_cluster_filesystem_used_bytes"
	ClusterFilesystemCapacityBytesMetric       = "portainer_edge_agent_cluster_filesystem_capacity_bytes"
	ClusterNetworkReceiveBytesMetric           = "portainer_edge_agent_cluster_network_receive_bytes_total"
	ClusterNetworkTransmitBytesMetric          = "portainer_edge_agent_cluster_network_transmit_bytes_total"
	ClusterNodeReadyMetric                     = "portainer_edge_agent_node_ready"
	ClusterNodeUnschedulableMetric             = "portainer_edge_agent_node_unschedulable"
	ClusterEtcdHealthyMetric                   = "portainer_edge_agent_etcd_healthy"
	ClusterEtcdHealthValidMetric               = "portainer_edge_agent_etcd_health_valid"
	ClusterAPIServerTLSCertExpirySecondsMetric = "portainer_edge_agent_apiserver_tls_cert_expiry_seconds"
	ClusterAPIServerHealthyMetric              = "portainer_edge_agent_apiserver_healthy"
)

// EdgeAlertBatch is the generic envelope pushed by edge agents.
type EdgeAlertBatch struct {
	EnvironmentName string       `json:"environment_name"`
	Timestamp       int64        `json:"timestamp,omitempty"` // unix nanoseconds
	FiredAlerts     []FiredAlert `json:"fired_alerts,omitempty"`
	RawSignals      *RawSignals  `json:"raw_signals,omitempty"`
}

// FiredAlert represents a rule the agent has already evaluated and determined should fire.
type FiredAlert struct {
	RuleID   int    `json:"rule_id"`
	Severity string `json:"severity"`
	Message  string `json:"message"`
}

// RawSignals carries raw K8s cluster health data for future server-side evaluation.
type RawSignals struct {
	Workloads  []WorkloadItem  `json:"workloads,omitempty"`
	Conditions []ConditionItem `json:"conditions,omitempty"`
}

// ResourceRef identifies a Kubernetes resource.
type ResourceRef struct {
	Kind      string `json:"kind"`
	Name      string `json:"name"`
	Namespace string `json:"namespace"`
}

// ConditionItem holds a single Kubernetes condition observation.
type ConditionItem struct {
	Ref      ResourceRef `json:"ref"`
	Type     string      `json:"type"`
	Status   int8        `json:"status"` // -1 unknown, 0 unhealthy, 1 healthy
	Reason   string      `json:"reason"`
	NodeName string      `json:"node_name,omitempty"`
	PodName  string      `json:"pod_name,omitempty"`
}

// WorkloadItem holds a single Kubernetes workload replica observation.
type WorkloadItem struct {
	Ref       ResourceRef `json:"ref"`
	Desired   int         `json:"desired"`
	Available int         `json:"available"`
}

type AlertRuleStateType string

const (
	AlertRuleStateOK      AlertRuleStateType = "ok"
	AlertRuleStatePending AlertRuleStateType = "pending"
	AlertRuleStateFiring  AlertRuleStateType = "firing"
)

// EdgeAlertRuleState represents the evaluation state of a single alert rule on an edge agent.
type EdgeAlertRuleState struct {
	RuleID         int                `json:"rule_id"`
	State          AlertRuleStateType `json:"state"`
	LastEvaluation int64              `json:"last_evaluation,omitempty"` // unix milliseconds
	LastError      string             `json:"last_error,omitempty"`
}

// EdgeAlertState is the aggregate alert evaluation state reported by an edge agent.
type EdgeAlertState struct {
	Rules             []EdgeAlertRuleState `json:"rules"`
	ConfigReloadError string               `json:"config_reload_error,omitempty"`
}

// EdgeAlertRule is the agent-side representation of a compiled alert rule.
// The server generates and stores the PromQL expression at rule-write time;
// the agent is a pure evaluator with no rule-type logic.
//
// Fields like MetricType, Threshold, ConditionOperator, and Duration live
// on the server-side AlertingRule only (used by the alertexpr compiler to
// build PromQL). The agent receives the pre-compiled PromqlExpr together
// with rule metadata used for evaluation and reporting, including annotations.
type EdgeAlertRule struct {
	ID                 int               `json:"id"`
	Name               string            `json:"name"`
	Enabled            bool              `json:"enabled"`
	Severity           string            `json:"severity"`
	PromqlExpr         string            `json:"promql_expr"`
	ForDurationMinutes int               `json:"for_duration_minutes,omitempty"`
	Labels             map[string]string `json:"labels,omitempty"`
	Annotations        map[string]string `json:"annotations,omitempty"`
}
