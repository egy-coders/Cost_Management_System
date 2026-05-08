import subprocess
import sys


def run(command):
    subprocess.check_call(command)


def main():
    python = sys.executable
    run([python, "manage.py", "migrate"])
    run([python, "manage.py", "collectstatic", "--noinput"])


if __name__ == "__main__":
    main()
