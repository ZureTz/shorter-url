package service

import (
	"context"
	"time"

	"github.com/ZureTz/shorter-url/internal/model"
	"github.com/ZureTz/shorter-url/internal/repo"
)

type UserService struct {
	querier repo.Querier
	cacher  Cacher

	emailCodeExpiration time.Duration
}


func (s *UserService) UserLogin(ctx context.Context, req model.LoginRequest) (*model.LoginResponse, error){
	
}

func (s *UserService) UserRegister(ctx context.Context, req model.RegisterRequest) error{

}
func (s *UserService) GetEmailCode(ctx context.Context, email string) error{

}
