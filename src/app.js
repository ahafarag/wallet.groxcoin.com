// Grox web wallet. Keys are created and kept in this browser (IndexedDB, encrypted with the
// wallet password by the wallet engine itself). The node only serves chain data.
import moneroTs from "../../monero-ts/dist/index.js";
import qrcode from "qrcode-generator";

const ATOMIC = 10n ** 11n;            // 1 GROX = 10^11 atomic units
const DEFAULT_NODE = "https://node.groxcoin.com";
const NET = moneroTs.MoneroNetworkType.MAINNET;
const $ = id => document.getElementById(id);

// ------------------------------------------------------------------ i18n
const AR = {
  title: "محفظة الويب", lock: "قفل", loading: "بنحمّل المحفظة…",
  welcome_h: "Grox بتاعك، في المتصفح", welcome_p: "مفاتيحك بتتعمل وبتتحفظ على الجهاز ده بس. عمرها ما بتتبعت لينا ولا للنود. اكتب الـ 25 كلمة (seed) على ورقة: دي الطريقة الوحيدة ترجّع بيها فلوسك.",
  new_h: "محفظة جديدة", new_p: "اعمل محفظة جديدة وخد الـ 25 كلمة بتوعها.", new_b: "اعمل محفظة",
  restore_h: "استرجاع", restore_p: "استخدم الـ 25 كلمة من تطبيق Grox Wallet أو الـ CLI أو الموقع ده.", restore_b: "استرجع بالكلمات",
  open_h: "فتح", open_p: "افتح المحفظة المحفوظة في المتصفح ده.", open_b: "افتح المحفظة",
  safety_h: "خلّي بالك.", safety_p: "العنوان الرسمي الوحيد هو wallet.groxcoin.com. متستخدمش كمبيوتر مشترك أو عام. محدش من Grox هيطلب منك الـ seed أبداً.",
  seed_l: "الـ 25 كلمة", height_l: "ابدأ من بلوك (اختياري)", height_n: "سيبها فاضية عشان يفحص السلسلة كلها. لو حطيت بلوك قبل أول دفعة جاتلك، الفحص هيبقى أسرع.",
  pw_l: "باسورد للجهاز ده", pw2_l: "كرر الباسورد", pw_n: "الباسورد بيشفّر المحفظة المحفوظة في المتصفح. ده مش الـ seed ومش هيرجّع فلوسك لو ضاعت الكلمات.",
  continue: "كمّل", back: "رجوع",
  seed_h: "اكتب الكلمات بتاعتك", seed_p: "الـ 25 كلمة دول هما محفظتك. اكتبهم على ورقة بالترتيب واحفظهم بعيد عن النت. أي حد معاه الكلمات يقدر ياخد فلوسك، ومن غيرهم لو الجهاز ضاع الفلوس هتضيع.",
  seed_ok: "كتبت الـ 25 كلمة وحافظ عليهم.", balance: "الرصيد",
  receive: "استلام", send: "إرسال", history: "السجل", settings: "الإعدادات",
  your_addr: "عنوان Grox بتاعك", copy: "انسخ", recv_n: "الفلوس اللي بتتعدّن والتحويلات بتظهر بعد ما المحفظة تتزامن. فلوس التعدين بتتفتح بعد 60 بلوك، والتحويلات بعد 10.",
  to_l: "ابعت لـ (عنوان Grox)", amt_l: "المبلغ (GROX)", max: "الكل", review: "راجع", sending: "انت بتبعت", to: "لـ", fee: "رسوم الشبكة",
  send_now: "ابعت دلوقتي", cancel: "إلغاء",
  h_when: "امتى", h_type: "النوع", h_amt: "المبلغ", h_block: "البلوك", h_status: "الحالة",
  node_h: "النود", node_p: "النود بيبعت بيانات السلسلة للمتصفح بس، وعمره ما بيشوف مفاتيحك. تقدر تستخدم نود بتاعك (لازم HTTPS ويسمح للموقع ده).", save: "احفظ",
  seedshow_h: "اعرض الكلمات", seedshow_p: "اكتب الباسورد عشان تشوف الـ 25 كلمة. اتأكد إن محدش شايف الشاشة.", show: "اعرض",
  rescan_h: "إعادة فحص", rescan_p: "لو دفعة مش ظاهرة، افحص السلسلة تاني من بلوك البداية.", rescan_b: "افحص تاني",
  forget_h: "امسح من المتصفح ده", forget_p: "بيمسح المحفظة المحفوظة من المتصفح. فلوسك فاضلة على السلسلة وبترجع بالكلمات.", forget_b: "امسح المحفظة من المتصفح",
  foot: "المفاتيح عمرها ما بتسيب المتصفح. محرّك مفتوح المصدر (monero-ts) متبني من كود Grox.",
};
const EN = {};
document.querySelectorAll("[data-t]").forEach(e => EN[e.dataset.t] = e.textContent);
const MSG = {
  en: { create_t: "Create a new wallet", restore_t: "Restore from seed", open_t: "Open saved wallet", pw_short: "Use at least 8 characters.", pw_diff: "The passwords don't match.",
    bad_seed: "That doesn't look like a 25-word seed.", wrong_pw: "Wrong password, or the saved wallet is damaged.", creating: "Creating your wallet…", restoring: "Restoring…", opening: "Opening…",
    syncing: (h, t) => `Syncing block ${h.toLocaleString()} of ${t.toLocaleString()}`, synced: h => `Up to date · block ${h.toLocaleString()}`, offline: "Can't reach the node, retrying…",
    unlocked: a => `${a} spendable now`, copied: "Copied", bad_addr: "That is not a valid Grox address (it starts with G).", bad_amt: "Enter an amount above 0.",
    not_enough: "Not enough spendable GROX for this amount plus the fee.", preparing: "Preparing…", sent: h => `Sent. Transaction ID: ${h}`, sending: "Sending…",
    in: "Received", out: "Sent", mined: "Mined", pending: "pending", locked: n => `unlocks in ${n} blocks`, done: "done", none: "No transactions yet.",
    forget_q: "Remove this wallet from this browser? Make sure you have your 25-word seed first.", node_ok: "Connected", node_bad: "Can't reach this node", wrong_pw2: "Wrong password.", rescanning: "Rescanning…" },
  ar: { create_t: "اعمل محفظة جديدة", restore_t: "استرجع بالكلمات", open_t: "افتح المحفظة المحفوظة", pw_short: "استخدم 8 حروف على الأقل.", pw_diff: "الباسوردين مش زي بعض.",
    bad_seed: "دي مش شكل 25 كلمة.", wrong_pw: "الباسورد غلط، أو المحفظة المحفوظة بايظة.", creating: "بنعمل المحفظة…", restoring: "بنسترجع…", opening: "بنفتح…",
    syncing: (h, t) => `بنزامن البلوك ${h.toLocaleString()} من ${t.toLocaleString()}`, synced: h => `متزامنة · بلوك ${h.toLocaleString()}`, offline: "مش قادرين نوصل للنود، بنحاول تاني…",
    unlocked: a => `${a} متاحة للصرف دلوقتي`, copied: "اتنسخ", bad_addr: "ده مش عنوان Grox صحيح (بيبدأ بـ G).", bad_amt: "اكتب مبلغ أكبر من 0.",
    not_enough: "الرصيد المتاح مش مكفي للمبلغ ده مع الرسوم.", preparing: "بنجهّز…", sent: h => `اتبعتت. رقم العملية: ${h}`, sending: "بنبعت…",
    in: "استلام", out: "إرسال", mined: "تعدين", pending: "مستنية", locked: n => `تتفتح بعد ${n} بلوك`, done: "تمام", none: "لسه مفيش عمليات.",
    forget_q: "تمسح المحفظة من المتصفح ده؟ اتأكد إن الـ 25 كلمة معاك الأول.", node_ok: "متصل", node_bad: "مش قادرين نوصل للنود ده", wrong_pw2: "الباسورد غلط.", rescanning: "بنفحص تاني…" },
};
let LANG = localStorage.getItem("grox.lang") || ((navigator.language || "").startsWith("ar") ? "ar" : "en");
const m = k => MSG[LANG][k];
function setLang(l) {
  LANG = l; localStorage.setItem("grox.lang", l);
  document.documentElement.lang = l; document.documentElement.dir = l === "ar" ? "rtl" : "ltr";
  document.querySelectorAll("[data-t]").forEach(e => e.textContent = (l === "ar" ? AR : EN)[e.dataset.t] || EN[e.dataset.t]);
  $("langBtn").textContent = l === "ar" ? "English" : "العربي";
  if (W) { renderBalance(); renderHistory(); }
}
$("langBtn").onclick = () => setLang(LANG === "ar" ? "en" : "ar");

// ------------------------------------------------------------------ helpers
function fmt(atomic, dp = 4) {
  const neg = atomic < 0n; let a = neg ? -atomic : atomic;
  const whole = a / ATOMIC, frac = (a % ATOMIC).toString().padStart(11, "0").slice(0, dp);
  return (neg ? "-" : "") + whole.toLocaleString("en-US") + (dp ? "." + frac : "");
}
function parseAmount(s) {
  s = String(s).trim().replace(",", ".");
  if (!/^\d+(\.\d{0,11})?$/.test(s)) return null;
  const [w, f = ""] = s.split(".");
  return BigInt(w) * ATOMIC + BigInt((f + "00000000000").slice(0, 11));
}
function toast(t) { const d = document.createElement("div"); d.className = "toast"; d.textContent = t; document.body.appendChild(d); setTimeout(() => d.remove(), 2200); }
function show(v) { ["vLoading", "vWelcome", "vPass", "vSeed", "vWallet"].forEach(x => $(x).classList.toggle("hide", x !== v)); $("lockBtn").classList.toggle("hide", v !== "vWallet"); }
const node = () => localStorage.getItem("grox.node") || DEFAULT_NODE;

// IndexedDB: one saved wallet per browser
function db() {
  return new Promise((res, rej) => { const r = indexedDB.open("grox-wallet", 1); r.onupgradeneeded = () => r.result.createObjectStore("w"); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
}
async function dbGet() { const d = await db(); return new Promise(res => { const r = d.transaction("w").objectStore("w").get("main"); r.onsuccess = () => res(r.result); r.onerror = () => res(null); }); }
async function dbPut(v) { const d = await db(); return new Promise((res, rej) => { const t = d.transaction("w", "readwrite"); t.objectStore("w").put(v, "main"); t.oncomplete = res; t.onerror = () => rej(t.error); }); }
async function dbDel() { const d = await db(); return new Promise(res => { const t = d.transaction("w", "readwrite"); t.objectStore("w").delete("main"); t.oncomplete = res; }); }

// ------------------------------------------------------------------ wallet state
let W = null, PW = null, MODE = null, SYNC = { h: 0, t: 0, ok: true }, PENDING = null, saving = false, meta = {};

async function save() {
  if (!W || saving) return; saving = true;
  try {
    const [keys, cache] = await W.getData();
    await dbPut({ keys: new Uint8Array(keys.buffer, keys.byteOffset, keys.byteLength).slice(),
      cache: new Uint8Array(cache.buffer, cache.byteOffset, cache.byteLength).slice(), restoreHeight: meta.restoreHeight || 0, saved: Date.now() });
  } catch (e) { console.warn("save failed", e); } finally { saving = false; }
}

class Listener extends moneroTs.MoneroWalletListener {
  async onSyncProgress(height, startHeight, endHeight) { SYNC.h = height; SYNC.t = endHeight; renderSync(); }
  async onBalancesChanged() { renderBalance(); renderHistory(); }
  async onNewBlock(height) { SYNC.h = height; renderSync(); }
}

async function startWallet(wallet) {
  W = wallet;
  $("addr").textContent = await W.getPrimaryAddress();
  const q = qrcode(0, "M"); q.addData("grox:" + $("addr").textContent); q.make(); $("qr").src = q.createDataURL(6, 2);
  $("nodeIn").value = node();
  show("vWallet");
  await W.addListener(new Listener());
  renderBalance(); renderHistory();
  syncLoop();
}

async function syncLoop() {
  while (W) {
    try {
      const t = await W.getDaemonHeight(); SYNC.t = t; SYNC.ok = true;
      if ((await W.getHeight()) < t) { await W.sync(); await save(); }
      SYNC.h = await W.getHeight(); renderSync(); renderBalance(); renderHistory();
    } catch (e) { SYNC.ok = false; renderSync(); }
    await new Promise(r => setTimeout(r, SYNC.ok ? 20000 : 10000));
  }
}

function renderSync() {
  if (!SYNC.ok) { $("syncTxt").textContent = m("offline"); return; }
  const done = SYNC.t && SYNC.h >= SYNC.t - 1;
  $("syncTxt").textContent = done ? m("synced")(SYNC.h) : m("syncing")(SYNC.h, SYNC.t || SYNC.h);
  $("syncBar").style.width = (SYNC.t ? Math.min(100, 100 * SYNC.h / SYNC.t) : 0) + "%";
}
async function renderBalance() {
  if (!W) return;
  try {
    const b = await W.getBalance(), u = await W.getUnlockedBalance();
    $("bal").innerHTML = ""; $("bal").append(fmt(b)); const s = document.createElement("small"); s.textContent = " GROX"; $("bal").append(s);
    $("unl").textContent = b !== u ? m("unlocked")(fmt(u) + " GROX") : "";
  } catch (e) {}
}
async function renderHistory() {
  if (!W) return;
  let txs; try { txs = await W.getTxs(); } catch (e) { return; }
  txs.sort((a, b) => (b.getHeight() || 1e12) - (a.getHeight() || 1e12));
  const tb = $("hist"); tb.innerHTML = "";
  if (!txs.length) { const tr = tb.insertRow(); const td = tr.insertCell(); td.colSpan = 5; td.className = "muted"; td.textContent = m("none"); return; }
  const loc = LANG === "ar" ? "ar-EG" : "en-GB";
  for (const tx of txs.slice(0, 200)) {
    const inAmt = tx.getIncomingAmount() || 0n, outAmt = tx.getOutgoingAmount() || 0n;
    const net = inAmt - outAmt;
    const ts = tx.getBlock() ? tx.getBlock().getTimestamp() : tx.getReceivedTimestamp() || tx.getLastRelayedTimestamp();
    const conf = tx.getNumConfirmations() || 0, need = tx.getIsMinerTx() ? 60 : 10;
    const tr = tb.insertRow();
    tr.insertCell().textContent = ts ? new Date(ts * 1000).toLocaleString(loc, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";
    tr.insertCell().textContent = tx.getIsMinerTx() ? m("mined") : (net >= 0n ? m("in") : m("out"));
    const a = tr.insertCell(); a.textContent = (net >= 0n ? "+" : "") + fmt(net) + " GROX"; a.className = net >= 0n ? "ok" : "";
    tr.insertCell().textContent = tx.getHeight() ? "#" + tx.getHeight().toLocaleString() : "—";
    tr.insertCell().textContent = !tx.getIsConfirmed() ? m("pending") : (conf < need ? m("locked")(need - conf) : m("done"));
  }
}

// ------------------------------------------------------------------ flows
function passView(mode) {
  MODE = mode; $("passErr").textContent = ""; $("pw1").value = ""; $("pw2").value = "";
  $("passTitle").textContent = m(mode + "_t");
  $("restoreFields").classList.toggle("hide", mode !== "restore");
  $("pw2Box").classList.toggle("hide", mode === "open");
  $("pw1").autocomplete = mode === "open" ? "current-password" : "new-password";
  show("vPass"); (mode === "restore" ? $("seedIn") : $("pw1")).focus();
}
$("goNew").onclick = () => passView("create");
$("goRestore").onclick = () => passView("restore");
$("goOpen").onclick = () => passView("open");
$("passBack").onclick = () => show("vWelcome");
$("pw1").onkeydown = $("pw2").onkeydown = e => { if (e.key === "Enter") $("passGo").click(); };

$("passGo").onclick = async () => {
  const pw = $("pw1").value, err = t => { $("passErr").textContent = t; $("passGo").disabled = false; };
  if (MODE !== "open") {
    if (pw.length < 8) return err(m("pw_short"));
    if (pw !== $("pw2").value) return err(m("pw_diff"));
  }
  $("passGo").disabled = true;
  const server = { uri: node() };
  try {
    if (MODE === "create") {
      $("passErr").textContent = m("creating");
      const w = await moneroTs.createWalletFull({ networkType: NET, password: pw, server, proxyToWorker: true });
      meta.restoreHeight = await w.getRestoreHeight(); PW = pw; W = w; await save();
      const words = (await w.getSeed()).split(" ");
      const g = $("seedGrid"); g.innerHTML = ""; words.forEach((wd, i) => { const s = document.createElement("span"); const n = document.createElement("i"); n.textContent = i + 1; s.append(n, wd); g.append(s); });
      $("seedOk").checked = false; $("seedDone").disabled = true; show("vSeed");
    } else if (MODE === "restore") {
      const seed = $("seedIn").value.trim().toLowerCase().split(/\s+/).join(" ");
      if (seed.split(" ").length !== 25) return err(m("bad_seed"));
      const rh = parseInt($("heightIn").value, 10) || 0;
      $("passErr").textContent = m("restoring");
      const w = await moneroTs.createWalletFull({ networkType: NET, password: pw, server, seed, restoreHeight: rh, proxyToWorker: true });
      meta.restoreHeight = rh; PW = pw; W = w; await save(); $("seedIn").value = "";
      await startWallet(w);
    } else {
      $("passErr").textContent = m("opening");
      const s = await dbGet();
      const w = await moneroTs.openWalletFull({ networkType: NET, password: pw, server, keysData: s.keys, cacheData: s.cache, proxyToWorker: true });
      meta.restoreHeight = s.restoreHeight || 0; PW = pw;
      await startWallet(w);
    }
  } catch (e) {
    console.error(e);
    err(MODE === "open" ? m("wrong_pw") : String(e.message || e).slice(0, 200));
  }
};
$("seedOk").onchange = () => $("seedDone").disabled = !$("seedOk").checked;
$("seedDone").onclick = () => { $("seedGrid").innerHTML = ""; startWallet(W); };

// tabs
document.querySelectorAll(".tabs button").forEach(b => b.onclick = () => {
  document.querySelectorAll(".tabs button").forEach(x => x.classList.toggle("on", x === b));
  ["receive", "send", "history", "settings"].forEach(t => $("t" + t[0].toUpperCase() + t.slice(1)).classList.toggle("hide", t !== b.dataset.tab));
});
$("copyAddr").onclick = async () => { try { await navigator.clipboard.writeText($("addr").textContent); toast(m("copied")); } catch (e) {} };

// send
async function validAddr(a) { try { return await moneroTs.MoneroUtils.isValidAddress(a, NET); } catch (e) { return false; } }
$("maxBtn").onclick = async () => { if (W) $("amtIn").value = fmt(await W.getUnlockedBalance(), 11).replace(/,/g, ""); };
$("sendPrep").onclick = async () => {
  const to = $("toIn").value.trim(), amt = parseAmount($("amtIn").value.replace(/,/g, "")), err = t => { $("sendErr").textContent = t; $("sendPrep").disabled = false; };
  $("sendErr").textContent = ""; $("sendOk").textContent = "";
  if (!(await validAddr(to))) return err(m("bad_addr"));
  if (!amt || amt <= 0n) return err(m("bad_amt"));
  $("sendPrep").disabled = true; $("sendErr").textContent = m("preparing");
  try {
    const unl = await W.getUnlockedBalance();
    const sweep = amt === unl;
    PENDING = sweep
      ? (await W.sweepUnlocked({ accountIndex: 0, address: to, relay: false }))[0]
      : await W.createTx({ accountIndex: 0, address: to, amount: amt, relay: false });
    const sentAmt = sweep ? (PENDING.getOutgoingAmount() || amt) - PENDING.getFee() : amt;
    $("cAmt").textContent = fmt(sentAmt, 11) + " GROX"; $("cTo").textContent = to; $("cFee").textContent = fmt(PENDING.getFee(), 11) + " GROX";
    $("sendErr").textContent = ""; $("sendConfirm").classList.remove("hide");
  } catch (e) {
    const s = String(e.message || e);
    err(/not enough|balance|money/i.test(s) ? m("not_enough") : s.slice(0, 200));
  }
};
$("sendCancel").onclick = () => { PENDING = null; $("sendConfirm").classList.add("hide"); $("sendPrep").disabled = false; };
$("sendGo").onclick = async () => {
  if (!PENDING) return;
  $("sendGo").disabled = true; $("sendErr").textContent = m("sending");
  try {
    const h = await W.relayTx(PENDING); PENDING = null;
    $("sendErr").textContent = ""; $("sendOk").textContent = m("sent")(h);
    $("sendConfirm").classList.add("hide"); $("toIn").value = ""; $("amtIn").value = "";
    await save(); renderBalance(); renderHistory();
  } catch (e) { $("sendErr").textContent = String(e.message || e).slice(0, 200); }
  $("sendGo").disabled = false; $("sendPrep").disabled = false;
};

// settings
$("nodeSave").onclick = async () => {
  let u = $("nodeIn").value.trim().replace(/\/+$/, "");
  if (!/^https:\/\/[^\s/]+/.test(u)) { $("nodeState").textContent = m("node_bad"); return; }
  localStorage.setItem("grox.node", u);
  try { await W.setDaemonConnection(u); $("nodeState").textContent = (await W.isConnectedToDaemon()) ? m("node_ok") : m("node_bad"); }
  catch (e) { $("nodeState").textContent = m("node_bad"); }
};
$("seedShow").onclick = async () => {
  const g = $("seedGrid2");
  if ($("pwSeed").value !== PW) { toast(m("wrong_pw2")); return; }
  $("pwSeed").value = "";
  const words = (await W.getSeed()).split(" "); g.innerHTML = "";
  words.forEach((wd, i) => { const s = document.createElement("span"); const n = document.createElement("i"); n.textContent = i + 1; s.append(n, wd); g.append(s); });
  g.classList.remove("hide"); setTimeout(() => { g.innerHTML = ""; g.classList.add("hide"); }, 60000);
};
$("rescan").onclick = async () => { toast(m("rescanning")); try { await W.rescanBlockchain(); await save(); renderBalance(); renderHistory(); } catch (e) { toast(String(e.message || e).slice(0, 120)); } };
$("forget").onclick = async () => {
  if (!confirm(m("forget_q"))) return;
  const w = W; W = null; PW = null; try { await w.close(false); } catch (e) {}
  await dbDel(); location.reload();
};
$("lockBtn").onclick = async () => { await save(); const w = W; W = null; PW = null; try { await w.close(false); } catch (e) {} location.reload(); };
window.addEventListener("beforeunload", () => { if (W) save(); });

// ------------------------------------------------------------------ start
(async () => {
  if (window.top !== window.self) { document.body.innerHTML = ""; return; }  // never run inside a frame (clickjacking)
  setLang(LANG);
  moneroTs.LibraryUtils.setWorkerDistPath(new URL("monero.worker.js", location.href).href);
  try { await moneroTs.LibraryUtils.loadWasmModule(); } catch (e) { console.warn(e); }
  const saved = await dbGet();
  $("openCard").classList.toggle("hide", !saved);
  show("vWelcome");
})();
