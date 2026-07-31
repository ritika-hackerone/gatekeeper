"""
Email sending. If SMTP_HOST is not set, emails are printed to the server
console instead of sent — so password reset is testable locally with zero
setup. Configure SMTP_HOST/PORT/USER/PASSWORD (e.g. SendGrid, Mailgun, or
plain Gmail SMTP with an app password) in production. See .env.example.
"""
from __future__ import annotations

import os
import smtplib
from email.mime.text import MIMEText

SMTP_HOST = os.environ.get("SMTP_HOST")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USER = os.environ.get("SMTP_USER")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD")
FROM_EMAIL = os.environ.get("FROM_EMAIL", "no-reply@abrobot.ai")


def send_email(to_email: str, subject: str, body: str) -> None:
    if not SMTP_HOST:
        print(f"\n--- [DEV MODE] Email not sent (no SMTP_HOST configured) ---")
        print(f"To: {to_email}\nSubject: {subject}\n\n{body}\n--- end email ---\n")
        return

    msg = MIMEText(body)
    msg["Subject"] = subject
    msg["From"] = FROM_EMAIL
    msg["To"] = to_email

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.sendmail(FROM_EMAIL, [to_email], msg.as_string())


def send_password_reset_email(to_email: str, reset_url: str) -> None:
    send_email(
        to_email,
        "Reset your AbroBot.ai password",
        f"Click the link below to reset your password. This link expires in 30 minutes.\n\n{reset_url}\n\n"
        "If you didn't request this, you can safely ignore this email.",
    )
