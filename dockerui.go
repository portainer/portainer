package main // import "github.com/cloudinovasi/ui-for-docker"

import (
	"io"
	"log"
	"net"
	"net/http"
	"net/http/httputil"
	"net/url"
	"encoding/json"
	"os"
	"strings"
	"github.com/gorilla/csrf"
	"io/ioutil"
	"fmt"
	"github.com/gorilla/securecookie"
	"gopkg.in/alecthomas/kingpin.v2"
)

var (
	endpoint = kingpin.Flag("endpoint", "Dockerd endpoint").Default("/var/run/docker.sock").Short('e').String()
	addr 		 = kingpin.Flag("bind", "Address and port to serve UI For Docker").Default(":9000").Short('p').String()
	assets   = kingpin.Flag("assets", "Path to the assets").Default(".").Short('a').String()
	data		 = kingpin.Flag("data", "Path to the data").Default(".").Short('d').String()
	swarm	   = kingpin.Flag("swarm", "Swarm cluster support").Default("false").Short('s').Bool()
	labels   = LabelParser(kingpin.Flag("hide-label", "Hide containers with a specific label in the UI").Short('l'))
	authKey  []byte
	authKeyFile = "authKey.dat"
)

type UnixHandler struct {
	path string
}

type Config struct {
	Swarm bool `json:"swarm"`
	HiddenLabels Labels `json:"hiddenLabels"`
}

type Label struct {
	Name string `json:"name"`
	Value string `json:"value"`
}

type Labels []Label

func (l *Labels) Set(value string) error {
  parts := strings.SplitN(value, "=", 2)
  if len(parts) != 2 {
    return fmt.Errorf("expected HEADER=VALUE got '%s'", value)
  }
	label := new(Label)
  label.Name = parts[0]
	label.Value = parts[1]
	*l = append(*l, *label)
  return nil
}

func (l *Labels) String() string {
  return ""
}

func (l *Labels) IsCumulative() bool {
  return true
}

func LabelParser(s kingpin.Settings) (target *[]Label) {
	target = new([]Label)
  s.SetValue((*Labels)(target))
  return
}

func (h *UnixHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	conn, err := net.Dial("unix", h.path)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		log.Println(err)
		return
	}
	c := httputil.NewClientConn(conn, nil)
	defer c.Close()

	res, err := c.Do(r)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		log.Println(err)
		return
	}
	defer res.Body.Close()

	copyHeader(w.Header(), res.Header)
	if _, err := io.Copy(w, res.Body); err != nil {
		log.Println(err)
	}
}

func copyHeader(dst, src http.Header) {
	for k, vv := range src {
		for _, v := range vv {
			dst.Add(k, v)
		}
	}
}

func configurationHandler(w http.ResponseWriter, r *http.Request, c Config) {
    json.NewEncoder(w).Encode(c)
}

func createTcpHandler(e string) http.Handler {
	u, err := url.Parse(e)
	if err != nil {
		log.Fatal(err)
	}
	return httputil.NewSingleHostReverseProxy(u)
}

func createUnixHandler(e string) http.Handler {
	return &UnixHandler{e}
}

func createHandler(dir string, d string, e string, c Config) http.Handler {
	var (
		mux         = http.NewServeMux()
		fileHandler = http.FileServer(http.Dir(dir))
		h           http.Handler
	)

	if strings.Contains(e, "http") {
		h = createTcpHandler(e)
	} else {
		if _, err := os.Stat(e); err != nil {
			if os.IsNotExist(err) {
				log.Fatalf("unix socket %s does not exist", e)
			}
			log.Fatal(err)
		}
		h = createUnixHandler(e)
	}

	// Use existing csrf authKey if present or generate a new one.
	var authKeyPath = d + "/" + authKeyFile
	dat, err := ioutil.ReadFile(authKeyPath)
	if err != nil {
		fmt.Println(err)
		authKey = securecookie.GenerateRandomKey(32)
		err := ioutil.WriteFile(authKeyPath, authKey, 0644)
		if err != nil {
			fmt.Println("unable to persist auth key", err)
		}
	} else {
		authKey = dat
	}

	CSRF := csrf.Protect(
		authKey,
		csrf.HttpOnly(false),
		csrf.Secure(false),
	)

	mux.Handle("/dockerapi/", http.StripPrefix("/dockerapi", h))
	mux.Handle("/", fileHandler)
	mux.HandleFunc("/config", func(w http.ResponseWriter, r *http.Request) {
  	configurationHandler(w, r, c)
  })
	return CSRF(csrfWrapper(mux))
}

func csrfWrapper(h http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-CSRF-Token", csrf.Token(r))
		h.ServeHTTP(w, r)
	})
}

func main() {
	kingpin.Version("1.2.0")
	kingpin.Parse()

	configuration := Config{
		Swarm: *swarm,
		HiddenLabels: *labels,
	}

	handler := createHandler(*assets, *data, *endpoint, configuration)
	if err := http.ListenAndServe(*addr, handler); err != nil {
		log.Fatal(err)
	}
}
