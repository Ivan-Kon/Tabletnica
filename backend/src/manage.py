"""Local administration. Never invoked automatically by the web application."""
import argparse
import asyncio
from getpass import getpass
from backend.src.database import init_db, async_session, engine
from backend.src.users.crud import register_user
from backend.src.users.schemas import UserSchema

async def run(args):
    try:
        if args.command == "init-local":
            if engine.dialect.name != "sqlite":
                raise SystemExit("init-local only supports SQLite; use reviewed migrations for MySQL")
            await init_db()
            print("Missing local tables created; existing data retained.")
        else:
            password = getpass("New admin password: ")
            if len(password) < 12 or password != getpass("Repeat password: "):
                raise SystemExit("Passwords must match and contain at least 12 characters")
            async with async_session() as session:
                user = await register_user(session, UserSchema(username=args.username,
                    password=password, role="admin", full_name=args.full_name, active=True))
                if not user:
                    raise SystemExit("Username already exists")
                print("Administrator created.")
    finally:
        await engine.dispose()

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    commands = parser.add_subparsers(dest="command", required=True)
    commands.add_parser("init-local")
    create = commands.add_parser("create-admin")
    create.add_argument("--username", required=True)
    create.add_argument("--full-name", required=True)
    asyncio.run(run(parser.parse_args()))
