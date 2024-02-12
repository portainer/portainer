package testhelpers

// Service represents a service for encrypting/hashing data.
type cryptoService struct{}

func NewCryptoService() *cryptoService {
	return &cryptoService{}
}

func (*cryptoService) Hash(data string) (string, error) {
	return "", nil
}

func (*cryptoService) CompareHashAndData(hash string, data string) error {
	return nil
}
