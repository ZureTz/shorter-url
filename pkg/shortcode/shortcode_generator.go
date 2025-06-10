package shortcode

import "math/rand"

type ShortCodeGenerator struct {
	shortCodeLength int
}

// Constructor for ShortCodeGenerator
func NewShortCodeGenerator(shortCodeLength int) *ShortCodeGenerator {
	return &ShortCodeGenerator{shortCodeLength: shortCodeLength}
}

const charSet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
const charSetLength = len(charSet)

// GenerateShortCode creates a short code of a specified length using a character set.
func (g *ShortCodeGenerator) GenerateShortCode() string {
	shortCode := make([]byte, g.shortCodeLength)
	for i := range shortCode {
		// Generate a random index to select a character from the character set
		shortCode[i] = charSet[rand.Intn(charSetLength)]
	}
	return string(shortCode)
}
