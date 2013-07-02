package main

import (
	"flag"
	"fmt"
	"github.com/elazarl/goproxy"
	"log"
	"net/http"
	"strings"
)

var (
	endpoint = flag.String("e", "", "Docker d endpoint.")
	verbose  = flag.Bool("v", false, "Verbose logging.")
	port     = flag.String("p", "9000", "Port to serve dockerui.")
	assets   = flag.String("-a", "/app", "Path to the assets.")
)

type multiHandler struct {
	base    http.Handler
	proxy   *goproxy.ProxyHttpServer
	verbose bool
}

func (h *multiHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if h.verbose {
		log.Printf("%s: %s\n", r.Method, r.URL.String())
	}
	if isDockerRequest(r.URL.String()) {
		h.proxy.ServeHTTP(w, r)
	} else {
		h.base.ServeHTTP(w, r)
	}
}

func isDockerRequest(url string) bool {
	return strings.Contains(url, "dockerapi/")
}

func createHandler(dir string) http.Handler {
	fileHandler := http.FileServer(http.Dir(dir))
	proxy := goproxy.NewProxyHttpServer()
	proxy.Verbose = *verbose

	proxy.OnRequest().DoFunc(func(r *http.Request, ctx *goproxy.ProxyCtx) (*http.Request, *http.Response) {
		c := http.Client{}
		path := strings.Replace(r.URL.RequestURI(), "dockerapi/", "", -1)
		n, err := http.NewRequest(r.Method, *endpoint+path, r.Body)
		n.Header = r.Header

		if err != nil {
			log.Fatal(err)
		}
		resp, err := c.Do(n)
		if err != nil {
			log.Fatal(err)
		}
		return r, resp

	})
	return &multiHandler{base: fileHandler, proxy: proxy, verbose: *verbose}
}

func main() {
	flag.Parse()

	handler := createHandler(*assets)

	path := fmt.Sprintf(":%s", *port)
	log.Fatal(http.ListenAndServe(path, handler))
}
