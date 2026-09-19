package utils

import (
	"testing"
)

func TestAES256GCM_Roundtrip(t *testing.T) {
	key := DeriveKey("my-super-secret-passphrase-2026")
	if len(key) != 32 {
		t.Fatalf("expected key length 32, got %d", len(key))
	}

	plaintext := "sensitive_user_email@example.com"
	ciphertext, err := EncryptData(plaintext, key)
	if err != nil {
		t.Fatalf("encryption failed: %v", err)
	}

	if ciphertext == plaintext {
		t.Fatalf("ciphertext should not match plaintext")
	}

	decrypted, err := DecryptData(ciphertext, key)
	if err != nil {
		t.Fatalf("decryption failed: %v", err)
	}

	if decrypted != plaintext {
		t.Fatalf("expected '%s', got '%s'", plaintext, decrypted)
	}
}

func TestHashForLookup(t *testing.T) {
	email := "test@example.com"
	hash1 := HashForLookup(email)
	hash2 := HashForLookup(email)

	if hash1 != hash2 {
		t.Fatalf("blind index must be deterministic")
	}

	if hash1 == email {
		t.Fatalf("hash should not match plaintext")
	}
}
