package libprometheus

import (
	"context"
	"io"
	"time"

	dto "github.com/prometheus/client_model/go"
	"github.com/prometheus/common/expfmt"
	prommodel "github.com/prometheus/common/model"
	"github.com/prometheus/prometheus/model/labels"
	"github.com/prometheus/prometheus/storage"
	"github.com/rs/zerolog/log"
)

// AppendExpositionSamples parses Prometheus exposition-format metrics from r
// and appends them as samples to the given Appendable.
func AppendExpositionSamples(ctx context.Context, db storage.Appendable, r io.Reader) error {
	parser := expfmt.NewTextParser(prommodel.UTF8Validation)
	metricFamilies, err := parser.TextToMetricFamilies(r)
	if err != nil {
		return err
	}

	app := db.Appender(ctx)
	now := time.Now().UnixMilli()

	for name, mf := range metricFamilies {
		if !supportsScalarMetricType(mf.GetType()) {
			continue
		}

		for _, m := range mf.GetMetric() {
			lbls := LabelsFromMetric(name, m)
			value := ValueFromMetric(m, mf.GetType())
			if _, err := app.Append(0, lbls, now, value); err != nil {
				log.Debug().Err(err).Str("metric", name).Msg("failed to append metric sample")
			}
		}
	}

	return app.Commit()
}

func supportsScalarMetricType(mtype dto.MetricType) bool {
	switch mtype {
	case dto.MetricType_COUNTER, dto.MetricType_GAUGE, dto.MetricType_UNTYPED:
		return true
	default:
		return false
	}
}

// LabelsFromMetric builds a labels.Labels from a metric name and its label pairs.
func LabelsFromMetric(name string, m *dto.Metric) labels.Labels {
	b := labels.NewScratchBuilder(1 + len(m.GetLabel()))
	b.Add(string(prommodel.MetricNameLabel), name)
	for _, lp := range m.GetLabel() {
		b.Add(lp.GetName(), lp.GetValue())
	}
	b.Sort()
	return b.Labels()
}

// ValueFromMetric extracts the numeric value from a metric based on its type.
func ValueFromMetric(m *dto.Metric, mtype dto.MetricType) float64 {
	switch mtype {
	case dto.MetricType_COUNTER:
		if c := m.GetCounter(); c != nil {
			return c.GetValue()
		}
	case dto.MetricType_GAUGE:
		if g := m.GetGauge(); g != nil {
			return g.GetValue()
		}
	case dto.MetricType_UNTYPED:
		if u := m.GetUntyped(); u != nil {
			return u.GetValue()
		}
	}
	return 0
}
