package logoutcontext

import (
	"context"
)

type (
	Service struct {
		ctx    context.Context
		cancel context.CancelFunc
	}
)

func NewService() *Service {
	ctx, cancel := context.WithCancel(context.Background())
	return &Service{
		ctx:    ctx,
		cancel: cancel,
	}
}

func (s *Service) Cancel() {
	s.cancel()
}

func (s *Service) GetLogoutCtx() context.Context {
	return s.ctx
}
