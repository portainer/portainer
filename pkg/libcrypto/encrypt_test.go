package libcrypto

import (
	"crypto/rand"
	"io"
	"testing"

	"github.com/portainer/portainer/pkg/fips"
	"github.com/stretchr/testify/require"
)

func init() {
	fips.InitFIPS(false)
}

func TestEncryptDecrypt(t *testing.T) {
	t.Parallel()
	dataFn := func() []byte {
		data := make([]byte, 1024)
		_, err := io.ReadFull(rand.Reader, data)
		require.NoError(t, err)

		return data
	}

	fn := func(t *testing.T, fips bool) {
		data := dataFn()

		encrypted, err := encrypt(data, []byte("test"), fips)
		require.NoError(t, err)

		decrypted, err := decrypt(encrypted, []byte("test"), fips)
		require.NoError(t, err)

		require.Equal(t, data, decrypted)
	}

	t.Run("fips", func(t *testing.T) {
		fn(t, true)
	})

	t.Run("non-fips", func(t *testing.T) {
		fn(t, false)
	})

	t.Run("system_fips_mode", func(t *testing.T) {
		data := dataFn()

		encrypted, err := Encrypt(data, []byte("test"))
		require.NoError(t, err)

		decrypted, err := Decrypt(encrypted, []byte("test"))
		require.NoError(t, err)

		require.Equal(t, data, decrypted)
	})
}
