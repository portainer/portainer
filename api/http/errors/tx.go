package errors

import (
	"errors"

	httperror "github.com/portainer/portainer/pkg/libhttp/error"
)

func TxResponse(err error, validResponse func() *httperror.HandlerError) *httperror.HandlerError {
	if err != nil {
		var handlerError *httperror.HandlerError
		if errors.As(err, &handlerError) {
			return handlerError
		}

		return httperror.InternalServerError("Unexpected error", err)
	}

	return validResponse()
}
