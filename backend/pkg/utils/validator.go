package utils

import (
	"errors"
	"fmt"
	"strings"

	"github.com/go-playground/validator/v10"
)

// FormatValidationError converts raw Go struct validator errors into friendly user messages
func FormatValidationError(err error) string {
	if err == nil {
		return ""
	}

	var ve validator.ValidationErrors
	if errors.As(err, &ve) {
		var messages []string
		for _, fe := range ve {
			field := fe.Field()
			switch fe.Tag() {
			case "required":
				messages = append(messages, fmt.Sprintf("%s is required", field))
			case "min":
				if field == "Title" {
					messages = append(messages, fmt.Sprintf("Poll title must be at least %s characters long", fe.Param()))
				} else if field == "Password" {
					messages = append(messages, fmt.Sprintf("Password must be at least %s characters long", fe.Param()))
				} else {
					messages = append(messages, fmt.Sprintf("%s must be at least %s characters", field, fe.Param()))
				}
			case "max":
				messages = append(messages, fmt.Sprintf("%s cannot exceed %s characters", field, fe.Param()))
			case "email":
				messages = append(messages, "Please enter a valid email address")
			case "oneof":
				messages = append(messages, fmt.Sprintf("%s must be one of: %s", field, fe.Param()))
			default:
				messages = append(messages, fmt.Sprintf("Invalid value for %s", field))
			}
		}
		if len(messages) > 0 {
			return strings.Join(messages, ". ")
		}
	}

	return err.Error()
}
