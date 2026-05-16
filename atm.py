"""
ATM Transaction System — Python
Persistent storage via JSON, PIN retry limit, transaction history, full menu loop.
"""

import json
import os
from datetime import datetime

DATA_FILE = os.path.join(os.path.dirname(__file__), "data.json")
MAX_PIN_ATTEMPTS = 3

# ─────────────────────────────────────────────
# Default accounts (used only on first run)
# ─────────────────────────────────────────────
DEFAULT_ACCOUNTS = {
    "1001": {"pin": "1234", "balance": 5000.0, "history": []},
    "1002": {"pin": "4321", "balance": 8000.0, "history": []},
    "1003": {"pin": "1111", "balance": 10000.0, "history": []},
}


# ─────────────────────────────────────────────
# Storage
# ─────────────────────────────────────────────
def load_data() -> dict:
    if not os.path.exists(DATA_FILE):
        save_data(DEFAULT_ACCOUNTS)
        return DEFAULT_ACCOUNTS
    with open(DATA_FILE, "r") as f:
        return json.load(f)


def save_data(accounts: dict):
    with open(DATA_FILE, "w") as f:
        json.dump(accounts, f, indent=2)


# ─────────────────────────────────────────────
# UI helpers
# ─────────────────────────────────────────────
def line(char="─", width=44):
    print(char * width)


def header(title: str):
    print()
    line("═")
    print(f"  {title}")
    line("═")


def success(msg: str):
    print(f"\n  ✅  {msg}")


def error(msg: str):
    print(f"\n  ❌  {msg}")


def info(msg: str):
    print(f"  ℹ️   {msg}")


def get_amount(prompt: str) -> float | None:
    raw = input(f"\n  {prompt}: ₹ ").strip()
    try:
        amt = float(raw)
        if amt <= 0:
            error("Amount must be greater than 0.")
            return None
        return amt
    except ValueError:
        error("Invalid amount. Please enter a number.")
        return None


def timestamp() -> str:
    return datetime.now().strftime("%d %b %Y  %H:%M:%S")


# ─────────────────────────────────────────────
# ATM Operations
# ─────────────────────────────────────────────
def check_balance(acc: dict):
    header("BALANCE ENQUIRY")
    print(f"\n  Current Balance:  ₹ {acc['balance']:,.2f}")


def withdraw(acc: dict, accounts: dict, acc_no: str):
    header("WITHDRAW CASH")
    amt = get_amount("Enter withdrawal amount")
    if amt is None:
        return
    if amt > acc["balance"]:
        error(f"Insufficient balance. Available: ₹ {acc['balance']:,.2f}")
        return
    if amt % 100 != 0:
        error("Amount must be in multiples of ₹100.")
        return
    acc["balance"] -= amt
    acc["history"].append({
        "type": "Withdraw",
        "amount": amt,
        "balance": acc["balance"],
        "time": timestamp()
    })
    save_data(accounts)
    success(f"₹ {amt:,.2f} dispensed successfully.")
    info(f"Remaining Balance: ₹ {acc['balance']:,.2f}")


def deposit(acc: dict, accounts: dict, acc_no: str):
    header("DEPOSIT CASH")
    amt = get_amount("Enter deposit amount")
    if amt is None:
        return
    if amt > 100_000:
        error("Maximum single deposit is ₹1,00,000.")
        return
    acc["balance"] += amt
    acc["history"].append({
        "type": "Deposit",
        "amount": amt,
        "balance": acc["balance"],
        "time": timestamp()
    })
    save_data(accounts)
    success(f"₹ {amt:,.2f} deposited successfully.")
    info(f"New Balance: ₹ {acc['balance']:,.2f}")


def show_history(acc: dict):
    header("TRANSACTION HISTORY")
    history = acc.get("history", [])
    if not history:
        print("\n  No transactions yet.")
        return
    recent = history[-10:]  # last 10
    print(f"\n  {'DATE & TIME':<22} {'TYPE':<10} {'AMOUNT':>12} {'BALANCE':>12}")
    line()
    for tx in reversed(recent):
        sign = "-" if tx["type"] == "Withdraw" else "+"
        print(f"  {tx['time']:<22} {tx['type']:<10} {sign}₹{tx['amount']:>9,.2f}  ₹{tx['balance']:>9,.2f}")
    line()
    if len(history) > 10:
        info(f"Showing last 10 of {len(history)} transactions.")


def change_pin(acc: dict, accounts: dict):
    header("CHANGE PIN")
    old = input("\n  Enter current PIN: ").strip()
    if old != acc["pin"]:
        error("Incorrect current PIN.")
        return
    new = input("  Enter new PIN (4 digits): ").strip()
    if not new.isdigit() or len(new) != 4:
        error("PIN must be exactly 4 digits.")
        return
    confirm = input("  Confirm new PIN: ").strip()
    if new != confirm:
        error("PINs do not match.")
        return
    acc["pin"] = new
    save_data(accounts)
    success("PIN changed successfully.")


# ─────────────────────────────────────────────
# Login
# ─────────────────────────────────────────────
def login(accounts: dict):
    header("WELCOME TO PYTHON ATM")
    print()
    acc_no = input("  Enter Account Number: ").strip()

    if acc_no not in accounts:
        error("Account not found.")
        return None, None

    acc = accounts[acc_no]

    for attempt in range(1, MAX_PIN_ATTEMPTS + 1):
        pin = input(f"  Enter PIN (attempt {attempt}/{MAX_PIN_ATTEMPTS}): ").strip()
        if pin == acc["pin"]:
            success(f"Login successful! Welcome, Account {acc_no}")
            return acc_no, acc
        else:
            remaining = MAX_PIN_ATTEMPTS - attempt
            if remaining > 0:
                error(f"Wrong PIN. {remaining} attempt(s) remaining.")
            else:
                error("Too many wrong attempts. Card blocked. Contact your bank.")

    return None, None


# ─────────────────────────────────────────────
# Main Menu
# ─────────────────────────────────────────────
def menu(acc_no: str, acc: dict, accounts: dict):
    while True:
        header(f"MAIN MENU  —  Account {acc_no}")
        print("""
  1.  Check Balance
  2.  Withdraw Cash
  3.  Deposit Cash
  4.  Transaction History
  5.  Change PIN
  6.  Exit
        """)
        line()
        choice = input("  Select option (1-6): ").strip()

        if choice == "1":
            check_balance(acc)
        elif choice == "2":
            withdraw(acc, accounts, acc_no)
        elif choice == "3":
            deposit(acc, accounts, acc_no)
        elif choice == "4":
            show_history(acc)
        elif choice == "5":
            change_pin(acc, accounts)
        elif choice == "6":
            header("THANK YOU")
            print("\n  Please collect your card.\n  Have a great day!\n")
            break
        else:
            error("Invalid option. Please enter 1–6.")

        input("\n  Press Enter to continue...")


# ─────────────────────────────────────────────
# Entry Point
# ─────────────────────────────────────────────
def main():
    accounts = load_data()
    acc_no, acc = login(accounts)
    if acc_no:
        menu(acc_no, acc, accounts)


if __name__ == "__main__":
    main()
