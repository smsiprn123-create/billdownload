import { useEffect, useState } from "react";

const secretKey = "1234567890abcdef";
const ivText = "1234567890123456";
const downloadBaseUrl =
  "https://jdvvnl.bijliprabandh.com/jdvvnlprabhand/billPrintByAccountNoFromNcms/download";

const months = [
  ["01", "January"],
  ["02", "February"],
  ["03", "March"],
  ["04", "April"],
  ["05", "May"],
  ["06", "June"],
  ["07", "July"],
  ["08", "August"],
  ["09", "September"],
  ["10", "October"],
  ["11", "November"],
  ["12", "December"]
];

function bytesToBase64(bytes) {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

let importedKeyPromise;
function getCryptoKey() {
  if (!importedKeyPromise) {
    importedKeyPromise = crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secretKey),
      { name: "AES-CBC" },
      false,
      ["encrypt"]
    );
  }

  return importedKeyPromise;
}

async function encryptValue(value) {
  const key = await getCryptoKey();
  const cipherBuffer = await crypto.subtle.encrypt(
    { name: "AES-CBC", iv: new TextEncoder().encode(ivText) },
    key,
    new TextEncoder().encode(value)
  );

  return bytesToBase64(new Uint8Array(cipherBuffer));
}

function getInitialMonthYear() {
  const now = new Date();
  return {
    month: String(now.getMonth() + 1).padStart(2, "0"),
    year: String(now.getFullYear())
  };
}

async function buildUrl(account, year, month) {
  const billMonth = `${year}${month}`;

  const query = new URLSearchParams({
    accountNo: await encryptValue(String(account.accno)),
    billMonth: await encryptValue(billMonth),
    sdocode: await encryptValue(String(account.sdocode)),
    tariffCode: await encryptValue(String(account.tariffcode))
  });

  return `${downloadBaseUrl}?${query.toString()}`;
}

export default function App() {
  const initialDate = getInitialMonthYear();
  const [kno, setKno] = useState("");
  const [month, setMonth] = useState(initialDate.month);
  const [year, setYear] = useState(initialDate.year);
  const [years, setYears] = useState([]);
  const [status, setStatus] = useState({ text: "", tone: "idle" });

  useEffect(() => {
    const currentYear = new Date().getFullYear();
    const nextYears = [];
    for (let value = currentYear - 2; value <= currentYear + 1; value += 1) {
      nextYears.push(String(value));
    }
    setYears(nextYears);
  }, []);

  async function handleFetch() {
    const trimmedKno = kno.trim();
    if (!trimmedKno) {
      setStatus({ text: "Invalid", tone: "error" });
      return;
    }

    setStatus({ text: "Checking...", tone: "idle" });

    try {
      const response = await fetch(`/api/accountdetailsByKno/${encodeURIComponent(trimmedKno)}`);
      const raw = await response.text();
      let payload;

      try {
        payload = JSON.parse(raw);
      } catch {
        throw new Error("Invalid response");
      }

      if (!response.ok) {
        throw new Error(payload.error || "Invalid");
      }

      const account = Array.isArray(payload) ? payload[0] : payload;
      if (!account?.accno || !account?.sdocode || !account?.tariffcode) {
        throw new Error("Invalid");
      }

      const url = await buildUrl(account, year, month);
      setStatus({ text: "Valid", tone: "success" });
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      setStatus({ text: "Invalid", tone: "error" });
    }
  }

  return (
    <main className="app-shell">
      <section className="card">
        <label className="field">
          <span>Kno</span>
          <input
            type="text"
            value={kno}
            onChange={(event) => setKno(event.target.value)}
            placeholder="Enter Kno"
          />
        </label>

        <div className="row">
          <label className="field">
            <span>Month</span>
            <select value={month} onChange={(event) => setMonth(event.target.value)}>
              {months.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Year</span>
            <select value={year} onChange={(event) => setYear(event.target.value)}>
              {years.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
        </div>

        <button type="button" className="button" onClick={handleFetch}>
          Fetch
        </button>

        {status.text ? <p className={`status status-${status.tone}`}>{status.text}</p> : null}
      </section>
    </main>
  );
}
