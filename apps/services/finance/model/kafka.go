package model

type UserEventMessage struct {
	Event     string `json:"event"`
	Timestamp string `json:"timestamp"`
	Data      struct {
		UserID string `json:"user_id"`
		Name   string `json:"name"`
		Email  string `json:"email"`
	} `json:"data"`
}
