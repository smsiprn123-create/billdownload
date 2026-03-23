const secretKey = "1234567890abcdef";
const ivText = "1234567890123456";
const detailsApiBase =
  "https://crmjdvvnl.in/ComplaintRegistration/GetList?OfficeCode=0&ConsumerType=1&Searchparm=";
const downloadBaseUrl =
  "https://jdvvnl.bijliprabandh.com/jdvvnlprabhand/billPrintByAccountNoFromNcms/download";
const defaultTariffCode = "4000P";
const authFile = "./user.txt";

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

const loginCard = document.getElementById("login-card");
const appCard = document.getElementById("app-card");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const loginButton = document.getElementById("login-btn");
const loginStatusElement = document.getElementById("login-status");

const knoInput = document.getElementById("kno");
const monthSelect = document.getElementById("month");
const yearSelect = document.getElementById("year");
const responseJsonInput = document.getElementById("response-json");
const detailsButton = document.getElementById("details-btn");
const downloadButton = document.getElementById("download-btn");
const statusElement = document.getElementById("status");

function setStatus(text, tone) {
  statusElement.textContent = text;
  statusElement.className = tone;
}

function setLoginStatus(text, tone) {
  loginStatusElement.textContent = text;
  loginStatusElement.className = tone;
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

function parseAccount(payload) {
  const account = Array.isArray(payload) ? payload[0] : payload;
  const accno = account?.accno || account?.ACCOUNT_NO;
  const sdocode = account?.sdocode || account?.SDO_CODE;
  const tariffcode =
    account?.tariffcode || account?.TARIFF_CODE || account?.tariffCode || defaultTariffCode;

  if (!account || !accno || !sdocode) {
    throw new Error("Invalid");
  }

  return {
    accno,
    sdocode,
    tariffcode
  };
}

function openDetailsPage() {
  const kno = knoInput.value.trim();
  if (!kno) {
    setStatus("Invalid", "error");
    return;
  }

  const url = detailsApiBase + encodeURIComponent(kno);
  window.open(url, "_blank", "noopener,noreferrer");
  setStatus("Paste JSON and click Download", "idle");
}

function parseAccountFromTextarea() {
  const payload = JSON.parse(responseJsonInput.value.trim());
  return parseAccount(payload);
}

async function downloadBill() {
  try {
    const account = parseAccountFromTextarea();
    const billUrl = await buildBillUrl(account);
    setStatus("Valid", "success");
    window.open(billUrl, "_blank", "noopener,noreferrer");
  } catch {
    setStatus("Invalid", "error");
  }
}

function unlockApp() {
  loginCard.classList.add("hidden");
  appCard.classList.remove("hidden");
}

async function login() {
  const username = usernameInput.value.trim();
  const password = passwordInput.value;

  if (!username || !password) {
    setLoginStatus("Invalid", "error");
    return;
  }

  setLoginStatus("Checking...", "idle");

  try {
    const response = await fetch(authFile, { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Missing user file");
    }

    const content = await response.text();
    const isValid = content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .some((line) => {
        const [savedUser, ...rest] = line.split(":");
        return savedUser === username && rest.join(":") === password;
      });

    if (!isValid) {
      throw new Error("Invalid");
    }

    sessionStorage.setItem("bill-auth", "ok");
    setLoginStatus("Success", "success");
    unlockApp();
  } catch {
    setLoginStatus("Invalid", "error");
  }
}

fillDateOptions();

if (sessionStorage.getItem("bill-auth") === "ok") {
  unlockApp();
}

loginButton.addEventListener("click", login);
detailsButton.addEventListener("click", openDetailsPage);
downloadButton.addEventListener("click", downloadBill);
