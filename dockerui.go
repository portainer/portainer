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
	"crypto/tls"
	"crypto/x509"
)

var (
	endpoint 	 = kingpin.Flag("host", "Dockerd endpoint").Default("unix:///var/run/docker.sock").Short('H').String()
	addr 		 	 = kingpin.Flag("bind", "Address and port to serve UI For Docker").Default(":9000").Short('p').String()
	assets   	 = kingpin.Flag("assets", "Path to the assets").Default(".").Short('a').String()
	data		 	 = kingpin.Flag("data", "Path to the data").Default(".").Short('d').String()
	swarm	   	 = kingpin.Flag("swarm", "Swarm cluster support").Default("false").Short('s').Bool()
	registries = LabelParser(kingpin.Flag("registries", "Supported Docker registries").Short('r'))
	tlsverify	 = kingpin.Flag("tlsverify", "TLS support").Default("false").Bool()
	tlscacert  = kingpin.Flag("tlscacert", "Path to the CA").Default("/certs/ca.pem").String()
	tlscert    = kingpin.Flag("tlscert", "Path to the TLS certificate file").Default("/certs/cert.pem").String()
	tlskey     = kingpin.Flag("tlskey", "Path to the TLS key").Default("/certs/key.pem").String()
	labels     = LabelParser(kingpin.Flag("hide-label", "Hide containers with a specific label in the UI").Short('l'))
	authKey  []byte
	authKeyFile = "authKey.dat"
)

type UnixHandler struct {
	path string
}

type TlsFlags struct {
	tls bool
	caPath string
	certPath string
	keyPath string
}

type Config struct {
	Swarm bool `json:"swarm"`
	HiddenLabels Labels `json:"hiddenLabels"`
	Registries Labels `json:"registries"`
}

type Label struct {
	Name string `json:"name"`
	Value string `json:"value"`
}

type Labels []Label

func (l *Labels) Set(value string) error {
  parts := strings.SplitN(value, "=", 2)
  if len(parts) != 2 {
    return fmt.Errorf("expected NAME=VALUE got '%s'", value)
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

func createTcpHandler(u *url.URL) http.Handler {
	u.Scheme = "http";
	return httputil.NewSingleHostReverseProxy(u)
}

func createTlsConfig(tlsFlags TlsFlags) *tls.Config {
	cert, err := tls.LoadX509KeyPair(tlsFlags.certPath, tlsFlags.keyPath)
	if err != nil {
		log.Fatal(err)
	}
	caCert, err := ioutil.ReadFile(tlsFlags.caPath)
	if err != nil {
		log.Fatal(err)
	}
	caCertPool := x509.NewCertPool()
	caCertPool.AppendCertsFromPEM(caCert)
	tlsConfig := &tls.Config{
		Certificates: []tls.Certificate{cert},
		RootCAs:      caCertPool,
	}
	return tlsConfig;
}

func createTcpHandlerWithTLS(u *url.URL, tlsFlags TlsFlags) http.Handler {
	u.Scheme = "https";
	var tlsConfig = createTlsConfig(tlsFlags)
	proxy := httputil.NewSingleHostReverseProxy(u)
	proxy.Transport = &http.Transport{
		TLSClientConfig: tlsConfig,
	}
	return proxy;
}

func createUnixHandler(e string) http.Handler {
	return &UnixHandler{e}
}

func createHandler(dir string, d string, e string, c Config, tlsFlags TlsFlags) http.Handler {
	var (
		mux         = http.NewServeMux()
		fileHandler = http.FileServer(http.Dir(dir))
		h           http.Handler
	)
	u, perr := url.Parse(e)
	if perr != nil {
		log.Fatal(perr)
	}
	if u.Scheme == "tcp" {
		if tlsFlags.tls {
			h = createTcpHandlerWithTLS(u, tlsFlags)
		} else {
			h = createTcpHandler(u)
		}
	} else if u.Scheme == "unix" {
		var socketPath = u.Path
		if _, err := os.Stat(socketPath); err != nil {
			if os.IsNotExist(err) {
				log.Fatalf("unix socket %s does not exist", socketPath)
			}
			log.Fatal(err)
		}
		h = createUnixHandler(socketPath)
	} else {
		log.Fatalf("Bad Docker enpoint: %s. Only unix:// and tcp:// are supported.", e)
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
	kingpin.Version("1.3.0")
	kingpin.Parse()

	configuration := Config{
		Swarm: *swarm,
		HiddenLabels: *labels,
		Registries: *registries,
	}

	tlsFlags := TlsFlags{
		tls: *tlsverify,
		caPath: *tlscacert,
		certPath: *tlscert,
		keyPath: *tlskey,
	}

	handler := createHandler(*assets, *data, *endpoint, configuration, tlsFlags)
	if err := http.ListenAndServe(*addr, handler); err != nil {
		log.Fatal(err)
	}
}
