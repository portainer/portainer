package response

import (
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	httperrors "github.com/portainer/portainer/api/http/errors"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/stretchr/testify/require"
)

func TestTxResponse(t *testing.T) {
	type sample struct {
		Name string `json:"name"`
	}

	w := httptest.NewRecorder()
	got := TxResponse(w, sample{Name: "Alice"}, nil)
	require.Nil(t, got)
	require.Equal(t, http.StatusOK, w.Result().StatusCode)

	w = httptest.NewRecorder()
	got = TxResponse(w, sample{}, httperror.Forbidden("Access denied to resource", httperrors.ErrResourceAccessDenied))
	require.NotNil(t, got)
	require.Equal(t, http.StatusForbidden, got.StatusCode)
	require.Equal(t, "Access denied to resource", got.Message)

	w = httptest.NewRecorder()
	got = TxResponse(w, sample{}, errors.New("Some error"))
	require.NotNil(t, got)
	require.Equal(t, http.StatusInternalServerError, got.StatusCode)
	require.Equal(t, "Unexpected error", got.Message)
}

func TestTxEmptyResponse(t *testing.T) {
	w := httptest.NewRecorder()
	got := TxEmptyResponse(w, nil)
	require.Nil(t, got)
	require.Equal(t, http.StatusNoContent, w.Result().StatusCode)

	w = httptest.NewRecorder()
	got = TxEmptyResponse(w, httperror.Forbidden("Access denied to resource", httperrors.ErrResourceAccessDenied))
	require.NotNil(t, got)
	require.Equal(t, http.StatusForbidden, got.StatusCode)
	require.Equal(t, "Access denied to resource", got.Message)

	w = httptest.NewRecorder()
	got = TxEmptyResponse(w, errors.New("Some error"))
	require.NotNil(t, got)
	require.Equal(t, http.StatusInternalServerError, got.StatusCode)
	require.Equal(t, "Unexpected error", got.Message)
}

func TestTxFuncResponse(t *testing.T) {
	got := TxFuncResponse(nil, func() *httperror.HandlerError { return nil })
	require.Nil(t, got)

	got = TxFuncResponse(httperror.Forbidden("Access denied to resource", httperrors.ErrResourceAccessDenied), func() *httperror.HandlerError { return nil })
	require.NotNil(t, got)
	require.Equal(t, http.StatusForbidden, got.StatusCode)
	require.Equal(t, "Access denied to resource", got.Message)

	got = TxFuncResponse(errors.New("Some error"), func() *httperror.HandlerError { return nil })
	require.NotNil(t, got)
	require.Equal(t, http.StatusInternalServerError, got.StatusCode)
	require.Equal(t, "Unexpected error", got.Message)
}

func TestTxErrorResponse(t *testing.T) {
	got := TxErrorResponse(nil)
	require.NotNil(t, got)
	require.Equal(t, http.StatusInternalServerError, got.StatusCode)
	require.Equal(t, "Unexpected error", got.Message)

	got = TxErrorResponse(httperror.Forbidden("Access denied to resource", httperrors.ErrResourceAccessDenied))
	require.NotNil(t, got)
	require.Equal(t, http.StatusForbidden, got.StatusCode)
	require.Equal(t, "Access denied to resource", got.Message)

	got = TxErrorResponse(errors.New("Some error"))
	require.NotNil(t, got)
	require.Equal(t, http.StatusInternalServerError, got.StatusCode)
	require.Equal(t, "Unexpected error", got.Message)
}
