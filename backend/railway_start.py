import os


def main():
    port = os.getenv("PORT", "8000").strip()
    if not port.isdigit():
        raise SystemExit(f"PORT must be a number, got {port!r}")

    os.execvp(
        "gunicorn",
        [
            "gunicorn",
            "site_engineer_system.wsgi:application",
            "--bind",
            f"0.0.0.0:{port}",
        ],
    )


if __name__ == "__main__":
    main()
