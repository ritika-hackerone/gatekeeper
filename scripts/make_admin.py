"""
Promote a user to admin, or create the very first admin account.

Usage:
    PYTHONPATH=src python scripts/make_admin.py you@example.com "a-strong-password"

If the user already exists (e.g. signed up via the normal /auth/signup flow
or Google), this just flips is_admin=True and ignores the password. If the
user doesn't exist yet, it creates the account with that email/password
and marks it admin immediately.
"""
import sys

sys.path.insert(0, "src")

from gatekeeper.db import SessionLocal, init_db
from gatekeeper.models import User
from gatekeeper.security import hash_password


def main():
    if len(sys.argv) < 2:
        print("Usage: python scripts/make_admin.py <email> [password]")
        sys.exit(1)

    email = sys.argv[1]
    password = sys.argv[2] if len(sys.argv) > 2 else None

    init_db()
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if user:
            user.is_admin = True
            db.commit()
            print(f"'{email}' already existed — promoted to admin.")
        else:
            if not password:
                print("User doesn't exist yet — provide a password to create it.")
                sys.exit(1)
            user = User(email=email, hashed_password=hash_password(password), is_admin=True)
            db.add(user)
            db.commit()
            print(f"Created new admin account for '{email}'.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
