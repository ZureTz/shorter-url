package mailer

import (
	"fmt"
	"log"

	"github.com/ZureTz/shorter-url/config"
	"gopkg.in/gomail.v2"
)

type Mailer struct {
	dialer      gomail.Dialer
	fromMail    string
	mailChannel chan *gomail.Message // Buffered channel for email messages
}

func NewMailer(c config.MailerConfig) *Mailer {
	dialer := gomail.NewDialer(c.SMTPHost, c.SMTPPort, c.Username, c.Password)
	mailer := &Mailer{
		dialer:      *dialer,
		fromMail:    c.FromMail,
		mailChannel: make(chan *gomail.Message, 100),
	}
	// Start the mailer daemon
	go mailer.MailerDaemon()

	return mailer
}

func (m *Mailer) MailerDaemon() {
	for message := range m.mailChannel {
		if err := m.dialer.DialAndSend(message); err != nil {
			log.Print(err)
		}
	}
}

func (m *Mailer) SendEmail(to string, subject string, body string) {
	msg := gomail.NewMessage()
	msg.SetHeader("From", m.fromMail)
	msg.SetHeader("To", to)
	msg.SetHeader("Subject", subject)
	msg.SetBody("text/html", fmt.Sprintf("<p>%s</p>", body))

	m.mailChannel <- msg // Send the message to the channel
}

func (m *Mailer) StopDaemon() {
	close(m.mailChannel) // Close the channel to stop the daemon
}
