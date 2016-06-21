package main // import "github.com/cloudinovasi/ui-for-docker"

import (
	"flag"
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
)

var (
	endpoint = flag.String("e", "/var/run/docker.sock", "Dockerd endpoint")
	addr     = flag.String("p", ":9000", "Address and port to serve UI For Docker")
	assets   = flag.String("a", ".", "Path to the assets")
	swarm		 = flag.Bool("swarm", false, "Swarm mode")
	authKey  []byte
	authKeyFile = "authKey.dat"
)

type UnixHandler struct {
	path string
}

type Config struct {
	Swarm bool `json:"swarm"`
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

func createHandler(dir string, e string, s bool) http.Handler {
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
	dat, err := ioutil.ReadFile(authKeyFile)
	if err != nil {
		fmt.Println(err)
		authKey = securecookie.GenerateRandomKey(32)
		err := ioutil.WriteFile(authKeyFile, authKey, 0644)
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

	configuration := Config{
		Swarm: s,
	}

	mux.Handle("/dockerapi/", http.StripPrefix("/dockerapi", h))
	mux.Handle("/", fileHandler)
	mux.HandleFunc("/config", func(w http.ResponseWriter, r *http.Request) {
  	configurationHandler(w, r, configuration)
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
	flag.Parse()

	handler := createHandler(*assets, *endpoint, *swarm)
	if err := http.ListenAndServe(*addr, handler); err != nil {
		log.Fatal(err)
	}
}
