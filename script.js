/* ============================================================
   سیستم ثبت نام و ورود (localStorage)
   + پنل مدیریت ادمین + داشبورد اخبار با ترجمه فارسی
   ============================================================ */

// ---------- ابزارها ----------
const $ = (sel, parent = document) => parent.querySelector(sel);
const $$ = (sel, parent = document) => [...parent.querySelectorAll(sel)];

// ---------- کلیدهای localStorage ----------
const USERS_KEY = "mySite_users";
const NEWS_CACHE_KEY = "mySite_news_cache";
const SESSION_KEY = "mySite_session";

// ---------- مدیریت کاربران در localStorage ----------
const DB = {
    getAll() {
        const data = localStorage.getItem(USERS_KEY);
        return data ? JSON.parse(data) : [];
    },

    saveAll(users) {
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    },

    findByEmail(email) {
        const users = this.getAll();
        return users.find(u => u.email === email.trim().toLowerCase()) || null;
    },

    findById(id) {
        const users = this.getAll();
        return users.find(u => u.id === id) || null;
    },

    add(user) {
        const users = this.getAll();
        const newUser = { ...user, id: Date.now().toString(36) + Math.random().toString(36).substr(2) };
        users.push(newUser);
        this.saveAll(users);
        return newUser.id;
    },

    update(email, data) {
        const users = this.getAll();
        const idx = users.findIndex(u => u.email === email);
        if (idx === -1) throw new Error("User not found");
        users[idx] = { ...users[idx], ...data };
        this.saveAll(users);
    },

    delete(email) {
        const users = this.getAll().filter(u => u.email !== email);
        this.saveAll(users);
    },

    wipeAll() {
        localStorage.removeItem(USERS_KEY);
    }
};

// ---------- کش اخبار در localStorage ----------
const NewsCache = {
    get(key) {
        const data = localStorage.getItem(NEWS_CACHE_KEY);
        if (!data) return null;
        const cache = JSON.parse(data);
        return cache[key] || null;
    },

    set(key, value) {
        const data = localStorage.getItem(NEWS_CACHE_KEY);
        const cache = data ? JSON.parse(data) : {};
        cache[key] = value;
        localStorage.setItem(NEWS_CACHE_KEY, JSON.stringify(cache));
    },

    getAllKeys() {
        const data = localStorage.getItem(NEWS_CACHE_KEY);
        if (!data) return [];
        return Object.keys(JSON.parse(data));
    },

    clearAll() {
        localStorage.removeItem(NEWS_CACHE_KEY);
    }
};

// ---------- المان‌های اصلی ----------
const tabsNav      = $(".tabs");
const loginTab     = $("#login-tab");
const signupTab    = $("#signup-tab");
const messageBox   = $("#message");
const loginForm    = $("#login-form");
const signupForm   = $("#signup-form");
const welcomeOverlay = $("#welcome-overlay");

// ---------- اعتبارنامه ادمین ----------
const ADMIN_USER = "admin";
const ADMIN_PASS = "admin123";

// ---------- مدیریت تب‌ها ----------
function switchTab(which) {
    const isLogin = which === "login";

    loginTab.classList.toggle("active", isLogin);
    signupTab.classList.toggle("active", !isLogin);
    tabsNav.classList.toggle("show-signup", !isLogin);

    loginForm.classList.toggle("active", isLogin);
    signupForm.classList.toggle("active", !isLogin);

    hideMessage();
}

loginTab.addEventListener("click", () => switchTab("login"));
signupTab.addEventListener("click", () => switchTab("signup"));

$$("[data-goto]").forEach((a) =>
    a.addEventListener("click", (e) => {
        e.preventDefault();
        switchTab(a.dataset.goto);
    })
);

// ---------- نمایش پیام سراسری ----------
let messageTimer;
function showMessage(text, type = "success") {
    messageBox.textContent = text;
    messageBox.className = `message ${type}`;
    clearTimeout(messageTimer);
    if (type === "success") {
        messageTimer = setTimeout(hideMessage, 4000);
    }
}
function hideMessage() {
    messageBox.className = "message";
    messageBox.textContent = "";
}

// ---------- خطای فیلدها ----------
function setError(inputId, text) {
    const input = $(`#${inputId}`);
    const box = input.closest(".input-box");
    const errEl = $(`[data-error-for="${inputId}"]`);

    box.classList.toggle("invalid", !!text);
    box.classList.remove("valid");
    errEl.textContent = text || "";
    return !text;
}

// ---------- اعتبارسنجی ایمیل ----------
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

// ---------- رمز عبور فقط انگلیسی ----------
const LATIN_PASSWORD_RE = /^[A-Za-z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~ ]+$/;

function isLatinPassword(pass) {
    return LATIN_PASSWORD_RE.test(pass);
}

// ---------- نمایش / مخفی کردن رمز عبور ----------
$$(".toggle-pass").forEach((btn) => {
    btn.addEventListener("click", () => {
        const input = btn.parentElement.querySelector("input");
        input.type = input.type === "password" ? "text" : "password";
    });
});

/* ============================================================
   فرم ثبت نام
   ============================================================ */
const nameInput     = $("#signup-name");
const sEmailInput   = $("#signup-email");
const sPassInput    = $("#signup-password");
const strengthBar   = $(".strength-bar i");
const passwordHint  = $("#password-hint");

sPassInput.addEventListener("input", () => {
    const v = sPassInput.value;
    let score = 0;
    if (v.length >= 6) score++;
    if (v.length >= 10) score++;
    if (/[A-Z]/.test(v)) score++;
    if (/[0-9]/.test(v)) score++;
    if (/[^A-Za-z0-9]/.test(v)) score++;

    strengthBar.style.width = `${(score / 5) * 100}%`;
    passwordHint.textContent =
        score === 0 ? "" :
        score <= 2 ? "رمز عبور ضعیف است" :
        score <= 3 ? "رمز عبور متوسط" :
                     "رمز عبور قوی ✅";
});

nameInput.addEventListener("input", () => setError(nameInput.id, ""));
sEmailInput.addEventListener("input", () => setError(sEmailInput.id, ""));
sPassInput.addEventListener("input", () => setError(sPassInput.id, ""));

sPassInput.addEventListener("beforeinput", (e) => {
    if (!e.data) return;
    if (!LATIN_PASSWORD_RE.test(e.data)) {
        e.preventDefault();
        setError(sPassInput.id, "رمز عبور فقط باید شامل حروف انگلیسی، اعداد و نمادها باشد.");
        showMessage("رمز عبور فقط با حروف انگلیسی قابل قبول است ⌨️", "error-msg");
    }
});

sPassInput.addEventListener("paste", (e) => {
    const pasted = (e.clipboardData || window.clipboardData).getData("text");
    if (!isLatinPassword(pasted)) {
        e.preventDefault();
        setError(sPassInput.id, "رمز عبور فقط باید شامل حروف انگلیسی، اعداد و نمادها باشد.");
        showMessage("متن کپی‌شده شامل کاراکتر غیرانگلیسی است.", "error-msg");
    }
});

signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    let ok = true;
    ok &= setError(nameInput.id,
        nameInput.value.trim().length >= 3 ? "" : "نام باید حداقل ۳ کاراکتر باشد.");
    ok &= setError(sEmailInput.id,
        isValidEmail(sEmailInput.value) ? "" : "ایمیل معتبر نیست.");
    ok &= setError(sPassInput.id,
        sPassInput.value.length >= 6 ? "" : "رمز عبور باید حداقل ۶ کاراکتر باشد.");

    if (ok && !isLatinPassword(sPassInput.value)) {
        ok = false;
        setError(sPassInput.id, "رمز عبور فقط باید شامل حروف انگلیسی، اعداد و نمادها باشد.");
    }

    if (!ok) return;

    const existing = DB.findByEmail(sEmailInput.value);
    if (existing) {
        setError(sEmailInput.id, "این ایمیل قبلاً ثبت شده است.");
        showMessage("این ایمیل از قبل وجود دارد. وارد شوید.", "error-msg");
        return;
    }

    DB.add({
        name: nameInput.value.trim(),
        email: sEmailInput.value.trim().toLowerCase(),
        password: btoa(unescape(encodeURIComponent(sPassInput.value))),
        created_at: new Date().toISOString(),
    });

    showMessage("ثبت نام با موفقیت انجام شد! حالا وارد شوید. 🎉");
    signupForm.reset();
    strengthBar.style.width = "0";
    passwordHint.textContent = "";
    setTimeout(() => switchTab("login"), 900);
});

/* ============================================================
   فرم ورود (+ ورود ادمین)
   ============================================================ */
const lEmailInput = $("#login-email");
const lPassInput  = $("#login-password");

lEmailInput.addEventListener("input", () => setError(lEmailInput.id, ""));
lPassInput.addEventListener("input", () => setError(lPassInput.id, ""));

lPassInput.addEventListener("beforeinput", (e) => {
    if (!e.data) return;
    if (!LATIN_PASSWORD_RE.test(e.data)) {
        e.preventDefault();
        setError(lPassInput.id, "رمز عبور فقط باید شامل حروف انگلیسی باشد.");
    }
});

lPassInput.addEventListener("paste", (e) => {
    const pasted = (e.clipboardData || window.clipboardData).getData("text");
    if (!isLatinPassword(pasted)) {
        e.preventDefault();
        setError(lPassInput.id, "رمز عبور فقط باید شامل حروف انگلیسی باشد.");
        showMessage("متن کپی‌شده شامل کاراکتر غیرانگلیسی است.", "error-msg");
    }
});

loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const identifier = lEmailInput.value.trim().toLowerCase();

    // --- ورود مدیر سیستم 🛡️ (قبل از اعتبارسنجی ایمیل بررسی می‌شود) ---
    if (identifier === ADMIN_USER) {
        if (!lPassInput.value) {
            setError(lPassInput.id, "رمز عبور را وارد کنید.");
            return;
        }
        if (lPassInput.value !== ADMIN_PASS) {
            showMessage("رمز عبور ادمین اشتباه است.", "error-msg");
            return;
        }
        sessionStorage.setItem(SESSION_KEY, JSON.stringify({ email: "__ADMIN__" }));
        loginForm.reset();
        hideMessage();
        enterAdminPanel();
        return;
    }

    let ok = true;
    ok &= setError(lEmailInput.id, isValidEmail(lEmailInput.value) ? "" : "ایمیل معتبر نیست.");
    ok &= setError(lPassInput.id, lPassInput.value ? "" : "رمز عبور را وارد کنید.");
    if (!ok) return;

    const user = DB.findByEmail(lEmailInput.value);

    if (!user || user.password !== btoa(unescape(encodeURIComponent(lPassInput.value)))) {
        showMessage("ایمیل یا رمز عبور اشتباه است.", "error-msg");
        return;
    }

    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ email: user.email }));
    loginForm.reset();
    enterDashboard(user.name);
});

/* ============================================================
   خروج از حساب
   ============================================================ */
function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    welcomeOverlay.classList.remove("visible");
    $("#news-app").classList.remove("visible");
    $("#admin-app").classList.remove("visible");
    $(".container").style.display = "";
    document.body.classList.remove("dash-mode");
    switchTab("login");
    window.scrollTo(0, 0);
    showMessage("با موفقیت خارج شدید.");
}

$("#logout-btn").addEventListener("click", logout);
$("#logout-btn-2").addEventListener("click", logout);
$("#logout-btn-admin").addEventListener("click", logout);

/* ============================================================
   ورود به داشبورد اخبار
   ============================================================ */
function enterDashboard(name) {
    $("#dash-user-name").textContent = name;

    $(".container").style.display = "none";
    document.body.classList.add("dash-mode");

    const app = $("#news-app");
    app.classList.remove("visible");
    void app.offsetWidth;
    app.classList.add("visible");

    window.scrollTo(0, 0);
    loadNews(currentCat);
}

/* ============================================================
   پنل مدیریت ادمین 🛡️
   مشاهده / جستجو / ویرایش / حذف کاربران + آمار دیتابیس
   ============================================================ */
const adminAppEl = $("#admin-app");
const usersTbody = $("#users-tbody");
let editingEmail = null;

function faNum(n) {
    try { return Number(n).toLocaleString("fa-IR"); }
    catch { return String(n); }
}

function faDate(iso) {
    try {
        return new Date(iso).toLocaleDateString("fa-IR", {
            year: "numeric", month: "long", day: "numeric",
        });
    } catch {
        return iso ? iso.slice(0, 10) : "";
    }
}

async function enterAdminPanel() {
    $(".container").style.display = "none";
    document.body.classList.add("dash-mode");

    adminAppEl.classList.remove("visible");
    void adminAppEl.offsetWidth;
    adminAppEl.classList.add("visible");

    window.scrollTo(0, 0);
    await renderUsersTable("");
}

async function renderUsersTable(queryStr = "") {
    const all = DB.getAll();
    const users = all.filter((u) => {
        if (!queryStr) return true;
        const q = queryStr.toLowerCase();
        return u.name.toLowerCase().includes(q) || u.email.includes(q);
    });

    // آمار
    $("#stat-total").textContent = faNum(all.length);
    const newsCacheKeys = NewsCache.getAllKeys();
    $("#stat-news").textContent = faNum(newsCacheKeys.length);
    $("#stat-size").textContent = "—";

    if (!users.length) {
        usersTbody.innerHTML =
            `<tr><td colspan="5" class="table-empty">کاربری یافت نشد 😕</td></tr>`;
        return;
    }

    usersTbody.innerHTML = users
        .map((u, i) => `
        <tr>
            <td>${faNum(i + 1)}</td>
            <td>${escapeHtml(u.name)}</td>
            <td dir="ltr">${escapeHtml(u.email)}</td>
            <td>${faDate(u.created_at)}</td>
            <td class="actions">
                <button class="row-btn edit" data-edit="${escapeAttr(u.email)}" title="ویرایش">✏️</button>
                <button class="row-btn del" data-del="${escapeAttr(u.email)}" title="حذف">🗑️</button>
            </td>
        </tr>`)
        .join("");

    $$("#users-tbody .row-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            const email = btn.dataset.edit ?? btn.dataset.del;
            if ("edit" in btn.dataset) openEditModal(btn.dataset.edit);
            else deleteUser(btn.dataset.del);
        });
    });
}

$("#admin-search").addEventListener("input", (e) =>
    renderUsersTable(e.target.value.trim())
);

// --- حذف یک کاربر ---
async function deleteUser(email) {
    if (!confirm(`کاربر «${email}» حذف شود؟`)) return;
    DB.delete(email);
    await renderUsersTable($("#admin-search").value.trim());
    showMessage("کاربر حذف شد.", "error-msg");
}

// --- مودال ویرایش ---
async function openEditModal(email) {
    editingEmail = email;
    const u = DB.findByEmail(email);
    if (!u) return;
    $("#edit-name").value = u.name;
    $("#edit-email").value = u.email;
    $("#edit-pass").value = "";
    $("#edit-error").textContent = "";
    $("#edit-modal").classList.remove("hidden");
}

$("#edit-cancel").addEventListener("click", () =>
    $("#edit-modal").classList.add("hidden")
);

$("#edit-save").addEventListener("click", async () => {
    const name  = $("#edit-name").value.trim();
    const email = $("#edit-email").value.trim().toLowerCase();
    const pass  = $("#edit-pass").value;
    const errEl = $("#edit-error");
    errEl.textContent = "";

    if (name.length < 3) { errEl.textContent = "نام باید حداقل ۳ کاراکتر باشد."; return; }
    if (!isValidEmail(email)) { errEl.textContent = "ایمیل معتبر نیست."; return; }
    if (pass && pass.length < 6) { errEl.textContent = "رمز باید حداقل ۶ کاراکتر باشد."; return; }

    const existing = DB.findByEmail(email);
    if (existing && email !== editingEmail) {
        errEl.textContent = "این ایمیل برای کاربر دیگری استفاده شده است.";
        return;
    }

    DB.update(editingEmail, {
        name,
        email,
        ...(pass ? { password: btoa(unescape(encodeURIComponent(pass))) } : {}),
    });
    $("#edit-modal").classList.add("hidden");
    await renderUsersTable($("#admin-search").value.trim());
    showMessage("تغییرات ذخیره شد ✅");
});

// بستن مودال‌ها با کلیک روی پس‌زمینه
$$(".modal-overlay").forEach((m) =>
    m.addEventListener("click", (e) => {
        if (e.target === m) m.classList.add("hidden");
    })
);

// --- حذف همه کاربران ---
$("#wipe-users").addEventListener("click", async () => {
    if (!confirm("همه کاربران حذف شوند؟ این عمل قابل بازگشت نیست!")) return;
    DB.wipeAll();
    await renderUsersTable("");
});

// --- پاک‌سازی کش اخبار ---
$("#clear-news-cache").addEventListener("click", async () => {
    NewsCache.clearAll();
    await renderUsersTable($("#admin-search").value.trim());
});

/* ============================================================
   آدمک نگهبان رمز عبور 🙈
   ============================================================ */
const buddy = $("#buddy");
const pupils = $$(".pupil", buddy);
const passwordInputs = [lPassInput, sPassInput];

let eyeRaf = null;
function moveEyes(x, y) {
    if (eyeRaf) return;
    eyeRaf = requestAnimationFrame(() => {
        eyeRaf = null;
        const rect = buddy.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;

        const dx = x - cx;
        const dy = y - cy;
        const dist = Math.min(Math.hypot(dx, dy) / 260, 1);
        const angle = Math.atan2(dy, dx);

        const tx = Math.cos(angle) * dist * 3.5;
        const ty = Math.sin(angle) * dist * 3.5;

        pupils.forEach((p) => p.setAttribute("transform", `translate(${tx} ${ty})`));
    });
}

document.addEventListener("mousemove", (e) => moveEyes(e.clientX, e.clientY));
document.addEventListener(
    "touchstart",
    (e) => { if (e.touches.length) moveEyes(e.touches[0].clientX, e.touches[0].clientY); },
    { passive: true }
);
document.addEventListener(
    "touchmove",
    (e) => { if (e.touches.length) moveEyes(e.touches[0].clientX, e.touches[0].clientY); },
    { passive: true }
);

function updateBuddyCover() {
    const typingPassword = passwordInputs.some(
        (inp) => document.activeElement === inp && inp.type === "password"
    );
    buddy.classList.toggle("covering", typingPassword);
}

passwordInputs.forEach((inp) => {
    inp.addEventListener("focus", updateBuddyCover);
    inp.addEventListener("input", updateBuddyCover);
    inp.addEventListener("blur", () => setTimeout(updateBuddyCover, 120));
});

$$(".toggle-pass").forEach((btn) =>
    btn.addEventListener("click", () => setTimeout(updateBuddyCover, 0))
);

/* ============================================================
   بررسی دسترسی به ذخیره‌سازی
   ============================================================ */
(function storageGuard() {
    try {
        localStorage.setItem("__test__", "1");
        localStorage.removeItem("__test__");
        sessionStorage.setItem("__test__", "1");
        sessionStorage.removeItem("__test__");
    } catch (err) {
        showMessage("حالت ذخیره‌سازی در دسترس نیست! داده‌ها پس از بستن صفحه پاک می‌شوند.", "error-msg");
    }
})();

/* ============================================================
   بازیابی نشست
   ============================================================ */
window.addEventListener("DOMContentLoaded", async () => {
    const session = JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null");

    if (session?.email === "__ADMIN__") {
        enterAdminPanel();
    } else if (session?.email) {
        const user = DB.findByEmail(session.email);
        if (user) enterDashboard(user.name);
    }

    initNewsApp();
    initNewsModal();
});

/* ============================================================
   برنامه اخبار جهان 📰 (با ترجمه خودکار فارسی)
   منابع رایگان، بدون کلید API:
   • Hacker News API  → داغ‌ترین‌ها
   • DEV.to API       → فناوری
   • Reddit JSON      → جهان / علم / اقتصاد / ورزش
   ترجمه: سرویس رایگان translate.googleapis.com + کش در localStorage
   ============================================================ */
let currentCat = "top";
let currentList = [];

// هش سبک برای کلید کش
function hashStr(s) {
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
    return h.toString(36);
}

// یک متن را به فارسی ترجمه می‌کند (سرویس رایگان گوگل، بدون کلید)
async function translateOne(text) {
    const url =
        "https://translate.googleapis.com/translate_a/single" +
        `?client=gtx&sl=en&tl=fa&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return (data[0] || []).map((seg) => seg[0]).join("");
}

// ترجمه با کش در localStorage؛ در صورت خطا متن اصلی برگردانده می‌شود
async function cachedTranslate(text) {
    if (!text) return "";
    const key = hashStr(text);

    // اول در localStorage جستجو کن
    const cached = NewsCache.get(key);
    if (cached) return cached;

    const tr = await translateOne(text);
    NewsCache.set(key, tr);
    return tr;
}

// اجرای همزمان با محدودیت تعداد درخواست
async function mapLimit(arr, limit, fn) {
    const out = new Array(arr.length);
    let i = 0;
    async function worker() {
        while (i < arr.length) {
            const idx = i++;
            out[idx] = await fn(arr[idx], idx);
        }
    }
    await Promise.all(
        Array.from({ length: Math.min(limit, arr.length) }, () => worker())
    );
    return out;
}

// ترجمه عنوان + توضیح هر خبر
async function translateItems(list) {
    return mapLimit(list, 4, async (n) => {
        try {
            const [t, d] = await Promise.all([
                cachedTranslate(n.title),
                n.desc ? cachedTranslate(n.desc) : Promise.resolve(""),
            ]);
            return { ...n, titleFa: t || n.title, descFa: d };
        } catch {
            return { ...n, titleFa: n.title, descFa: n.desc || "" };
        }
    });
}

// --- زمان نسبی فارسی ---
function timeAgo(ts) {
    if (!ts) return "";
    const mins = Math.round((Date.now() - ts) / 60000);
    try {
        const rtf = new Intl.RelativeTimeFormat("fa", { numeric: "auto" });
        if (mins < 60) return rtf.format(-mins, "minute");
        const hours = Math.round(mins / 60);
        if (hours < 24) return rtf.format(-hours, "hour");
        return rtf.format(-Math.round(hours / 24), "day");
    } catch {
        return "";
    }
}

// --- جلوگیری از XSS ---
const ESCAPE_MAP = { "&": "#38;", "<": "#60;", ">": "#62;", '"': "#34;", "'": "#39;" };

function escapeHtml(s = "") {
    return String(s).replace(/[&<>"']/g, (ch) =>
        "&" + ESCAPE_MAP[ch] + ";"
    );
}
function escapeAttr(s = "") { return escapeHtml(s); }

// ---------- منابع اخبار ----------
async function fetchJson(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

// --- Hacker News ---
async function hnStories() {
    const ids = await fetchJson("https://hacker-news.firebaseio.com/v0/topstories.json");
    const picked = ids.slice(0, 15);
    const items = await Promise.all(
        picked.map((id) =>
            fetchJson(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).catch(() => null)
        )
    );
    return items.filter(Boolean).map((n) => ({
        title: n.title,
        url: n.url || `https://news.ycombinator.com/item?id=${n.id}`,
        source: "Hacker News",
        ts: (n.time || 0) * 1000,
        desc: n.text ? stripHtml(n.text).slice(0, 900) : "",
    }));
}

// --- DEV.to ---
async function devToArticles() {
    const arr = await fetchJson("https://dev.to/api/articles?per_page=15");
    return arr.map((a) => ({
        title: a.title,
        url: a.url,
        source: "DEV.to",
        ts: new Date(a.published_at).getTime(),
        desc: (a.description || "").trim(),
    }));
}

// --- Reddit ---
async function redditHot(sub) {
    const data = await fetchJson(
        `https://www.reddit.com/r/${sub}/hot.json?limit=15&raw_json=1`
    );
    return data.data.children
        .filter((c) => !c.data.stickied)
        .map((c) => ({
            title: c.data.title,
            url: "https://www.reddit.com" + c.data.permalink,
            source: `r/${sub}`,
            ts: c.data.created_utc * 1000,
            desc: (c.data.selftext || "").slice(0, 1200),
        }));
}

function stripHtml(html) {
    const div = document.createElement("div");
    div.innerHTML = html;
    return (div.textContent || "").replace(/\s+/g, " ").trim();
}

const CAT_LOADERS = {
    top: hnStories,
    tech: devToArticles,
    world: () => redditHot("worldnews"),
    science: () => redditHot("science"),
    business: () => redditHot("business"),
    sports: () => redditHot("sports"),
};

/* ---------- رندر اخبار ---------- */

function renderNews(list) {
    currentList = list;
    const box = $("#news-list");

    if (!list.length) {
        box.innerHTML =
            `<div class="news-empty">خبری یافت نشد 😕<br>فیلتر دیگری را امتحان کنید.</div>`;
        return;
    }

    box.innerHTML = list
        .map((n, i) => `
        <article class="news-card" data-i="${i}" style="animation-delay:${i * 45}ms">
            <div class="n-meta">
                <span class="n-source">${escapeHtml(n.source)}</span>
                ${n.ts ? `<span>${timeAgo(n.ts)}</span>` : ""}
            </div>
            <h3>${escapeHtml(n.titleFa || n.title)}</h3>
            ${(n.descFa || n.desc) ? `<p class="n-desc">${escapeHtml(n.descFa || n.desc)}</p>` : ""}
            <div class="n-foot">
                <span class="read-more">ادامه خبر ←</span>
                <a href="${escapeHtml(n.url)}" target="_blank" rel="noopener">منبع ↗</a>
            </div>
        </article>`)
        .join("");

    // کلیک روی کارت → نمایش کامل خبر
    $$(".news-card", box).forEach((card) =>
        card.addEventListener("click", () => openNewsModal(Number(card.dataset.i)))
    );
}

async function loadNews(cat) {
    currentCat = cat;
    $$(".filter-btn").forEach((b) =>
        b.classList.toggle("active", b.dataset.cat === cat)
    );

    const loader = $("#news-loader");
    const errBox = $("#news-error");
    errBox.classList.add("hidden");
    loader.classList.add("visible");
    $("#news-list").innerHTML = "";

    try {
        const raw = await CAT_LOADERS[cat]();
        // ترجمه فارسی قبل از نمایش
        const list = await translateItems(raw);
        loader.classList.remove("visible");
        renderNews(list);
    } catch (err) {
        console.error("خطا در دریافت اخبار:", err);
        loader.classList.remove("visible");
        errBox.classList.remove("hidden");
    }
}

function initNewsApp() {
    $$(".filter-btn").forEach((btn) =>
        btn.addEventListener("click", () => loadNews(btn.dataset.cat))
    );
    $("#retry-news").addEventListener("click", () => loadNews(currentCat));
}

/* ============================================================
   مودال نمایش کامل خبر 📖
   ============================================================ */
function openNewsModal(i) {
    const n = currentList[i];
    if (!n) return;

    $("#nm-title").textContent = n.titleFa || n.title;
    $("#nm-source").textContent = n.source;
    $("#nm-time").textContent = n.ts ? timeAgo(n.ts) : "";
    $("#nm-body").textContent =
        n.descFa || n.desc ||
        n.titleFa || n.title ||
        "برای مطالعه کامل به منبع اصلی مراجعه کنید.";
    $("#nm-link").href = n.url;

    $("#news-modal").classList.remove("hidden");
}

function initNewsModal() {
    $("#news-modal-close").addEventListener("click", () =>
        $("#news-modal").classList.add("hidden")
    );
}