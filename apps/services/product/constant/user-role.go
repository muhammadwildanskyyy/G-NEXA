package constant

type UserRole struct {
	ADMIN  string `json:"admin"`
	SELLER string `json:"seller"`
	BUYER  string `json:"buyer"`
}

var USER_ROLE = UserRole{
	ADMIN:  "ADMIN",
	SELLER: "SELLER",
	BUYER:  "BUYER",
}
