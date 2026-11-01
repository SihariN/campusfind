
from sqlalchemy import select

from app.database import SessionLocal
from app.models import User


def promote_user_to_admin():
    print("\n=== CampusFind Admin Setup ===\n")

    email = input("Enter the existing user's email: ").strip().lower()

    if not email:
        print("Email cannot be empty.")
        return

    db = SessionLocal()

    try:
        user = db.scalar(
            select(User).where(User.email == email)
        )

        if user is None:
            print("No account found with that email.")
            return

        if user.role == "admin":
            print("This account is already an admin.")
            return

        print("\nAccount found:")
        print(f"Email: {user.email}")
        print(f"Current role: {user.role}")

        confirmation = input(
            "\nPromote this account to admin? (yes/no): "
        ).strip().lower()

        if confirmation != "yes":
            print("Admin promotion cancelled.")
            return

        user.role = "admin"

        db.commit()

        print("\nSuccess! The account is now an admin.")
        print("Email:", user.email)
        print("Role:", user.role)

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    promote_user_to_admin()
