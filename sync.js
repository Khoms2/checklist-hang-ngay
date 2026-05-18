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

// ===== EMAILJS CONFIG (for sending real OTP emails) =====
const EMAILJS_CONFIG = {
    publicKey: "YOUR_EMAILJS_PUBLIC_KEY",    // Replace with your EmailJS public key
    serviceId: "YOUR_EMAILJS_SERVICE_ID",    // Replace with your EmailJS service ID
    templateId: "YOUR_EMAILJS_TEMPLATE_ID"   // Replace with your EmailJS template ID
};

// Load saved EmailJS config from localStorage (user can configure once)
function getEmailJSConfig() {
    try {
        const saved = localStorage.getItem('_emailjs_config');
        if (saved) return JSON.parse(saved);
    } catch {}
    return EMAILJS_CONFIG;
}

function saveEmailJSConfig(cfg) {
    localStorage.setItem('_emailjs_config', JSON.stringify(cfg));
}

function isEmailJSConfigured() {
    const cfg = getEmailJSConfig();
    return cfg.publicKey && !cfg.publicKey.startsWith('YOUR_');
}

// Initialize EmailJS
function initEmailJS() {
    const cfg = getEmailJSConfig();
    if (isEmailJSConfigured()) {
        try { emailjs.init({ publicKey: cfg.publicKey }); } catch(e) { console.warn('EmailJS init error:', e); }
    }
}

// Send OTP via real email using EmailJS
async function sendOTPEmail(toEmail, otpCode) {
    const cfg = getEmailJSConfig();
    if (!isEmailJSConfigured()) {
        console.warn('[OTP] EmailJS not configured - OTP shown in toast only');
        return false;
    }
    try {
        await emailjs.send(cfg.serviceId, cfg.templateId, {
            to_email: toEmail,
            otp_code: otpCode,
            app_name: 'Daily Checklist',
            expire_time: '5 phút'
        });
        return true;
    } catch (e) {
        console.error('[OTP] Email send failed:', e);
        return false;
    }
}

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
            // Handle redirect result first (for mobile Google login)
            this.auth.getRedirectResult().then(result => {
                if (result && result.user) {
                    console.log('[Firebase] Redirect login success:', result.user.email);
                }
            }).catch(e => {
                if (e.code !== 'auth/no-auth-event') console.warn('[Firebase] Redirect result error:', e.message);
            });
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
        provider.setCustomParameters({ prompt: 'select_account' });
        // Use popup for all devices. The click handler in app.js is now synchronous 
        // which prevents iOS Safari from blocking the popup.
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

    // === PASSWORD RESET ===
    async resetPassword(email) {
        return this.auth.sendPasswordResetEmail(email);
    },

    // === CHANGE PASSWORD (requires re-auth) ===
    async changePassword(currentPassword, newPassword) {
        const user = this.auth.currentUser;
        if (!user || !user.email) throw new Error('Không tìm thấy user');
        const cred = firebase.auth.EmailAuthProvider.credential(user.email, currentPassword);
        await user.reauthenticateWithCredential(cred);
        return user.updatePassword(newPassword);
    },

    // === EMAIL VERIFICATION ===
    async sendVerification() {
        const user = this.auth.currentUser;
        if (user) return user.sendEmailVerification();
    },

    // === OTP MANAGEMENT ===
    generateOTP() {
        return String(Math.floor(10000 + Math.random() * 90000)); // 5-digit
    },

    async saveOTP(email, otp) {
        if (!this.db) return;
        const key = btoa(email).replace(/[.#$/\[\]]/g, '_');
        return this.db.ref(`otp_verification/${key}`).set({
            code: otp,
            email: email,
            createdAt: Date.now(),
            expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
            verified: false
        });
    },

    async verifyOTP(email, code) {
        if (!this.db) return false;
        const key = btoa(email).replace(/[.#$/\[\]]/g, '_');
        const snap = await this.db.ref(`otp_verification/${key}`).once('value');
        const data = snap.val();
        if (!data) return { success: false, error: 'Không tìm thấy mã OTP' };
        if (Date.now() > data.expiresAt) return { success: false, error: 'Mã OTP đã hết hạn' };
        if (data.code !== code) return { success: false, error: 'Mã OTP không đúng' };
        // Mark as verified
        await this.db.ref(`otp_verification/${key}/verified`).set(true);
        return { success: true };
    },

    async deleteOTP(email) {
        if (!this.db) return;
        const key = btoa(email).replace(/[.#$/\[\]]/g, '_');
        return this.db.ref(`otp_verification/${key}`).remove();
    },

    // === DATABASE ===
    _p(path) { return `users/${this.user.uid}/${path}`; },

    async updatePublicProfile(data) {
        if (!this.db || !this.user) return;
        return this.db.ref(`public_profiles/${this.user.uid}`).update({
            ...data,
            lastSeen: Date.now(),
            name: this.user.displayName || this.user.email.split('@')[0],
            avatar: this.user.photoURL || `https://ui-avatars.com/api/?name=${this.user.email}&background=random`
        });
    },

    // === FRIENDS SYSTEM (v4.0) ===
    async generateFriendCode() {
        console.log('Generating friend code for:', this.user?.uid);
        if (!this.db || !this.user) {
            console.error('Firebase not initialized or user not logged in');
            return;
        }
        try {
            // Check if already has a code
            const snap = await this.db.ref(`public_profiles/${this.user.uid}/friendCode`).once('value');
            if (snap.val()) {
                console.log('Existing friend code found:', snap.val());
                return snap.val();
            }

            // Generate unique 6-char code
            const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; 
            let code = '';
            for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
            
            console.log('Generated new code:', code);
            // Save mapping
            await this.db.ref(`friend_codes/${code}`).set(this.user.uid);
            await this.db.ref(`public_profiles/${this.user.uid}/friendCode`).set(code);
            console.log('Saved friend code successfully');
            return code;
        } catch (e) {
            console.error('Error in generateFriendCode:', e);
            return null;
        }
    },

    async getUidFromFriendCode(code) {
        if (!this.db) return null;
        const snap = await this.db.ref(`friend_codes/${code.toUpperCase()}`).once('value');
        return snap.val();
    },

    async sendFriendRequest(targetUid) {
        if (!this.db || !this.user || targetUid === this.user.uid) return;
        const request = {
            fromUid: this.user.uid,
            name: this.user.displayName || this.user.email.split('@')[0],
            avatar: this.user.photoURL || `https://ui-avatars.com/api/?name=${this.user.email}&background=random`,
            status: 'pending',
            timestamp: Date.now()
        };
        return this.db.ref(`friend_requests/${targetUid}/${this.user.uid}`).set(request);
    },

    async respondToFriendRequest(fromUid, accept) {
        if (!this.db || !this.user) return;
        const status = accept ? 'accepted' : 'rejected';
        
        if (accept) {
            // Add to both friends lists
            const now = Date.now();
            await this.db.ref(`friends/${this.user.uid}/${fromUid}`).set({ addedAt: now });
            await this.db.ref(`friends/${fromUid}/${this.user.uid}`).set({ addedAt: now });
        }
        
        // Remove the request
        return this.db.ref(`friend_requests/${this.user.uid}/${fromUid}`).remove();
    },

    async unfriend(friendUid) {
        if (!this.db || !this.user) return;
        try {
            await this.db.ref(`friends/${this.user.uid}/${friendUid}`).remove();
            await this.db.ref(`friends/${friendUid}/${this.user.uid}`).remove();
            this.toast('Đã hủy kết bạn thành công ✓');
        } catch (e) {
            console.error('Lỗi khi hủy kết bạn:', e);
            this.toast('Có lỗi xảy ra khi hủy kết bạn!');
        }
    },

    listenToFriends(callback) {
        if (!this.db || !this.user) return;
        const ref = this.db.ref(`friends/${this.user.uid}`);
        ref.on('value', snap => callback(snap.val()));
        this._listeners.push(ref);
    },

    listenToFriendRequests(callback) {
        if (!this.db || !this.user) return;
        const ref = this.db.ref(`friend_requests/${this.user.uid}`);
        ref.on('value', snap => callback(snap.val()));
        this._listeners.push(ref);
    },

    async addReaction(targetUid, date, emoji) {
        if (!this.db || !this.user) return;
        return this.db.ref(`reactions/${targetUid}/${date}/${this.user.uid}`).set({
            emoji: emoji,
            name: this.user.displayName || this.user.email.split('@')[0],
            timestamp: Date.now()
        });
    },

    listenToReactions(targetUid, date, callback) {
        if (!this.db) return;
        const ref = this.db.ref(`reactions/${targetUid}/${date}`);
        ref.on('value', snap => callback(snap.val()));
        this._listeners.push(ref);
    },

    async getPublicProfile(uid) {
        if (!this.db) return null;
        const snap = await this.db.ref(`public_profiles/${uid}`).once('value');
        return snap.val();
    },

    async logActivity(text) {
        if (!this.db || !this.user) return;
        const activity = {
            uid: this.user.uid,
            name: this.user.displayName || this.user.email.split('@')[0],
            text: text,
            time: Date.now()
        };
        // Keep only last 20 activities
        const ref = this.db.ref('global_activities');
        const newRef = ref.push();
        await newRef.set(activity);
        
        // Cleanup old activities
        ref.once('value', snap => {
            if (snap.numChildren() > 20) {
                let count = 0;
                snap.forEach(child => {
                    if (count < snap.numChildren() - 20) child.ref.remove();
                    count++;
                });
            }
        });
    },

    setupPresence() {
        if (!this.db || !this.user) return;
        const onlineRef = this.db.ref(`presence/${this.user.uid}`);
        const connectedRef = this.db.ref('.info/connected');
        connectedRef.on('value', snap => {
            if (snap.val() === true) {
                onlineRef.onDisconnect().remove();
                onlineRef.set(true);
            }
        });
    },

    save(path, data) {
        if (!this.db || !this.user || window._isRemoteUpdate) return;
        this.db.ref(this._p(path)).set(data).catch(e => console.error('DB save:', e));
        
        // Sync specific data to public profile
        if (path === 'totalXP' || path === 'bestStreak' || path === 'totalCompletedDays') {
            this.updatePublicProfile({ [path]: data });
        }
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
    
    listenToUid(uid, callback) {
        if (!this.db || !uid) return;
        this._listeners.forEach(r => r.off());
        this._listeners = [];
        const ref = this.db.ref(`users/${uid}`);
        ref.on('value', snap => {
            callback(snap.val());
        });
        this._listeners.push(ref);
    },

    async uploadAll(data) {
        if (!this.db || !this.user) return;
        return this.db.ref(`users/${this.user.uid}`).set(data);
    },

    toast(msg, dur = 3500, type = null) {
        // Handle object parameter calling for Sonner API compatibility
        if (typeof msg === 'object' && msg !== null) {
            type = msg.type || type;
            dur = msg.dur || dur;
            msg = msg.message || '';
        }

        // Auto-detect variant type based on message content
        if (!type) {
            const m = msg.toLowerCase();
            if (m.includes('lỗi') || m.includes('không tìm thấy') || m.includes('không thể') || m.includes('thất bại') || m.includes('bị hủy')) {
                type = 'error';
            } else if (m.includes('cảnh báo') || m.includes('vui lòng') || m.includes('đang') || m.includes('chờ') || m.includes('yêu cầu')) {
                type = 'warning';
            } else if (m.includes('chào mừng') || m.includes('thành công') || m.includes('✓') || m.includes('đã') || m.includes('hoàn thành')) {
                type = 'success';
            } else {
                type = 'info';
            }
        }

        // Initialize Toast Container
        let container = document.getElementById('toastContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toastContainer';
            document.body.appendChild(container);
        }

        // Prevent Duplicate Toasts (Spam prevention)
        const activeToasts = container.querySelectorAll('.app-toast-card');
        if (activeToasts.length > 0) {
            const lastMessage = activeToasts[activeToasts.length - 1].querySelector('.app-toast-message')?.textContent;
            if (lastMessage === msg) return;
        }

        // Create Card Element
        const card = document.createElement('div');
        card.className = `app-toast-card ${type}`;
        
        // Define premium variants SVGs
        let iconSvg = '';
        if (type === 'success') {
            iconSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
        } else if (type === 'error') {
            iconSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
        } else if (type === 'warning') {
            iconSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
        } else {
            iconSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
        }

        card.innerHTML = `
            <div class="app-toast-icon">${iconSvg}</div>
            <div class="app-toast-message">${msg}</div>
            <button class="app-toast-close">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px;"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            <div class="app-toast-progress"></div>
        `;

        container.appendChild(card);

        // Timer & Hover Pause Controller
        let timeLeft = dur;
        let lastUpdate = Date.now();
        let isPaused = false;
        let animFrameId = null;

        const progressBar = card.querySelector('.app-toast-progress');

        const updateTimer = () => {
            if (!isPaused) {
                const now = Date.now();
                timeLeft -= (now - lastUpdate);
                lastUpdate = now;

                const percent = Math.max(0, (timeLeft / dur) * 100);
                if (progressBar) {
                    progressBar.style.transform = `scaleX(${percent / 100})`;
                }

                if (timeLeft <= 0) {
                    closeToast();
                    return;
                }
            } else {
                lastUpdate = Date.now();
            }
            animFrameId = requestAnimationFrame(updateTimer);
        };

        const closeToast = () => {
            if (animFrameId) cancelAnimationFrame(animFrameId);
            card.classList.add('hide');
            setTimeout(() => {
                card.remove();
                if (container.querySelectorAll('.app-toast-card').length === 0) {
                    container.remove();
                }
            }, 250);
        };

        // Hover pause logic
        card.addEventListener('mouseenter', () => { isPaused = true; });
        card.addEventListener('mouseleave', () => { isPaused = false; lastUpdate = Date.now(); });

        // Close manual click
        card.querySelector('.app-toast-close')?.addEventListener('click', (e) => {
            e.stopPropagation();
            closeToast();
        });

        // Initialize progress and start countdown
        lastUpdate = Date.now();
        animFrameId = requestAnimationFrame(updateTimer);
    },

    onAuthChanged: null
};

// Auto-init Firebase as soon as script loads
(function autoInitFirebase() {
    try {
        if (!firebase.apps || !firebase.apps.length) {
            firebase.initializeApp(FIREBASE_CONFIG);
        }
        FirebaseApp.auth = firebase.auth();
        FirebaseApp.db = firebase.database();
        console.log('[Firebase] Auto-initialized ✓');
    } catch(e) {
        console.warn('[Firebase] Auto-init failed, will retry on demand:', e.message);
    }
})();

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
