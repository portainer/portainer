package http

import (
	"github.com/gorilla/mux"
	"net/http"
	"bytes"
	"encoding/json"
	"net/url"
	"errors"
	"log"
	"os"
	"io"
	"fmt"
)

const (
	INFLUX_SELECT_FROM = "SELECT * FROM %s WHERE container='%s' and time > '%s'"
	INFLUX_SELECT_TO   = "SELECT * FROM %s WHERE container='%s' and time >= '%s' and time < '%s'"
)

type EsOpts struct {
	endpoint string
}

type InfluxOpts struct {
	endpoint string
}

type MonitorOpts struct {
	ES     EsOpts
	Influx InfluxOpts
}

type MonitorHandler struct {
	*mux.Router
	middleWareService *middleWareService
	logger            *log.Logger
	opts              MonitorOpts
}

type TimeRange struct {
	From string
	To   string
}

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

	resource, err := GetValue(&values, "resource")
	if err != nil {
		Error(w, err, http.StatusBadRequest, h.logger)
		return
	}

	timeRange := GetTimeRange(&values)

	if timeRange.From == "" {
		Error(w, errors.New("From time not specified."), http.StatusBadRequest, h.logger)
		return
	}

	// create the query string.
	query := createStatsQuery(h.opts.Influx.endpoint, db, resource, name, timeRange)

	// request InfluxDB.
	res, err := http.Get(query)
	if err != nil {
		Error(w, err, http.StatusInternalServerError, h.logger)
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

// Gets value from the url values, returning a descriptive error if it doesn't exists.
func GetValue(v *url.Values, key string) (string, error) {
	value := v.Get(key)

	if value == "" {
		return "", errors.New("Got empty value for key: " + key)
	}

	return value, nil
}

// Gets time range from the url values, with keys: `from`, `to`.
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

func createStatsQuery(endpoint, db, resource, name string, timeRange TimeRange) string {
	values := url.Values{}
	values.Add("db", db)

	if timeRange.To == "now" {
		values.Add("q", fmt.Sprintf(INFLUX_SELECT_FROM, resource, name, timeRange.From))
	} else {
		values.Add("q", fmt.Sprintf(INFLUX_SELECT_TO, resource, name, timeRange.From, timeRange.To))
	}

	return endpoint + "?" + values.Encode()
}
