package parser

import (
	"regexp"
	"strconv"
	"strings"
	"time"
)

var monthMap = map[string]int{
	"jan": 1, "january": 1, "januari": 1,
	"feb": 2, "february": 2, "februari": 2,
	"mar": 3, "march": 3, "maret": 3,
	"apr": 4, "april": 4,
	"may": 5, "mei": 5,
	"jun": 6, "june": 6, "juni": 6,
	"jul": 7, "july": 7, "juli": 7,
	"agu": 8, "aug": 8, "august": 8, "agustus": 8,
	"sep": 9, "september": 9,
	"okt": 10, "oct": 10, "october": 10, "oktober": 10,
	"nov": 11, "november": 11,
	"des": 12, "dec": 12, "december": 12, "desember": 12,
}

var (
	numericDateRe = regexp.MustCompile(`\s*@(\d{1,2})[/\-](\d{1,2})(?:[/\-](\d{2,4}))?\s*$`)
	monthKeys     []string
)

func init() {
	for k := range monthMap {
		monthKeys = append(monthKeys, k)
	}
}

// ParseBackdate extracts optional date suffix from end of note.
// Supported formats:
// - @DD/MM or @DD/MM/YYYY
// - @DD-MM or @DD-MM-YYYY
// - @5mei / @5 mei / @5may
// - @mei5 / @mei 5 / @may5
// - @5 mei 2025 / @may 5 2025
// Returns (cleanedNote, date, found)
func ParseBackdate(note string) (string, time.Time, bool) {
	// Try numeric: @DD/MM or @DD/MM/YYYY
	if m := numericDateRe.FindStringSubmatch(note); m != nil {
		day, _ := strconv.Atoi(m[1])
		month, _ := strconv.Atoi(m[2])
		year := time.Now().Year()
		if m[3] != "" {
			y, _ := strconv.Atoi(m[3])
			if y < 100 {
				y += 2000
			}
			year = y
		}
		if t, ok := validDate(year, month, day); ok {
			cleanNote := strings.TrimSpace(numericDateRe.ReplaceAllString(note, ""))
			return cleanNote, t, true
		}
	}

	// Try named month patterns
	noteLower := strings.ToLower(note)

	// Pattern 1: @<day><sep?><monthname><sep?><year?>
	dayMonthRe := regexp.MustCompile(`\s*@(\d{1,2})\s*[/\-]?\s*(` + strings.Join(monthKeys, "|") + `)(?:\s*[/\-]?\s*(\d{2,4}))?\s*$`)
	if m := dayMonthRe.FindStringSubmatch(noteLower); m != nil {
		day, _ := strconv.Atoi(m[1])
		monthNum := monthMap[m[2]]
		year := time.Now().Year()
		if m[3] != "" {
			y, _ := strconv.Atoi(m[3])
			if y < 100 {
				y += 2000
			}
			year = y
		}
		if t, ok := validDate(year, monthNum, day); ok {
			idx := dayMonthRe.FindStringIndex(noteLower)
			cleanNote := strings.TrimSpace(note[:idx[0]])
			return cleanNote, t, true
		}
	}

	// Pattern 2: @<monthname><sep?><day><sep?><year?>
	monthDayRe := regexp.MustCompile(`\s*@(` + strings.Join(monthKeys, "|") + `)\s*[/\-]?\s*(\d{1,2})(?:\s*[/\-]?\s*(\d{2,4}))?\s*$`)
	if m := monthDayRe.FindStringSubmatch(noteLower); m != nil {
		monthNum := monthMap[m[1]]
		day, _ := strconv.Atoi(m[2])
		year := time.Now().Year()
		if m[3] != "" {
			y, _ := strconv.Atoi(m[3])
			if y < 100 {
				y += 2000
			}
			year = y
		}
		if t, ok := validDate(year, monthNum, day); ok {
			idx := monthDayRe.FindStringIndex(noteLower)
			cleanNote := strings.TrimSpace(note[:idx[0]])
			return cleanNote, t, true
		}
	}

	return note, time.Time{}, false
}

func validDate(year, month, day int) (time.Time, bool) {
	if month < 1 || month > 12 || day < 1 || day > 31 {
		return time.Time{}, false
	}
	t := time.Date(year, time.Month(month), day, 0, 0, 0, 0, time.Local)
	// Check if date was normalized (e.g., Feb 30 -> Mar 2)
	if t.Month() != time.Month(month) || t.Day() != day {
		return time.Time{}, false
	}
	return t, true
}

// ParseMonthYear parses MM-YYYY format
func ParseMonthYear(text string) (month, year int, ok bool) {
	re := regexp.MustCompile(`^(\d{1,2})-(\d{4})$`)
	m := re.FindStringSubmatch(strings.TrimSpace(text))
	if m == nil {
		return 0, 0, false
	}
	month, _ = strconv.Atoi(m[1])
	year, _ = strconv.Atoi(m[2])
	if month < 1 || month > 12 || year < 2000 || year > 2100 {
		return 0, 0, false
	}
	return month, year, true
}
