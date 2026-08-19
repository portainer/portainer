package logoutcontext

import (
	"context"
)

const LogoutPrefix = "logout-"

func GetContext(token string) context.Context {
	return GetService(logoutToken(token)).GetLogoutCtx()
}

func Cancel(token string) {
	GetService(logoutToken(token)).Cancel()
	RemoveService(logoutToken(token))
}

func logoutToken(token string) string {
	return LogoutPrefix + token
}
