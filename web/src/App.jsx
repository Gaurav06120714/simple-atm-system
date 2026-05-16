import { useState, useEffect } from "react";
import { loadAccounts, saveAccounts, fmt, timestamp } from "./data";
import "./index.css";

const MAX_ATTEMPTS = 3;

// ── tiny UI primitives ──────────────────────────────────────────────────────
function Card({ children, className = "" }) {
  return (
    <div className={`bg-slate-800 rounded-2xl shadow-2xl p-8 w-full max-w-md ${className}`}>
      {children}
    </div>
  );
}

function Input({ label, ...props }) {
  return (
    <div className="flex flex-col gap-1 w-full">
      {label && <label className="text-slate-400 text-sm font-medium">{label}</label>}
      <input
        className="bg-slate-700 border border-slate-600 text-white rounded-xl px-4 py-3 text-base outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition placeholder-slate-500 w-full"
        {...props}
      />
    </div>
  );
}

function Btn({ children, onClick, variant = "primary", disabled = false, className = "" }) {
  const base = "w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 disabled:opacity-40";
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-500 text-white",
    success: "bg-emerald-600 hover:bg-emerald-500 text-white",
    danger:  "bg-red-600 hover:bg-red-500 text-white",
    ghost:   "bg-slate-700 hover:bg-slate-600 text-white border border-slate-600",
  };
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
}

function Alert({ msg, type = "error" }) {
  if (!msg) return null;
  const colors = {
    error:   "bg-red-500/20 border-red-500/40 text-red-300",
    success: "bg-emerald-500/20 border-emerald-500/40 text-emerald-300",
    info:    "bg-blue-500/20 border-blue-500/40 text-blue-300",
  };
  return (
    <div className={`border rounded-xl px-4 py-3 text-sm ${colors[type]}`}>{msg}</div>
  );
}

// ── Login Screen ─────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [accNo, setAccNo] = useState("");
  const [pin, setPin] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [msg, setMsg] = useState(null);
  const [msgType, setMsgType] = useState("error");

  const handleLogin = () => {
    const accounts = loadAccounts();
    if (!accounts[accNo]) {
      setMsg("Account not found. Please check your account number."); setMsgType("error"); return;
    }
    if (accounts[accNo].pin !== pin) {
      const left = MAX_ATTEMPTS - attempts - 1;
      setAttempts(a => a + 1);
      if (left <= 0) {
        setMsg("Too many wrong attempts. Please contact your bank."); setMsgType("error"); return;
      }
      setMsg(`Wrong PIN. ${left} attempt${left !== 1 ? "s" : ""} remaining.`); setMsgType("error"); return;
    }
    onLogin(accNo, accounts[accNo]);
  };

  const locked = attempts >= MAX_ATTEMPTS;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <Card>
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-3xl mb-4 shadow-lg shadow-blue-600/30">
            🏧
          </div>
          <h1 className="text-white text-2xl font-bold">Python ATM</h1>
          <p className="text-slate-400 text-sm mt-1">Secure Banking Portal</p>
        </div>

        <div className="flex flex-col gap-4">
          <Input
            label="Account Number"
            placeholder="e.g. 1001"
            value={accNo}
            onChange={e => setAccNo(e.target.value)}
            disabled={locked}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
          />
          <Input
            label="PIN"
            type="password"
            placeholder="Enter 4-digit PIN"
            maxLength={4}
            value={pin}
            onChange={e => setPin(e.target.value)}
            disabled={locked}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
          />
          <Alert msg={msg} type={msgType} />
          <Btn onClick={handleLogin} disabled={locked || !accNo || !pin}>
            Login →
          </Btn>
        </div>

        <p className="text-slate-500 text-xs text-center mt-6">
          Demo accounts: 1001/1234 · 1002/4321 · 1003/1111
        </p>
      </Card>
    </div>
  );
}

// ── Balance Card ─────────────────────────────────────────────────────────────
function BalanceCard({ balance }) {
  return (
    <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 text-white shadow-xl shadow-blue-900/40">
      <p className="text-blue-200 text-sm font-medium mb-1">Available Balance</p>
      <p className="text-4xl font-bold tracking-tight">{fmt(balance)}</p>
    </div>
  );
}

// ── Transaction Modal ─────────────────────────────────────────────────────────
function TransactionModal({ type, balance, onConfirm, onClose }) {
  const [amount, setAmount] = useState("");
  const [msg, setMsg] = useState(null);
  const [msgType, setMsgType] = useState("error");

  const isWithdraw = type === "withdraw";

  const handle = () => {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) { setMsg("Enter a valid amount."); setMsgType("error"); return; }
    if (isWithdraw) {
      if (amt > balance) { setMsg(`Insufficient balance. Available: ${fmt(balance)}`); setMsgType("error"); return; }
      if (amt % 100 !== 0) { setMsg("Withdrawal must be in multiples of ₹100."); setMsgType("error"); return; }
    }
    if (!isWithdraw && amt > 100000) { setMsg("Max single deposit is ₹1,00,000."); setMsgType("error"); return; }
    onConfirm(amt);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-slate-700">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-2xl">{isWithdraw ? "💸" : "💰"}</span>
          <h2 className="text-white text-xl font-bold">{isWithdraw ? "Withdraw Cash" : "Deposit Cash"}</h2>
        </div>
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-slate-400 text-sm mb-1 block">Amount (₹)</label>
            <input
              autoFocus
              type="number"
              placeholder={isWithdraw ? "Multiples of ₹100" : "Enter amount"}
              value={amount}
              onChange={e => setAmount(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handle()}
              className="w-full bg-slate-700 border border-slate-600 text-white text-xl font-semibold rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition"
            />
          </div>
          <Alert msg={msg} type={msgType} />
          <div className="flex gap-3">
            <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
            <Btn variant={isWithdraw ? "danger" : "success"} onClick={handle}>
              Confirm
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Change PIN Modal ──────────────────────────────────────────────────────────
function ChangePinModal({ currentPin, onConfirm, onClose }) {
  const [old, setOld] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState(null);
  const [msgType, setMsgType] = useState("error");

  const handle = () => {
    if (old !== currentPin) { setMsg("Current PIN is incorrect."); setMsgType("error"); return; }
    if (!/^\d{4}$/.test(newPin)) { setMsg("New PIN must be exactly 4 digits."); setMsgType("error"); return; }
    if (newPin !== confirm) { setMsg("PINs do not match."); setMsgType("error"); return; }
    onConfirm(newPin);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-slate-700">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-2xl">🔐</span>
          <h2 className="text-white text-xl font-bold">Change PIN</h2>
        </div>
        <div className="flex flex-col gap-3">
          <Input label="Current PIN" type="password" maxLength={4} value={old} onChange={e => setOld(e.target.value)} />
          <Input label="New PIN" type="password" maxLength={4} value={newPin} onChange={e => setNewPin(e.target.value)} />
          <Input label="Confirm New PIN" type="password" maxLength={4} value={confirm} onChange={e => setConfirm(e.target.value)} />
          <Alert msg={msg} type={msgType} />
          <div className="flex gap-3 mt-1">
            <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
            <Btn onClick={handle}>Update PIN</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── History Screen ────────────────────────────────────────────────────────────
function HistoryScreen({ history, onBack }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center gap-3 p-6 border-b border-slate-700">
          <button onClick={onBack} className="text-slate-400 hover:text-white transition text-xl">←</button>
          <h2 className="text-white text-xl font-bold">Transaction History</h2>
        </div>
        <div className="p-4 max-h-[70vh] overflow-y-auto">
          {history.length === 0 ? (
            <div className="text-slate-500 text-center py-12">No transactions yet.</div>
          ) : (
            <div className="flex flex-col gap-2">
              {[...history].reverse().map((tx, i) => (
                <div key={i} className="flex items-center justify-between bg-slate-700/50 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{tx.type === "Withdraw" ? "💸" : "💰"}</span>
                    <div>
                      <p className="text-white text-sm font-semibold">{tx.type}</p>
                      <p className="text-slate-500 text-xs">{tx.time}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-sm ${tx.type === "Withdraw" ? "text-red-400" : "text-emerald-400"}`}>
                      {tx.type === "Withdraw" ? "-" : "+"}{fmt(tx.amount)}
                    </p>
                    <p className="text-slate-500 text-xs">Bal: {fmt(tx.balance)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
function Dashboard({ accNo, acc, onLogout }) {
  const [accounts, setAccounts] = useState(loadAccounts());
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState(null);
  const [screen, setScreen] = useState("home");

  const currentAcc = accounts[accNo];

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const doTransaction = (type, amount) => {
    const updated = { ...accounts };
    if (type === "withdraw") {
      updated[accNo].balance -= amount;
    } else {
      updated[accNo].balance += amount;
    }
    updated[accNo].history.push({
      type: type === "withdraw" ? "Withdraw" : "Deposit",
      amount,
      balance: updated[accNo].balance,
      time: timestamp(),
    });
    saveAccounts(updated);
    setAccounts(updated);
    setModal(null);
    showToast(
      type === "withdraw"
        ? `${fmt(amount)} withdrawn successfully!`
        : `${fmt(amount)} deposited successfully!`
    );
  };

  const doChangePin = (newPin) => {
    const updated = { ...accounts };
    updated[accNo].pin = newPin;
    saveAccounts(updated);
    setAccounts(updated);
    setModal(null);
    showToast("PIN changed successfully!");
  };

  if (screen === "history") {
    return <HistoryScreen history={currentAcc.history} onBack={() => setScreen("home")} />;
  }

  const menuItems = [
    { icon: "💸", label: "Withdraw",    action: () => setModal("withdraw"), color: "hover:border-red-500/50" },
    { icon: "💰", label: "Deposit",     action: () => setModal("deposit"),  color: "hover:border-emerald-500/50" },
    { icon: "📋", label: "History",     action: () => setScreen("history"), color: "hover:border-blue-500/50" },
    { icon: "🔐", label: "Change PIN",  action: () => setModal("pin"),      color: "hover:border-purple-500/50" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md flex flex-col gap-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-sm">Welcome back,</p>
            <h1 className="text-white text-xl font-bold">{currentAcc.name}</h1>
            <p className="text-slate-500 text-xs">Account: {accNo}</p>
          </div>
          <button
            onClick={onLogout}
            className="text-slate-400 hover:text-white text-sm border border-slate-600 hover:border-slate-400 px-3 py-1.5 rounded-lg transition"
          >
            Logout
          </button>
        </div>

        {/* Balance */}
        <BalanceCard balance={currentAcc.balance} />

        {/* Menu Grid */}
        <div className="grid grid-cols-2 gap-3">
          {menuItems.map((item) => (
            <button
              key={item.label}
              onClick={item.action}
              className={`bg-slate-800 border border-slate-700 ${item.color} rounded-2xl p-5 flex flex-col items-center gap-2 transition-all hover:bg-slate-750 hover:scale-[1.02] active:scale-95`}
            >
              <span className="text-3xl">{item.icon}</span>
              <span className="text-white text-sm font-semibold">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Recent Transactions */}
        <div className="bg-slate-800 rounded-2xl p-5">
          <p className="text-slate-400 text-sm font-medium mb-3">Recent Transactions</p>
          {currentAcc.history.length === 0 ? (
            <p className="text-slate-600 text-sm text-center py-4">No transactions yet.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {[...currentAcc.history].reverse().slice(0, 3).map((tx, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>{tx.type === "Withdraw" ? "💸" : "💰"}</span>
                    <div>
                      <p className="text-white text-sm">{tx.type}</p>
                      <p className="text-slate-500 text-xs">{tx.time}</p>
                    </div>
                  </div>
                  <p className={`font-bold text-sm ${tx.type === "Withdraw" ? "text-red-400" : "text-emerald-400"}`}>
                    {tx.type === "Withdraw" ? "-" : "+"}{fmt(tx.amount)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {modal === "withdraw" && (
        <TransactionModal
          type="withdraw"
          balance={currentAcc.balance}
          onConfirm={(amt) => doTransaction("withdraw", amt)}
          onClose={() => setModal(null)}
        />
      )}
      {modal === "deposit" && (
        <TransactionModal
          type="deposit"
          balance={currentAcc.balance}
          onConfirm={(amt) => doTransaction("deposit", amt)}
          onClose={() => setModal(null)}
        />
      )}
      {modal === "pin" && (
        <ChangePinModal
          currentPin={currentAcc.pin}
          onConfirm={doChangePin}
          onClose={() => setModal(null)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-xl text-sm font-semibold shadow-xl z-50 transition-all
          ${toast.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

// ── App Root ──────────────────────────────────────────────────────────────────
export default function App() {
  const [session, setSession] = useState(null);

  const handleLogin = (accNo, acc) => setSession({ accNo, acc });
  const handleLogout = () => setSession(null);

  if (!session) return <LoginScreen onLogin={handleLogin} />;
  return <Dashboard accNo={session.accNo} acc={session.acc} onLogout={handleLogout} />;
}
