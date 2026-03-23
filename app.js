const secretKey = "1234567890abcdef";
const ivText = "1234567890123456";
const detailsApiBase = "https://jdvvnl.bijlimitra.com/jdvvnlmitra/accountdetailsByKno/";
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

const knoInput = document.getElementById("kno");
const monthSelect = document.getElementById("month");
const yearSelect = document.getElementById("year");
const fetchButton = document.getElementById("fetch-btn");
const statusElement = document.getElementById("status");

function setStatus(text, tone) {
  statusElement.textContent = text;
  statusElement.className = tone;
}

function fillDateOptions() {
  months.forEach(([value, label]) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    monthSelect.appendChild(option);
  });

  const currentYear = new Date().getFullYear();
  for (let year = currentYear - 2; year <= currentYear + 1; year += 1) {
    const option = document.createElement("option");
    option.value = String(year);
    option.textContent = String(year);
    yearSelect.appendChild(option);
  }

  const now = new Date();
  monthSelect.value = String(now.getMonth() + 1).padStart(2, "0");
  yearSelect.value = String(now.getFullYear());
}

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
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-CBC", iv: new TextEncoder().encode(ivText) },
    key,
    new TextEncoder().encode(value)
  );

  return bytesToBase64(new Uint8Array(encrypted));
}

async function buildBillUrl(account) {
  const billMonth = `${yearSelect.value}${monthSelect.value}`;

  const query = new URLSearchParams({
    accountNo: await encryptValue(String(account.accno)),
    billMonth: await encryptValue(billMonth),
    sdocode: await encryptValue(String(account.sdocode)),
    tariffCode: await encryptValue(String(account.tariffcode))
  });

  return `${downloadBaseUrl}?${query.toString()}`;
}

async function fetchAccount() {
  const kno = knoInput.value.trim();
  if (!kno) {
    setStatus("Invalid", "error");
    return;
  }

  setStatus("Checking...", "idle");

  try {
    const response = await fetch(detailsApiBase + encodeURIComponent(kno), {
      headers: {
        Accept: "application/json, text/plain, */*"
      }
    });

    if (!response.ok) {
      throw new Error("Invalid");
    }

    const payload = await response.json();
    const account = Array.isArray(payload) ? payload[0] : payload;

    if (!account || !account.accno || !account.sdocode || !account.tariffcode) {
      throw new Error("Invalid");
    }

    const billUrl = await buildBillUrl(account);
    setStatus("Valid", "success");
    window.open(billUrl, "_blank", "noopener,noreferrer");
  } catch {
    setStatus("Invalid", "error");
  }
}

fillDateOptions();
fetchButton.addEventListener("click", fetchAccount);
