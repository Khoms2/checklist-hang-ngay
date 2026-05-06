// ===== FIREBASE APP — Auth + Database =====
const FIREBASE_CONFIG = {
    apiKey: "AIzaSyB21mJJTQ1XWjhgocXNyKH1YbQAFhT-ee8",
    authDomain: "checklist-vdt-2026.firebaseapp.com",
    databaseURL: "https://checklist-vdt-2026-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "checklist-vdt-2026",
    storageBucket: "checklist-vdt-2026.firebasestorage.app",
    messagingSenderId: "1058298483551",
    appId: "1:1058298483551:web:0b170343a7892e304e1cea"
};

const FirebaseApp = {
    db: null, auth: null, user: null, _listeners: [],

    getConfig() { return FIREBASE_CONFIG; },
    saveConfig(c) { /* config is hardcoded */ },
    hasConfig() { return true; },

    init() {
        const cfg = this.getConfig();
        if (!cfg) return false;
        try {
            if (!firebase.apps?.length) firebase.initializeApp(cfg);
            this.auth = firebase.auth();
            this.db = firebase.database();
            this.auth.onAuthStateChanged(u => {
                this.user = u;
                if (this.onAuthChanged) this.onAuthChanged(u);
            });
            return true;
        } catch (e) { console.error('Firebase init:', e); return false; }
    },

    // === AUTH ===
    async loginGoogle() {
        const provider = new firebase.auth.GoogleAuthProvider();
        return this.auth.signInWithPopup(provider);
    },
    async loginEmail(e, p) { return this.auth.signInWithEmailAndPassword(e, p); },
    async registerEmail(e, p) {
        const cred = await this.auth.createUserWithEmailAndPassword(e, p);
        return cred;
    },
    async logout() {
        this._listeners.forEach(r => r.off());
        this._listeners = [];
        return this.auth.signOut();
    },

    // === DATABASE ===
    _p(path) { return `users/${this.user.uid}/${path}`; },

    save(path, data) {
        if (!this.db || !this.user || window._isRemoteUpdate) return;
        this.db.ref(this._p(path)).set(data).catch(e => console.error('DB save:', e));
    },

    async loadAll() {
        if (!this.db || !this.user) return null;
        const snap = await this.db.ref(`users/${this.user.uid}`).once('value');
        return snap.val();
    },

    listenAll(callback) {
        if (!this.db || !this.user) return;
        this._listeners.forEach(r => r.off());
        this._listeners = [];
        const ref = this.db.ref(`users/${this.user.uid}`);
        ref.on('value', snap => {
            if (!window._isRemoteUpdate) callback(snap.val());
        });
        this._listeners.push(ref);
    },

    async uploadAll(data) {
        if (!this.db || !this.user) return;
        return this.db.ref(`users/${this.user.uid}`).set(data);
    },

    toast(msg) {
        let t = document.getElementById('syncToast');
        if (!t) { t = document.createElement('div'); t.id = 'syncToast'; t.className = 'sync-toast'; document.body.appendChild(t); }
        t.textContent = msg; t.classList.add('show');
        setTimeout(() => t.classList.remove('show'), 2500);
    },

    onAuthChanged: null
};

// ===== URL EXPORT / IMPORT =====
function exportToURL() {
    const data = { c: {}, n: {}, t: {}, m: {} };
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('_')) continue;
        try {
            const v = JSON.parse(localStorage.getItem(key));
            if (key.startsWith('checklist_')) data.c[key.slice(10)] = v;
            else if (key.startsWith('notes_')) data.n[key.slice(6)] = v;
            else if (key.startsWith('custom_')) data.t[key.slice(7)] = v;
            else if (['bestStreak','totalCompletedDays'].includes(key)) data.m[key] = v;
        } catch {}
    }
    return window.location.origin + window.location.pathname + '#data=' + btoa(unescape(encodeURIComponent(JSON.stringify(data))));
}

function importFromURL(hash) {
    try {
        const data = JSON.parse(decodeURIComponent(escape(atob(hash.replace('#data=', '')))));
        if (data.c) Object.entries(data.c).forEach(([k, v]) => localStorage.setItem(`checklist_${k}`, JSON.stringify(v)));
        if (data.n) Object.entries(data.n).forEach(([k, v]) => localStorage.setItem(`notes_${k}`, JSON.stringify(v)));
        if (data.t) Object.entries(data.t).forEach(([k, v]) => localStorage.setItem(`custom_${k}`, JSON.stringify(v)));
        if (data.m) Object.entries(data.m).forEach(([k, v]) => localStorage.setItem(k, JSON.stringify(v)));
        return true;
    } catch (e) { return false; }
}
