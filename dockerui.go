package main

import (
	"flag"
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
)

var (
	endpoint = flag.String("e", "", "Dockerd endpoint")
	addr     = flag.String("p", ":9000", "Address and port to serve dockerui")
	assets   = flag.String("a", ".", "Path to the assets")
)

func createHandler(dir string, dockerEndpoint string) http.Handler {
	mux := http.NewServeMux()

	fileHandler := http.FileServer(http.Dir(dir))
	u, err := url.Parse(dockerEndpoint)
	if err != nil {
		log.Fatal(err)
		return nil
	}
	reverseProxy := httputil.NewSingleHostReverseProxy(u)

	mux.Handle("/dockerapi/", http.StripPrefix("/dockerapi", reverseProxy))
	mux.Handle("/", fileHandler)

	return mux
}

func main() {
	flag.Parse()

	handler := createHandler(*assets, *endpoint)
	if err := http.ListenAndServe(*addr, handler); err != nil {
		log.Fatal(err)
	}
}
