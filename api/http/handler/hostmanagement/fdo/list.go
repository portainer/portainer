package fdo

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/response"

	"github.com/rs/zerolog/log"
)

// @id fdoListAll
// @summary List all known FDO vouchers
// @description List all known FDO vouchers
// @description **Access policy**: administrator
// @tags intel
// @security jwt
// @produce json
// @success 200 "Success"
// @failure 400 "Invalid request"
// @failure 403 "Permission denied to access settings"
// @failure 500 "Server error"
// @router /fdo/list [get]
func (handler *Handler) fdoListAll(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	fdoClient, err := handler.newFDOClient()
	if err != nil {
		log.Error().Err(err).Msg("fdoListAll: newFDOClient()")
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "fdoRegisterDevice: newFDOClient()", Err: err}
	}

	// Get all vouchers
	guids, err := fdoClient.GetVouchers()
	if err != nil {
		log.Error().Err(err).Msg("fdoListAll: GetVouchers()")
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "fdoListAll: GetVouchers()", Err: err}
	}

	return response.JSON(w, guids)
}
