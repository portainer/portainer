package support

import (
	"encoding/json"

	httperror "github.com/portainer/libhttp/error"
	portainer "github.com/portainer/portainer/api"

	"net/http"

	"github.com/portainer/portainer/api/http/client"

	"github.com/portainer/libhttp/response"
)

type supportProduct struct {
	ID               int    `json:"Id"`
	Name             string `json:"Name"`
	ShortDescription string `json:"ShortDescription"`
	Price            string `json:"Price"`
	PriceDescription string `json:"PriceDescription"`
	Description      string `json:"Description"`
	ProductID        string `json:"ProductId"`
}

func (handler *Handler) supportList(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	supportData, err := client.Get(portainer.SupportProductsURL, 30)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to fetch support options", err}
	}

	var supportProducts []supportProduct
	err = json.Unmarshal(supportData, &supportProducts)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to fetch support options", err}
	}

	return response.JSON(w, supportProducts)
}
