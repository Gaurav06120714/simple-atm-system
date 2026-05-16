# 🏧 ATM Transaction System — Python

A fully functional terminal-based ATM simulator with persistent storage, PIN retry lockout, transaction history, and input validation.

---

## Features

- **Persistent balance** — saved to `data.json`, survives restarts
- **PIN retry limit** — 3 wrong attempts locks the account
- **Full menu loop** — multiple transactions per session
- **Transaction history** — last 10 with timestamps
- **Change PIN** — securely update your PIN
- **Input validation** — no crashes on bad input
- **Withdrawal rules** — must be multiples of ₹100
- **Deposit limit** — max ₹1,00,000 per transaction

---

## How to Run

```bash
cd simple-atm
python3 atm.py
```

No dependencies — uses Python standard library only.

---

## Test Accounts

| Account Number | PIN  | Balance    |
|----------------|------|------------|
| 1001           | 1234 | ₹5,000     |
| 1002           | 4321 | ₹8,000     |
| 1003           | 1111 | ₹10,000    |

---

## Menu Options

```
1. Check Balance
2. Withdraw Cash
3. Deposit Cash
4. Transaction History
5. Change PIN
6. Exit
```

---

## Project Structure

```
simple-atm/
├── atm.py       ← main program
├── data.json    ← auto-created on first run (gitignored)
├── .gitignore
└── README.md
```
