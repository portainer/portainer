package testhelpers

type userActivityService struct {
}

func NewUserActivityService() *userActivityService {
	return &userActivityService{}
}

func (service *userActivityService) LogUserActivity(username string, context string, action string, payload []byte) error {
	return nil
}
