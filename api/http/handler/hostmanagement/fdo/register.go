package fdo

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"

	"github.com/rs/zerolog/log"
)

type registerDeviceResponse struct {
	Guid string `json:"guid" example:"c6ea3343-229a-4c07-9096-beef7134e1d3"`
}

// @id fdoRegisterDevice
// @summary register an FDO device
// @description register an FDO device
// @description **Access policy**: administrator
// @tags intel
// @security jwt
// @produce json
// @success 200 "Success"
// @failure 400 "Invalid request"
// @failure 403 "Permission denied to access settings"
// @failure 500 "Server error"
// @router /fdo/register [post]
func (handler *Handler) fdoRegisterDevice(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	// Post a voucher
	ov, filename, err := request.RetrieveMultiPartFormFile(r, "voucher")
	if err != nil {
		log.Info().Str("filename", filename).Err(err).Msg("fdoRegisterDevice: readVoucher()")

		return httperror.InternalServerError("fdoRegisterDevice: read Voucher()", err)
	}

	fdoClient, err := handler.newFDOClient()
	if err != nil {
		log.Info().Err(err).Msg("fdoRegisterDevice: newFDOClient()")

		return httperror.InternalServerError("fdoRegisterDevice: newFDOClient()", err)
	}

	guid, err := fdoClient.PostVoucher(ov)
	if err != nil {
		log.Info().Err(err).Msg("fdoRegisterDevice: PostVoucher()")

		return httperror.InternalServerError("fdoRegisterDevice: PostVoucher()", err)
	}

	return response.JSON(w, registerDeviceResponse{guid})
}
