package http

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"

	"github.com/gorilla/mux"
)

// InfluxDB queries.
const (
	InfluxSelectFrom = "SELECT time,value FROM %s WHERE container='%s' and time > '%s'"
	InfluxSelectTo   = "SELECT time,value FROM %s WHERE container='%s' and time >= '%s' and time <= '%s'"
)

// EsOpts ElasticSearch options.
type EsOpts struct {
	endpoint string
}

// InfluxOpts InfluxDB options.
type InfluxOpts struct {
	endpoint string
}

// MonitorOpts options to setup the monitor.
type MonitorOpts struct {
	ES     EsOpts
	Influx InfluxOpts
}

// MonitorHandler handles requests from the Portainer Handler.
type MonitorHandler struct {
	*mux.Router
	middleWareService *middleWareService
	logger            *log.Logger
	opts              MonitorOpts
}

// TimeRange as From/To timestamps.
type TimeRange struct {
	From string
	To   string
}

// Metric of a single timestamp of a container.
type Metric struct {
	Timestamp string `json:"timestamp"`
	CPUUsage  string `json:"cpu_usage"`
	MemUsage  string `json:"mem_usage"`
	RxBytes   int64  `json:"rx_bytes"`
	TxBytes   int64  `json:"tx_bytes"`
}

// InfluxDBResult structure for Unmarshaling.
type InfluxDBResult struct {
	Results []struct {
		Series []struct {
			Name    string          `json:"name"`
			Columns []string        `json:"columns"`
			Values  [][]interface{} `json:"values"`
		} `json:"series"`
	} `json:"results"`
}

// NewMonitorHandler returns a monitor handler using the middleWareService and setups the
// database clients with the opts argument.
func NewMonitorHandler(middleWareService *middleWareService, opts MonitorOpts) *MonitorHandler {
	h := &MonitorHandler{
		Router: mux.NewRouter(),
		logger: log.New(os.Stderr, "", log.LstdFlags),
		opts:   opts,
	}

	// TODO: Should use 'middleWareService'.
	h.Handle("/logs", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		h.queryLogs(w, r)
	}))

	h.Handle("/stats", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		h.queryStats(w, r)
	}))

	return h
}

func (h *MonitorHandler) queryLogs(w http.ResponseWriter, r *http.Request) {
	values := r.URL.Query()

	name, err := GetValue(&values, "name")
	if err != nil {
		Error(w, err, http.StatusBadRequest, h.logger)
		return
	}

	timeRange := GetTimeRange(&values)

	// create the query for ElasticSearch and buffer it.
	esQuery := createLogQuery(name, timeRange)
	buffer := &bytes.Buffer{}
	json.NewEncoder(buffer).Encode(esQuery)

	// create the request for ElasticSearch with the buffer (json data) as body.
	req, err := http.NewRequest("GET", h.opts.ES.endpoint, buffer)

	// send the request.
	res, err := http.DefaultClient.Do(req)
	if err != nil {
		Error(w, err, http.StatusBadRequest, h.logger)
		return
	}
	defer res.Body.Close()

	for k, vv := range res.Header {
		for _, v := range vv {
			w.Header().Add(k, v)
		}
	}
	if _, err := io.Copy(w, res.Body); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func (h *MonitorHandler) queryStats(w http.ResponseWriter, r *http.Request) {
	values := r.URL.Query()

	db, err := GetValue(&values, "db")
	if err != nil {
		Error(w, err, http.StatusBadRequest, h.logger)
		return
	}

	name, err := GetValue(&values, "name")
	if err != nil {
		Error(w, err, http.StatusBadRequest, h.logger)
		return
	}

	timeRange := GetTimeRange(&values)
	if timeRange.From == "" {
		Error(w, errors.New("from time not specified"), http.StatusBadRequest, h.logger)
		return
	}

	// create the query string.
	query := createStatsQuery("http://0.0.0.0:8086/query", db, name, timeRange,
		"cpu_usage", "mem_usage", "rx_bytes", "tx_bytes")

	// request InfluxDB.
	res, err := http.Get(query)
	if err != nil {
		panic(err)
	}
	defer res.Body.Close()

	decoder := json.NewDecoder(res.Body)
	decoder.UseNumber()

	result := InfluxDBResult{}
	err = decoder.Decode(&result)
	if err != nil {
		panic(err)
	}

	// assume that the response will always contain at least one serie.
	if len(result.Results) < 1 || len(result.Results[0].Series) < 1 {
		Error(w, errors.New("backend result error"), http.StatusInternalServerError, h.logger)
	}

	stats := make([]Metric, len(result.Results[0].Series[0].Values))

	// build the stats for metrics slice collecting each stat from each serie.
	for _, r := range result.Results {
		for _, serie := range r.Series {
			for i, m := range serie.Values {
				// since the query is {time,value}, the order will always be the same, so assume
				// column 0 is time and 1 is value.
				stats[i].Timestamp = m[0].(string)
				v := m[1].(json.Number)

				switch serie.Name {
				case "cpu_usage":
					n := v.String()
					stats[i].CPUUsage = n

				case "mem_usage":
					n := v.String()
					stats[i].MemUsage = n

				case "rx_bytes":
					n, err := v.Int64()
					if err != nil {
						panic(err)
					}
					stats[i].RxBytes = n

				case "tx_bytes":
					n, err := v.Int64()
					if err != nil {
						panic(err)
					}
					stats[i].TxBytes = n
				}
			}
		}
	}

	for k, vv := range res.Header {
		for _, v := range vv {
			w.Header().Add(k, v)
		}
	}

	err = json.NewEncoder(w).Encode(stats)
	if err != nil {
		Error(w, err, http.StatusInternalServerError, h.logger)
		return
	}
}

// GetValue returns a url value and a descriptive error if it doesn't exists.
func GetValue(v *url.Values, key string) (string, error) {
	value := v.Get(key)

	if value == "" {
		return "", errors.New("got empty value for key: " + key)
	}

	return value, nil
}

// GetTimeRange from the url values, with keys: `from`, `to`.
// `from` can be blank, in that case, the whole range is blank.
// `to` can be blank, in this case, it is set to `now`.
func GetTimeRange(v *url.Values) (t TimeRange) {
	from := v.Get("from")
	to := v.Get("to")

	t.From = from
	t.To = to

	if to == "" {
		t.To = "now"
	}

	if from == "" {
		// overwrite with empty range.
		t.To = ""
		t.From = ""
	}

	return
}

// ElasticSearch query to be encoded to JSON and sent as request body.
type ElasticSearch struct {
	Query struct {
		Bool struct {
			Must []interface{} `json:"must"`
		} `json:"bool"`
	} `json:"query"`

	Sort []interface{} `json:"sort"`

	Size int `json:"size"`
}

type Sort struct {
	Timestamp string `json:"@timestamp"`
}

type Term struct {
	Term struct {
		DockerId string `json:"name"`
	} `json:"term"`
}

type Range struct {
	Range struct {
		Timestamp struct {
			// These values are strings since we need to support the "now" keyword.
			From string `json:"gte"`
			To   string `json:"lte"`
		} `json:"@timestamp"`
	} `json:"range"`
}

// CreateLogQuery for ElasticSearch, using the name of the container and the timeRange.
// The From field almost always should be given, if blank, it will query all the logs,
// but this intended only for debugging, the To field can be "now" or a datetime.
func createLogQuery(name string, timeRange TimeRange) ElasticSearch {
	query := ElasticSearch{
		Size: 200,
	}

	// create the Must Term struct.
	mustTerm := Term{}
	mustTerm.Term.DockerId = name

	sort := Sort{Timestamp: "asc"}

	query.Query.Bool.Must = []interface{}{}
	query.Sort = []interface{}{}

	query.Query.Bool.Must = append(query.Query.Bool.Must, mustTerm)
	query.Sort = append(query.Sort, sort)

	if timeRange.From != "" {
		mustRange := Range{}
		mustRange.Range.Timestamp.From = timeRange.From
		mustRange.Range.Timestamp.To = timeRange.To

		query.Query.Bool.Must = append(query.Query.Bool.Must, mustRange)
	}

	return query
}

// CreateStatsQuery for InfluxDB, being able to concatenate multiple resource queries
// into one. The TimeRange must be a valid from value, and the to field can be a date or 'now'.
func createStatsQuery(endpoint, db, name string, tr TimeRange, resource ...string) string {
	values := url.Values{}
	values.Add("db", db)
	selects := ""

	// if the 'to' field is 'now', select every record until this point in time, otherwise,
	// limit the range.
	if tr.To == "now" {
		// for every resource, concatenate another query.
		for _, r := range resource {
			selects += fmt.Sprintf(InfluxSelectFrom, r, name, tr.From) + ";"
		}
	} else {
		// for every resource, concatenate another query.
		for _, r := range resource {
			selects += fmt.Sprintf(InfluxSelectTo, r, name, tr.From, tr.To) + ";"
		}
	}

	values.Add("q", selects)

	// returns the query as endpoint?q=<QUERY>&db=<DB>
	return endpoint + "?" + values.Encode()
}
