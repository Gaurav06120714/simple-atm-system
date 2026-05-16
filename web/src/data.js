const KEY = "atm_accounts";

const DEFAULTS = {
  "1001": { pin: "1234", name: "Rahul Sharma",   balance: 5000,  history: [] },
  "1002": { pin: "4321", name: "Priya Patel",    balance: 8000,  history: [] },
  "1003": { pin: "1111", name: "Arjun Mehta",    balance: 10000, history: [] },
};

export function loadAccounts() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : structuredClone(DEFAULTS);
  } catch {
    return structuredClone(DEFAULTS);
  }
}

export function saveAccounts(accounts) {
  localStorage.setItem(KEY, JSON.stringify(accounts));
}

export function timestamp() {
  return new Date().toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export function fmt(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 2,
  }).format(amount);
}
