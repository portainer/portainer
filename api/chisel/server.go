package chisel

import (
	chserver "github.com/jpillora/chisel/server"
)

type Server struct {
	address     string
	port        string
	fingerprint string
}

func NewServer(address string, port string) *Server {
	return &Server{
		address: address,
		port:    port,
	}
}

// Start starts the reverse tunnel server
func (server *Server) Start() error {

	// TODO: keyseed management (persistence)
	// + auth management
	// Consider multiple users for auth?
	config := &chserver.Config{
		Reverse: true,
		KeySeed: "keyseedexample",
		Auth:    "agent@randomstring",
	}

	chiselServer, err := chserver.NewServer(config)
	if err != nil {
		return err
	}

	server.fingerprint = chiselServer.GetFingerprint()
	return chiselServer.Start(server.address, server.port)
}

func (server *Server) GetFingerprint() string {
	return server.fingerprint
}
