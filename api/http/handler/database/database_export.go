package database

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	//"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/api"
)

func (handler *Handler) databaseExport(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	storePath := handler.FileService.GetRootFolder()
	databaseExport, err := handler.DatabaseService.DatabaseExport(storePath)

	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Error exporting database", err}
	}

	database := &portainer.Database{
		DatabaseExport: databaseExport,
	}

	//w.Header().Set("Content-Type", "application/octet-stream")
	//w.Header().Set("Content-Disposition", `attachment; filename="my.db"`)
	//w.Header().Set("Content-Length", strconv.Itoa(int(tx.Size())))

	return response.JSON(w, database)
}
