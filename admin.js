(function() {
  'use strict';

  // ═══ CONSTANTS & DEFAULTS ═══
  const STORAGE_KEYS = {
    CREDS: 'ka_admin_credentials',
    CLIENT_REVIEWS: 'ka_admin_reviews_client',
    STUDENT_REVIEWS: 'ka_admin_reviews_student',
    WORKS: 'ka_admin_works',
    PROVIDED: 'ka_admin_provided_services',
    MAP_COUNTRIES: 'ka_admin_map_countries',
    GLOBAL_STATS: 'ka_admin_global_stats',
    ANALYTICS: 'ka_admin_analytics',
    SETTINGS: 'ka_admin_settings',
    INTRO_PAGES: 'ka_admin_intro_pages',
    TRAINING_DATA: 'ka_admin_training_data',
    ABOUT_DATA: 'ka_admin_about_data',
    HOME_PHOTO: 'ka_admin_home_photo',
    PROVIDED_THIRD_LINE: 'ka_admin_provided_third_line',
    PROVIDED_ROW3: 'ka_admin_provided_services_row3',
    PROVIDED_DIVIDER1_EN: 'ka_admin_provided_divider1_en',
    PROVIDED_DIVIDER1_AR: 'ka_admin_provided_divider1_ar',
    PROVIDED_DIVIDER2_EN: 'ka_admin_provided_divider2_en',
    PROVIDED_DIVIDER2_AR: 'ka_admin_provided_divider2_ar',
    HOME_INTRO_TEXT: 'ka_admin_home_intro_text',
    HOME_SERVICES: 'ka_admin_home_services'
  };

  const DEFAULT_CREDS = {
    username: 'kareem',
    // SHA-256 hash of '123456'
    passwordHash: '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92' 
  };

  const DEFAULT_ANALYTICS = {
    viewers: [
      { id: 1, date: '2026-07-10', count: 25 },
      { id: 2, date: '2026-07-11', count: 32 },
      { id: 3, date: '2026-07-12', count: 18 },
      { id: 4, date: '2026-07-13', count: 41 },
      { id: 5, date: '2026-07-14', count: 22 }
    ],
    clicks: [
      { id: 1, date: '2026-07-10', count: 12 },
      { id: 2, date: '2026-07-11', count: 15 },
      { id: 3, date: '2026-07-12', count: 9 },
      { id: 4, date: '2026-07-13', count: 20 },
      { id: 5, date: '2026-07-14', count: 11 }
    ],
    contacts: [
      { id: 1, date: '2026-07-10', channel: 'WhatsApp', count: 3 },
      { id: 2, date: '2026-07-11', channel: 'Email', count: 2 },
      { id: 3, date: '2026-07-12', channel: 'Calendly', count: 1 },
      { id: 4, date: '2026-07-13', channel: 'WhatsApp', count: 5 },
      { id: 5, date: '2026-07-14', channel: 'Email', count: 3 }
    ],
    activity: [
      { text: 'Added work "dms,mdk" to editing', time: '2026-07-14T04:45:46.000Z' },
      { text: 'Added work "sc" to editing', time: '2026-07-14T04:45:06.000Z' },
      { text: 'Added image to Provided Services: motion', time: '2026-07-14T04:31:54.000Z' },
      { text: 'Added image to Provided Services: motion', time: '2026-07-14T04:31:49.000Z' }
    ]
  };

  const WORK_TAGS = {
    editing: ["Brand Film", "Music Video", "Corporate", "Cinematic"],
    cinematography: ["Commercial", "Documentary", "Event", "Lifestyle"],
    social: ["Reel", "TikTok", "Short", "Story Pack"],
    documentary: ["Documentary", "Brand Film", "Profile", "Series"],
    mentorship: ["Course", "Workshop", "1:1", "Online"],
    motion: ["Logo Reveal", "Title Sequence", "Lower Thirds", "Explainer"]
  };

  // State
  let currentFeedbackTab = 'client';
  let currentWorksCategory = 'editing';
  let currentProvidedCategory = 'editing';
  let currentAnalyticsTab = 'viewers';

  // ═══ HELPER FUNCTIONS ═══
  async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function getEl(id) {
    return document.getElementById(id);
  }

  function safeJSONParse(str, defaultVal) {
    try {
      return str ? JSON.parse(str) : defaultVal;
    } catch(e) {
      return defaultVal;
    }
  }

  function esc(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ═══ TOAST & DIALOG ═══
  function showToast(message, type = 'success') {
    let container = document.querySelector('.admin-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'admin-toast-container';
      document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.className = `admin-toast ${type}`;
    
    let icon = '';
    if (type === 'success') icon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><polyline points="20 6 9 17 4 12"/></svg>';
    else if (type === 'error') icon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';
    
    toast.innerHTML = `${icon} <span>${message}</span>`;
    container.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  function compressImage(file, maxWidth, quality) {
    maxWidth = maxWidth || 1200;
    quality = quality || 0.7;
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let w = img.width, h = img.height;
          if (w > maxWidth) { h = Math.round(h * maxWidth / w); w = maxWidth; }
          canvas.width = w;
          canvas.height = h;
          canvas.getContext('2d').drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  async function uploadImageToStorage(dataUrl, folderName = 'images') {
    if (!window.kaStorage) {
      throw new Error('Firebase Storage is not initialized.');
    }
    const fileName = `${folderName}/IMG_${Date.now()}_${Math.floor(Math.random() * 1000)}.jpg`;
    const storageRef = window.kaStorage.ref(fileName);
    
    // Upload the dataURL string
    const snapshot = await storageRef.putString(dataUrl, 'data_url');
    const downloadURL = await snapshot.ref.getDownloadURL();
    return downloadURL;
  }

  function showConfirm(title, message) {
    return new Promise(resolve => {
      const dialog = getEl('adminConfirmDialog');
      if (!dialog) return resolve(true);
      
      getEl('confirmTitle').innerText = title;
      getEl('confirmText').innerText = message;
      dialog.classList.add('active');
      
      const onConfirm = () => { cleanup(); resolve(true); };
      const onCancel = () => { cleanup(); resolve(false); };
      
      const btnConfirm = getEl('confirmOk');
      const btnCancel = getEl('confirmCancel');
      
      btnConfirm.onclick = onConfirm;
      btnCancel.onclick = onCancel;
      
      function cleanup() {
        dialog.classList.remove('active');
        btnConfirm.onclick = null;
        btnCancel.onclick = null;
      }
    });
  }

  function logActivity(message) {
    const analytics = loadAnalytics();
    if (!analytics.activity) analytics.activity = [];
    analytics.activity.unshift({ text: message, time: new Date().toISOString() });
    if (analytics.activity.length > 20) analytics.activity.pop();
    saveAnalytics(analytics);
  }

  // ═══ AUTH MODULE ═══
  async function initAuth() {
    // Always reset credentials to defaults to ensure password consistency across all devices
    localStorage.setItem(STORAGE_KEYS.CREDS, JSON.stringify(DEFAULT_CREDS));
    // Automatically clear any lockouts
    sessionStorage.removeItem('ka_admin_lock');
    sessionStorage.removeItem('ka_admin_fails');
  }

  async function login(username, password) {
    const credsStr = localStorage.getItem(STORAGE_KEYS.CREDS);
    const creds = credsStr ? JSON.parse(credsStr) : DEFAULT_CREDS;
    
    // Check lock
    const lockTime = sessionStorage.getItem('ka_admin_lock');
    if (lockTime && Date.now() < parseInt(lockTime)) {
      const minLeft = Math.ceil((parseInt(lockTime) - Date.now()) / 60000);
      throw new Error(`Locked. Try again in ${minLeft} minutes.`);
    }

    const hashedInput = await hashPassword(password);
    
    if (username === creds.username && hashedInput === creds.passwordHash) {
      sessionStorage.setItem('ka_admin_session', Date.now().toString());
      sessionStorage.removeItem('ka_admin_fails');
      sessionStorage.removeItem('ka_admin_lock');
      return true;
    } else {
      let fails = parseInt(sessionStorage.getItem('ka_admin_fails') || '0') + 1;
      sessionStorage.setItem('ka_admin_fails', fails.toString());
      if (fails >= 5) {
        sessionStorage.setItem('ka_admin_lock', (Date.now() + 5 * 60000).toString());
        throw new Error('Too many failed attempts. Locked for 5 minutes.');
      }
      throw new Error('Invalid username or password.');
    }
  }

  function isAuthenticated() {
    const session = sessionStorage.getItem('ka_admin_session');
    if (!session) return false;
    const sessionTime = parseInt(session);
    // Expire after 24 hours
    if (Date.now() - sessionTime > 24 * 60 * 60 * 1000) {
      logout();
      return false;
    }
    return true;
  }

  function logout() {
    sessionStorage.removeItem('ka_admin_session');
    document.body.classList.remove('admin-mode');
    document.documentElement.classList.remove('admin-mode');
    if(window.spaGo) window.spaGo('admin-login', true);
    else window.location.hash = 'admin-login';
  }

  function loadData() {
    // Override global arrays with saved admin data if available
    const savedClients = localStorage.getItem(STORAGE_KEYS.CLIENT_REVIEWS);
    if (savedClients) {
      try {
        const parsed = JSON.parse(savedClients);
        if (Array.isArray(parsed) && parsed.length > 0) window.clientReviews = parsed;
      } catch(e) {}
    }
    if (typeof window.initTestimonials === 'function' && window.clientReviews) {
      window.initTestimonials();
    }
    
    const savedStudents = localStorage.getItem(STORAGE_KEYS.STUDENT_REVIEWS);
    if (savedStudents) {
      try {
        const parsed = JSON.parse(savedStudents);
        if (Array.isArray(parsed) && parsed.length > 0) window.studentReviews = parsed;
      } catch(e) {}
    }
    if (typeof window.initStudentReviews === 'function' && window.studentReviews) {
      window.initStudentReviews();
    }
    
    const savedWorks = localStorage.getItem(STORAGE_KEYS.WORKS);
    if (savedWorks && window.serviceWorks) {
      try {
        const parsed = JSON.parse(savedWorks);
        if (parsed && typeof parsed === 'object') {
          Object.keys(window.serviceWorks).forEach(key => {
            if (parsed[key]) {
              parsed[key].title = parsed[key].title || window.serviceWorks[key].title;
              parsed[key].title_ar = parsed[key].title_ar || window.serviceWorks[key].title_ar;
              if (Array.isArray(parsed[key].works)) {
                parsed[key].works.forEach((w, idx) => {
                  const defW = (window.serviceWorks[key].works && window.serviceWorks[key].works[idx]) || {};
                  w.cat = w.cat || defW.cat;
                  w.cat_ar = w.cat_ar || defW.cat_ar;
                  w.name = w.name || defW.name;
                  w.name_ar = w.name_ar || defW.name_ar;
                  w.desc = w.desc || defW.desc;
                  w.desc_ar = w.desc_ar || defW.desc_ar;
                });
              }
            } else {
              parsed[key] = window.serviceWorks[key];
            }
          });
          window.serviceWorks = parsed;
        }
      } catch(e) {}
    }

    const savedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (savedSettings && window.QB_CONFIG) {
       const settings = JSON.parse(savedSettings);
       if(settings.whatsapp) window.QB_CONFIG.whatsappNumber = settings.whatsapp;
       if(settings.email) window.QB_CONFIG.email = settings.email;
       if(settings.calendly) window.QB_CONFIG.calendlyUrl = settings.calendly;
       
       // Update social links in DOM
       const updateSocial = (id, label) => {
         if (settings[id]) {
           const links = document.querySelectorAll(`a[aria-label="${label}"]`);
           links.forEach(l => l.href = settings[id]);
         }
       };
       updateSocial('instagram', 'Instagram');
       updateSocial('linkedin', 'LinkedIn');
       updateSocial('youtube', 'YouTube');
       updateSocial('facebook', 'Facebook');
       updateSocial('tiktok', 'TikTok');
    }
  }

  // Apply home page edits from localStorage on page load
  function applyHomePageData() {
    const introData = safeJSONParse(localStorage.getItem(STORAGE_KEYS.HOME_INTRO_TEXT), null);
    if (introData) {
      const el = document.querySelector('.hero-tagline');
      if (el) {
        el.setAttribute('data-en', introData.en);
        el.setAttribute('data-ar', introData.ar);
        const isArabic = document.documentElement.getAttribute('dir') === 'rtl';
        el.innerHTML = isArabic ? introData.ar : introData.en;
      }
    }
    const svcData = safeJSONParse(localStorage.getItem(STORAGE_KEYS.HOME_SERVICES), null);
    if (svcData) {
      const grid = document.querySelector('.home-svc-grid');
      if (grid) {
        const iconsFn = function(icon) {
          const icons = {
            video: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>',
            camera: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>',
            document: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
            music: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>',
            motion: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
            social: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>',
            photo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
            design: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>'
          };
          return icons[icon] || icons.video;
        };
        const isArabic = document.documentElement.getAttribute('dir') === 'rtl';
        grid.innerHTML = svcData.map(function(s) {
          var te = s.titleEn || ''; var ta = s.titleAr || '';
          var de = s.descEn || ''; var da = s.descAr || '';
          return '<div class="home-svc-card reveal" onclick="spaGo(\'services\');">' +
            '<div class="home-svc-icon">' + iconsFn(s.icon) + '</div>' +
            '<div class="home-svc-title" data-en="' + te.replace(/"/g, '&quot;') + '" data-ar="' + ta.replace(/"/g, '&quot;') + '">' + (isArabic ? ta : te) + '</div>' +
            '<div class="home-svc-desc" data-en="' + de.replace(/"/g, '&quot;') + '" data-ar="' + da.replace(/"/g, '&quot;') + '">' + (isArabic ? da : de) + '</div>' +
          '</div>';
        }).join('');
      }
    }
  }

  function saveClientReviews(reviews) {
    localStorage.setItem(STORAGE_KEYS.CLIENT_REVIEWS, JSON.stringify(reviews));
    window.clientReviews = reviews;
    // Re-render testimonials marquee if function exists
    if(typeof window.initTestimonials === 'function') window.initTestimonials();
  }

  function saveStudentReviews(reviews) {
    localStorage.setItem(STORAGE_KEYS.STUDENT_REVIEWS, JSON.stringify(reviews));
    window.studentReviews = reviews;
    // Re-render student reviews if function exists
    if(typeof window.initStudentReviews === 'function') window.initStudentReviews();
  }

  function saveWorks(works) {
    localStorage.setItem(STORAGE_KEYS.WORKS, JSON.stringify(works));
    window.serviceWorks = works;
  }

  function loadAnalytics() {
    const data = safeJSONParse(localStorage.getItem(STORAGE_KEYS.ANALYTICS), null);
    if (!data) return JSON.parse(JSON.stringify(DEFAULT_ANALYTICS));
    return {
      viewers: (data.viewers && data.viewers.length > 0) ? data.viewers : DEFAULT_ANALYTICS.viewers,
      clicks: (data.clicks && data.clicks.length > 0) ? data.clicks : DEFAULT_ANALYTICS.clicks,
      contacts: (data.contacts && data.contacts.length > 0) ? data.contacts : DEFAULT_ANALYTICS.contacts,
      activity: (data.activity && data.activity.length > 0) ? data.activity : DEFAULT_ANALYTICS.activity
    };
  }

  function saveAnalytics(data) {
    localStorage.setItem(STORAGE_KEYS.ANALYTICS, JSON.stringify(data));
  }
  
  function getSettings() {
     return safeJSONParse(localStorage.getItem(STORAGE_KEYS.SETTINGS), {});
  }
  function saveSettings(settings) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    loadData(); // apply to DOM
  }

  function loadIntroPages() {
    return safeJSONParse(localStorage.getItem(STORAGE_KEYS.INTRO_PAGES), window.INTRO_PAGES || []);
  }

  function saveIntroPages(pages) {
    localStorage.setItem(STORAGE_KEYS.INTRO_PAGES, JSON.stringify(pages));
    window.INTRO_PAGES = pages;
    if(typeof window.renderFrontendIntroPages === 'function') window.renderFrontendIntroPages();
  }

  function loadTrainingData() {
    let saved = safeJSONParse(localStorage.getItem(STORAGE_KEYS.TRAINING_DATA), null);
    
    // Auto-fix corrupted empty state from previous bug
    if (saved && !saved.eyebrowEn && window.TRAINING_DATA && window.TRAINING_DATA.eyebrowEn) {
      saved = null; // Force reload from defaults
      localStorage.removeItem(STORAGE_KEYS.TRAINING_DATA);
    }
    
    if (!saved) saved = JSON.parse(JSON.stringify(window.TRAINING_DATA || {}));
    
    // Ensure arrays and objects exist
    saved.bullets = saved.bullets || (window.TRAINING_DATA ? window.TRAINING_DATA.bullets : []);
    saved.stats = saved.stats || (window.TRAINING_DATA ? window.TRAINING_DATA.stats : []);
    saved.videos = saved.videos || (window.TRAINING_DATA ? window.TRAINING_DATA.videos : []);
    
    const defaultWhoIs = (window.TRAINING_DATA && window.TRAINING_DATA.whoIsMentor)
      ? JSON.parse(JSON.stringify(window.TRAINING_DATA.whoIsMentor))
      : {
          eyebrowEn: 'WHO IS',
          eyebrowAr: 'من هو',
          titleEn: 'YOUR<br><span>MENTOR?</span>',
          titleAr: 'مدربـك؟<br><span>كريم عبد العزيز</span>',
          photos: ['Final-HomePhoto.webp', 'correct-photo.jpeg'],
          paragraphs: [
            {
              textEn: "Karim Abdelaziz is one of the most recognized film directors and video editors in the Middle East. With over <strong>8 years</strong> of professional experience, he has been responsible for crafting cinematic content, developing brands, and positioning companies as leaders in their industry through powerful visual storytelling.",
              textAr: "كريم عبد العزيز هو أحد أبرز مخرجي الأفلام ومونتيري الفيديو في الشرق الأوسط. بخبرة مهنية تتجاوز <strong>٨ سنوات</strong>، كان مسؤولاً عن صناعة محتوى سينمائي، تطوير العلامات التجارية، وتمكين الشركات من الريادة في مجالها من خلال السرد البصري القوي."
            },
            {
              textEn: "In total, Karim has delivered more than <strong>1,300 projects</strong>, worked across <strong>14 countries</strong>, and collaborated with brands like <strong>Samsung, CUPRA, 9GAG, Artlist, and Asus</strong> — and now he's ready to bring that same cinematic excellence to <strong>your brand</strong>.",
              textAr: "في المجمل، نفذ كريم أكثر من <strong>١,٣٠٠ مشروع</strong>، وعمل في <strong>١٤ دولة</strong>، وتعاون مع علامات تجارية مثل <strong>Samsung و CUPRA و 9GAG و Artlist و Asus</strong> — وهو الآن مستعد لنقل هذا التميز السينمائي إلى <strong>علامتك التجارية</strong>."
            }
          ]
        };

    if (!saved.whoIsMentor) {
      saved.whoIsMentor = defaultWhoIs;
    }
    if (!saved.whoIsMentor.photos || !Array.isArray(saved.whoIsMentor.photos) || saved.whoIsMentor.photos.length === 0) {
      saved.whoIsMentor.photos = defaultWhoIs.photos;
    }
    if (!saved.whoIsMentor.paragraphs || !Array.isArray(saved.whoIsMentor.paragraphs) || saved.whoIsMentor.paragraphs.length === 0) {
      saved.whoIsMentor.paragraphs = defaultWhoIs.paragraphs;
    }

    return saved;
  }

  function saveTrainingData(data) {
    localStorage.setItem(STORAGE_KEYS.TRAINING_DATA, JSON.stringify(data));
    window.TRAINING_DATA = data;
    // Save to Firebase Realtime Database for LIVE GLOBAL SYNC
    if (window.kaDatabase) {
      window.kaDatabase.ref('data/' + STORAGE_KEYS.TRAINING_DATA).set(JSON.stringify(data)).catch(function(e) {
        console.error('Firebase save error (training data):', e);
      });
    }
    if(typeof window.renderFrontendTrainingPage === 'function') window.renderFrontendTrainingPage();
  }

  function loadAboutData() {
    const saved = safeJSONParse(localStorage.getItem(STORAGE_KEYS.ABOUT_DATA), null);
    if (!saved) return JSON.parse(JSON.stringify(window.ABOUT_DATA || { chapters: [], process: [] }));
    saved.chapters = saved.chapters || (window.ABOUT_DATA ? window.ABOUT_DATA.chapters : []);
    saved.process = saved.process || (window.ABOUT_DATA ? window.ABOUT_DATA.process : []);
    return saved;
  }

  function saveAboutData(data) {
    localStorage.setItem(STORAGE_KEYS.ABOUT_DATA, JSON.stringify(data));
  }

  // --- Home Page Data ---
  const DEFAULT_HOME_INTRO = {
    en: 'I edit branded videos that turn <em>viewers into customers.</em> Cinematic craft for brands that need their content to <em>perform</em> — not just look pretty.',
    ar: 'بعمل فيديوهات براند بتحوّل <em>المشاهدين لعملاء.</em> حرفة سينمائية للبراندات اللي محتاجة محتواها <em>يحقق نتائج</em> — مش بس يبقى جميل.'
  };

  const DEFAULT_HOME_SERVICES = [
    { icon: 'video', titleEn: 'Video Editing', titleAr: 'مونتاج الفيديو', descEn: 'Cinematic cuts that turn footage into stories.', descAr: 'مونتاج سينمائي بيحوّل الفيديو لقصص.' },
    { icon: 'camera', titleEn: 'Cinematography', titleAr: 'التصوير السينمائي', descEn: 'Directing and shooting with a cinematic eye.', descAr: 'إخراج وتصوير بعين سينمائية.' },
    { icon: 'document', titleEn: 'Brand & Documentary', titleAr: 'براند ووثائقي', descEn: 'Long-form storytelling with real emotion.', descAr: 'سرد طويل بإحساس حقيقي.' }
  ];

  function loadHomeIntroText() {
    return safeJSONParse(localStorage.getItem(STORAGE_KEYS.HOME_INTRO_TEXT), JSON.parse(JSON.stringify(DEFAULT_HOME_INTRO)));
  }

  function saveHomeIntroText(data) {
    localStorage.setItem(STORAGE_KEYS.HOME_INTRO_TEXT, JSON.stringify(data));
    applyHomeIntroToFrontend(data);
    // Save to Firebase for global sync
    if (window.kaDatabase) {
      window.kaDatabase.ref('data/' + STORAGE_KEYS.HOME_INTRO_TEXT).set(JSON.stringify(data)).catch(function(e) {
        console.error('Firebase save error (intro):', e);
      });
    }
  }

  function loadHomeServices() {
    return safeJSONParse(localStorage.getItem(STORAGE_KEYS.HOME_SERVICES), JSON.parse(JSON.stringify(DEFAULT_HOME_SERVICES)));
  }

  function saveHomeServices(data) {
    localStorage.setItem(STORAGE_KEYS.HOME_SERVICES, JSON.stringify(data));
    applyHomeServicesToFrontend(data);
    // Save to Firebase for global sync
    if (window.kaDatabase) {
      window.kaDatabase.ref('data/' + STORAGE_KEYS.HOME_SERVICES).set(JSON.stringify(data)).catch(function(e) {
        console.error('Firebase save error (services):', e);
      });
    }
  }

  // --- Apply to Frontend ---
  function applyHomeIntroToFrontend(data) {
    const el = document.querySelector('.hero-tagline');
    if (el && data) {
      el.setAttribute('data-en', data.en);
      el.setAttribute('data-ar', data.ar);
      // Apply based on current language
      const isArabic = document.documentElement.getAttribute('dir') === 'rtl';
      el.innerHTML = isArabic ? data.ar : data.en;
    }
  }

  function getHomeSvcSvg(icon) {
    const icons = {
      video: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>',
      camera: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>',
      document: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
      music: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>',
      motion: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
      social: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>',
      photo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
      design: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>'
    };
    return icons[icon] || icons.video;
  }

  function applyHomeServicesToFrontend(services) {
    const grid = document.querySelector('.home-svc-grid');
    if (!grid || !services) return;
    grid.innerHTML = services.map(s => `
      <div class="home-svc-card reveal" onclick="spaGo('services');">
        <div class="home-svc-icon">${getHomeSvcSvg(s.icon)}</div>
        <div class="home-svc-title" data-en="${esc(s.titleEn)}" data-ar="${esc(s.titleAr)}">${esc(document.documentElement.getAttribute('dir') === 'rtl' ? s.titleAr : s.titleEn)}</div>
        <div class="home-svc-desc" data-en="${esc(s.descEn)}" data-ar="${esc(s.descAr)}">${esc(document.documentElement.getAttribute('dir') === 'rtl' ? s.descAr : s.descEn)}</div>
      </div>
    `).join('');
  }

  // Expose frontend render function globally so script.js can call it
  window.renderFrontendHomePage = function() {
    applyHomeIntroToFrontend(loadHomeIntroText());
    applyHomeServicesToFrontend(loadHomeServices());
  };

  function exportAllData() {
    const data = {
      clientReviews: window.clientReviews,
      studentReviews: window.studentReviews,
      works: window.serviceWorks,
      analytics: loadAnalytics(),
      settings: getSettings()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ka-admin-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importData(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (data.clientReviews) saveClientReviews(data.clientReviews);
      if (data.studentReviews) saveStudentReviews(data.studentReviews);
      if (data.works) saveWorks(data.works);
      if (data.analytics) saveAnalytics(data.analytics);
      if (data.settings) saveSettings(data.settings);
      showToast('Data imported successfully');
      renderOverview();
      return true;
    } catch(e) {
      showToast('Invalid JSON file', 'error');
      return false;
    }
  }

  // ═══ ROUTER MODULE ═══
  function adminNavigate(page) {
    document.querySelectorAll('.admin-page').forEach(p => p.classList.remove('active'));
    const target = document.querySelector(`.admin-page[data-admin-content="${page}"]`);
    if(target) target.classList.add('active');

    document.querySelectorAll('.admin-nav a').forEach(a => {
      a.classList.toggle('active', a.getAttribute('data-admin-page') === page);
    });

    const titleEl = getEl('adminPageTitle');
    if (titleEl) {
      const pageTitles = {
        overview: 'Overview',
        feedback: 'Feedback',
        works: 'Works',
        provided: 'Provided Services',
        map: 'Map & Stats',
        analytics: 'Analytics',
        settings: 'Settings',
        'intro-pages': 'Intro Pages',
        'training-pages': 'Training Pages',
        'home-page-edit': 'Home Page'
      };
      titleEl.innerText = pageTitles[page] || page.charAt(0).toUpperCase() + page.slice(1);
    }

    if (window.innerWidth <= 1024) {
      const sidebar = getEl('adminSidebar');
      if(sidebar) sidebar.classList.remove('open');
    }

    // Render corresponding page
    if (page === 'overview') renderOverview();
    else if (page === 'intro-pages') renderIntroPagesList();
    else if (page === 'feedback') renderFeedbackPage();
    else if (page === 'works') renderWorksPage();
    else if (page === 'provided') renderProvidedPage();
    else if (page === 'map') renderMapPage();
    else if (page === 'analytics') renderAnalyticsPage();
    else if (page === 'settings') renderSettingsPage();
    else if (page === 'training-pages') renderTrainingPageAdmin();
    else if (page === 'about') renderAboutPage();
    else if (page === 'home-page-edit') renderHomePageEditAdmin();
  }

  // ═══ CONTROLLERS ═══

  // --- Home Page Edit Admin ---
  function renderHomePageEditAdmin() {
    // Load intro text
    const intro = loadHomeIntroText();
    const enEditor = getEl('adminHomeIntroTextEn');
    const arEditor = getEl('adminHomeIntroTextAr');
    if (enEditor) enEditor.innerHTML = intro.en || '';
    if (arEditor) arEditor.innerHTML = intro.ar || '';

    // Render services list
    renderHomeServicesList();
  }

  function renderHomeServicesList() {
    const list = getEl('adminHomeSvcList');
    if (!list) return;
    const services = loadHomeServices();
    if (!services || services.length === 0) {
      list.innerHTML = '<p class="admin-empty-state">No service cards. Click "Add Card" to create one.</p>';
      return;
    }
    list.innerHTML = services.map((s, i) => `
      <div class="admin-activity-item">
        <div style="display:flex;align-items:center;gap:12px;">
          <div class="admin-svc-icon-preview">${getHomeSvcSvg(s.icon)}</div>
          <div>
            <strong>${esc(s.titleEn)}</strong><br>
            <span style="font-size:12px;color:var(--muted);">${esc(s.descEn)}</span>
          </div>
        </div>
        <div style="display:flex;gap:8px;">
          <button class="admin-edit-btn" onclick="adminApp.editHomeSvc(${i})">Edit</button>
          <button class="admin-delete-btn" onclick="adminApp.deleteHomeSvc(${i})">Delete</button>
        </div>
      </div>
    `).join('');
  }

  function openHomeSvcModal(index) {
    const modal = getEl('adminHomeSvcModal');
    if (!modal) return;
    const services = loadHomeServices();

    getEl('adminHomeSvcEditIndex').value = index;
    getEl('adminHomeSvcModalTitle').innerText = index >= 0 ? 'Edit Service Card' : 'Add Service Card';

    if (index >= 0 && services[index]) {
      const s = services[index];
      getEl('adminHomeSvcIcon').value = s.icon || 'video';
      getEl('adminHomeSvcTitleEn').value = s.titleEn || '';
      getEl('adminHomeSvcTitleAr').value = s.titleAr || '';
      getEl('adminHomeSvcDescEn').value = s.descEn || '';
      getEl('adminHomeSvcDescAr').value = s.descAr || '';
    } else {
      getEl('adminHomeSvcIcon').value = 'video';
      ['adminHomeSvcTitleEn', 'adminHomeSvcTitleAr', 'adminHomeSvcDescEn', 'adminHomeSvcDescAr'].forEach(id => getEl(id).value = '');
    }
    modal.classList.add('active');
  }

  function wrapSelectionBold(editorId) {
    const editor = getEl(editorId);
    if (!editor) return;
    const sel = window.getSelection();
    if (!sel.rangeCount || sel.isCollapsed) {
      showToast('Please select some text first', 'error');
      return;
    }
    const range = sel.getRangeAt(0);
    if (!editor.contains(range.commonAncestorContainer)) {
      showToast('Please select text inside the box', 'error');
      return;
    }

    // Extract contents and wrap in <em>
    const em = document.createElement('em');
    em.appendChild(range.extractContents());
    range.insertNode(em);

    // Clean up empty nodes
    editor.normalize();
  }

  function unwrapSelectionBold(editorId) {
    const editor = getEl(editorId);
    if (!editor) return;
    const sel = window.getSelection();
    if (!sel.rangeCount) return;
    const range = sel.getRangeAt(0);
    if (!editor.contains(range.commonAncestorContainer)) return;

    // Remove any em/b/strong tags in or wrapping selection
    let node = sel.anchorNode;
    while (node && node !== editor) {
      if (node.nodeName === 'EM' || node.nodeName === 'B' || node.nodeName === 'STRONG') {
        const parent = node.parentNode;
        while (node.firstChild) parent.insertBefore(node.firstChild, node);
        parent.removeChild(node);
        break;
      }
      node = node.parentNode;
    }
    editor.normalize();
  }

  // --- About Page Admin ---
  let currentAboutTab = 'chapters';

  function renderAboutPage() {
    getEl('adminPageTitle').innerText = 'About Page';
    document.querySelectorAll('[data-about-tab]').forEach(b => b.classList.remove('active'));
    const activeTabBtn = document.querySelector(`[data-about-tab="${currentAboutTab}"]`);
    if(activeTabBtn) activeTabBtn.classList.add('active');
    
    if (currentAboutTab === 'chapters') {
      getEl('adminAboutChaptersPanel').style.display = 'block';
      getEl('adminAboutProcessPanel').style.display = 'none';
      renderAboutChapters();
    } else {
      getEl('adminAboutChaptersPanel').style.display = 'none';
      getEl('adminAboutProcessPanel').style.display = 'block';
      renderAboutProcess();
    }
  }

  function renderAboutChapters() {
    const list = getEl('adminAboutChaptersList');
    if (!list) return;
    const d = loadAboutData();
    if (!d.chapters || d.chapters.length === 0) {
      list.innerHTML = '<p class="admin-empty-state">No chapters found</p>';
      return;
    }
    list.innerHTML = d.chapters.map((c, i) => `
      <div class="admin-activity-item">
        <div>
          <strong>${esc((c.titleEn || '').replace(/<[^>]*>?/gm, ' '))}</strong><br>
          <span style="font-size:12px;color:var(--muted);">${esc((c.eyebrowEn || '').replace(/<[^>]*>?/gm, ' '))} - ${c.visualType}</span>
        </div>
        <div style="display:flex;gap:8px;">
          <button class="admin-edit-btn" onclick="adminApp.editAboutChapter(${i})">Edit</button>
          <button class="admin-delete-btn" onclick="adminApp.deleteAboutChapter(${i})">Delete</button>
        </div>
      </div>
    `).join('');
  }

  function renderAboutProcess() {
    const list = getEl('adminAboutProcessList');
    if (!list) return;
    const d = loadAboutData();
    if (!d.process || d.process.length === 0) {
      list.innerHTML = '<p class="admin-empty-state">No process steps found</p>';
      return;
    }
    list.innerHTML = d.process.map((p, i) => `
      <div class="admin-activity-item">
        <div>
          <strong>${esc((p.titleEn || '').replace(/<[^>]*>?/gm, ' '))}</strong><br>
          <span style="font-size:12px;color:var(--muted);">Icon: Style ${p.icon}</span>
        </div>
        <div style="display:flex;gap:8px;">
          <button class="admin-edit-btn" onclick="adminApp.editAboutProcess(${i})">Edit</button>
          <button class="admin-delete-btn" onclick="adminApp.deleteAboutProcess(${i})">Delete</button>
        </div>
      </div>
    `).join('');
  }

  // Hook up tabs
  document.querySelectorAll('[data-about-tab]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      currentAboutTab = e.target.getAttribute('data-about-tab');
      renderAboutPage();
    });
  });

  // Open modals
  function openAboutChapterModal(index = -1) {
    const modal = getEl('adminAboutChapterModal');
    if(!modal) return;
    const d = loadAboutData();
    
    getEl('aboutChapterEditIndex').value = index;
    getEl('aboutChapterModalTitle').innerText = index >= 0 ? 'Edit Chapter' : 'Add Chapter';
    
    if (index >= 0 && d.chapters[index]) {
      const c = d.chapters[index];
      getEl('acEyebrowEn').value = c.eyebrowEn || '';
      getEl('acEyebrowAr').value = c.eyebrowAr || '';
      getEl('acTitleEn').value = c.titleEn || '';
      getEl('acTitleAr').value = c.titleAr || '';
      getEl('acTextEn').value = c.textEn || '';
      getEl('acTextAr').value = c.textAr || '';
      getEl('acYearEn').value = c.yearEn || '';
      getEl('acYearAr').value = c.yearAr || '';
      getEl('acVisualType').value = c.visualType || 'photo1';
    } else {
      ['acEyebrowEn','acEyebrowAr','acTitleEn','acTitleAr','acTextEn','acTextAr','acYearEn','acYearAr'].forEach(id => getEl(id).value = '');
      getEl('acVisualType').value = 'photo1';
    }
    modal.classList.add('active');
  }

  function openAboutProcessModal(index = -1) {
    const modal = getEl('adminAboutProcessModal');
    if(!modal) return;
    const d = loadAboutData();
    
    getEl('aboutProcessEditIndex').value = index;
    getEl('aboutProcessModalTitle').innerText = index >= 0 ? 'Edit Process Step' : 'Add Process Step';
    
    if (index >= 0 && d.process[index]) {
      const p = d.process[index];
      getEl('apTitleEn').value = p.titleEn || '';
      getEl('apTitleAr').value = p.titleAr || '';
      getEl('apDescEn').value = p.descEn || '';
      getEl('apDescAr').value = p.descAr || '';
      getEl('apIcon').value = p.icon || '1';
    } else {
      ['apTitleEn','apTitleAr','apDescEn','apDescAr'].forEach(id => getEl(id).value = '');
      getEl('apIcon').value = '1';
    }
    modal.classList.add('active');
  }

  // Add new
  getEl('adminAddAboutItem')?.addEventListener('click', () => {
    if (currentAboutTab === 'chapters') openAboutChapterModal(-1);
    else openAboutProcessModal(-1);
  });

  // Save actions
  getEl('adminSaveAboutChapter')?.addEventListener('click', () => {
    const index = parseInt(getEl('aboutChapterEditIndex').value);
    const d = loadAboutData();
    
    const c = {
      eyebrowEn: getEl('acEyebrowEn').value,
      eyebrowAr: getEl('acEyebrowAr').value,
      titleEn: getEl('acTitleEn').value,
      titleAr: getEl('acTitleAr').value,
      textEn: getEl('acTextEn').value,
      textAr: getEl('acTextAr').value,
      yearEn: getEl('acYearEn').value,
      yearAr: getEl('acYearAr').value,
      visualType: getEl('acVisualType').value,
      stats: index >= 0 && d.chapters[index] ? d.chapters[index].stats : null
    };
    
    if (index >= 0) d.chapters[index] = c;
    else d.chapters.push(c);
    
    saveAboutData(d);
    renderAboutChapters();
    getEl('adminAboutChapterModal').classList.remove('active');
    showToast(index >= 0 ? 'Chapter updated' : 'Chapter added');
    if(typeof window.renderFrontendAboutPage === 'function') window.renderFrontendAboutPage();
  });

  getEl('adminSaveAboutProcess')?.addEventListener('click', () => {
    const index = parseInt(getEl('aboutProcessEditIndex').value);
    const d = loadAboutData();
    
    const p = {
      titleEn: getEl('apTitleEn').value,
      titleAr: getEl('apTitleAr').value,
      descEn: getEl('apDescEn').value,
      descAr: getEl('apDescAr').value,
      icon: parseInt(getEl('apIcon').value) || 1
    };
    
    if (index >= 0) d.process[index] = p;
    else d.process.push(p);
    
    saveAboutData(d);
    renderAboutProcess();
    getEl('adminAboutProcessModal').classList.remove('active');
    showToast(index >= 0 ? 'Process step updated' : 'Process step added');
    if(typeof window.renderFrontendAboutPage === 'function') window.renderFrontendAboutPage();
  });

  window.adminApp = window.adminApp || {};
  window.adminApp.editAboutChapter = openAboutChapterModal;
  window.adminApp.editAboutProcess = openAboutProcessModal;
  
  window.adminApp.deleteAboutChapter = async function(index) {
    const ok = await showConfirm('Delete Chapter', 'Are you sure you want to delete this chapter?');
    if(!ok) return;
    const d = loadAboutData();
    d.chapters.splice(index, 1);
    saveAboutData(d);
    renderAboutChapters();
    showToast('Chapter deleted');
    if(typeof window.renderFrontendAboutPage === 'function') window.renderFrontendAboutPage();
  };

  window.adminApp.deleteAboutProcess = async function(index) {
    const ok = await showConfirm('Delete Step', 'Are you sure you want to delete this process step?');
    if(!ok) return;
    const d = loadAboutData();
    d.process.splice(index, 1);
    saveAboutData(d);
    renderAboutProcess();
    showToast('Step deleted');
    if(typeof window.renderFrontendAboutPage === 'function') window.renderFrontendAboutPage();
  };

  // --- Overview ---
  function animateCount(el, target, duration = 800) {
    if (!el) return;
    const start = parseInt(el.innerText) || 0;
    if (start === target) return;
    const startTime = performance.now();
    function easeOutQuart(t) { return 1 - Math.pow(1 - t, 4); }
    function update(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutQuart(progress);
      const current = Math.round(start + (target - start) * easedProgress);
      el.innerText = current;
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }

  function renderOverview() {
    // Total Reviews (client + student)
    const totalReviews = (window.clientReviews?.length || 0) + (window.studentReviews?.length || 0);
    animateCount(getEl('statReviews'), totalReviews);
    
    // Total Works (all categories)
    let totalWorks = 0;
    if(window.serviceWorks) {
      for(let key in window.serviceWorks) {
        totalWorks += (window.serviceWorks[key].works?.length || 0);
      }
    }
    animateCount(getEl('statWorks'), totalWorks);

    // Analytics-based stats
    const analytics = loadAnalytics();
    
    // Total Contacts
    let totalContacts = 0;
    (analytics.contacts || []).forEach(c => totalContacts += parseInt(c.count||0));
    animateCount(getEl('statContacts'), totalContacts);
    
    // Total Site Views
    let totalViews = 0;
    (analytics.viewers || []).forEach(v => totalViews += parseInt(v.count||0));
    animateCount(getEl('statViews'), totalViews);

    const activityList = getEl('adminActivityList');
    if (activityList) {
      if (analytics.activity && analytics.activity.length > 0) {
        activityList.innerHTML = analytics.activity.slice(0,5).map(a => `
          <div class="admin-activity-item">
            <span class="activity-text">${a.text}</span>
            <span class="activity-time">${new Date(a.time).toLocaleString()}</span>
          </div>
        `).join('');
      } else {
         activityList.innerHTML = '<p class="admin-empty-state">No recent activity</p>';
      }
    }
  }

  // --- Feedback ---
  function renderFeedbackPage() {
    renderReviews(currentFeedbackTab);
  }

  function switchFeedbackTab(tab) {
    currentFeedbackTab = tab;
    document.querySelectorAll('.admin-tab[data-feedback-tab]').forEach(t => {
      t.classList.toggle('active', t.getAttribute('data-feedback-tab') === tab);
    });
    getEl('adminClientReviews').style.display = tab === 'client' ? 'grid' : 'none';
    getEl('adminStudentReviews').style.display = tab === 'student' ? 'grid' : 'none';
    renderReviews(tab);
  }

  function getInitials(name) {
    return name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();
  }

  function renderReviews(type) {
    const listId = type === 'client' ? 'adminClientReviews' : 'adminStudentReviews';
    const container = getEl(listId);
    if(!container) return;
    
    const reviews = type === 'client' ? window.clientReviews : window.studentReviews;
    if (!reviews || reviews.length === 0) {
       container.innerHTML = '<p class="admin-empty-state">No reviews found.</p>';
       return;
    }

    container.innerHTML = reviews.map((r, index) => `
      <div class="admin-review-card">
        <div class="admin-review-header">
          <div class="admin-review-initials">${r.initials || getInitials(r.name)}</div>
          <div class="admin-review-info">
            <div class="admin-review-name">${r.name}</div>
            <div class="admin-review-role">${r.role}</div>
          </div>
        </div>
        <div class="admin-review-stars">${'★'.repeat(r.stars)}</div>
        <div class="admin-review-text">${r.text.length > 100 ? r.text.substring(0,100)+'...' : r.text}</div>
        <div class="admin-review-actions">
          <button class="admin-edit-btn" onclick="window.adminApp.editReview('${type}', ${index})">Edit</button>
          <button class="admin-delete-btn" onclick="window.adminApp.deleteReview('${type}', ${index})">Delete</button>
        </div>
      </div>
    `).join('');
  }

  function openReviewModal(type, index = -1) {
    const modal = getEl('adminReviewModal');
    if(!modal) return;
    
    getEl('reviewEditType').value = type;
    getEl('reviewEditIndex').value = index;
    
    const titleEl = getEl('reviewModalTitle');
    titleEl.innerText = index === -1 ? `Add ${type === 'client' ? 'Client' : 'Student'} Review` : 'Edit Review';
    
    if (index > -1) {
       const reviews = type === 'client' ? window.clientReviews : window.studentReviews;
       const r = reviews[index];
       getEl('reviewName').value = r.name || '';
       getEl('reviewNameAr').value = r.name_ar || '';
       getEl('reviewRole').value = r.role || '';
       getEl('reviewRoleAr').value = r.role_ar || '';
       getEl('reviewStars').value = r.stars || '5';
       getEl('reviewText').value = r.text || '';
       getEl('reviewTextAr').value = r.text_ar || '';
    } else {
       getEl('reviewName').value = '';
       getEl('reviewNameAr').value = '';
       getEl('reviewRole').value = '';
       getEl('reviewRoleAr').value = '';
       getEl('reviewStars').value = '5';
       getEl('reviewText').value = '';
       getEl('reviewTextAr').value = '';
    }
    
    modal.classList.add('active');
  }

  function saveReview() {
    const type = getEl('reviewEditType').value;
    const index = parseInt(getEl('reviewEditIndex').value);
    
    const name = getEl('reviewName').value.trim();
    if(!name) {
       showToast('Name is required', 'error');
       return;
    }
    
    const reviewData = {
      name: name,
      name_ar: getEl('reviewNameAr').value.trim(),
      role: getEl('reviewRole').value.trim(),
      role_ar: getEl('reviewRoleAr').value.trim(),
      stars: parseInt(getEl('reviewStars').value),
      initials: getInitials(name),
      text: getEl('reviewText').value.trim(),
      text_ar: getEl('reviewTextAr').value.trim()
    };
    
    let reviews = type === 'client' ? (window.clientReviews || []) : (window.studentReviews || []);
    
    if (index > -1) {
       reviews[index] = reviewData;
       logActivity(`Edited review for ${name}`);
    } else {
       reviews.unshift(reviewData);
       logActivity(`Added review for ${name}`);
    }
    
    if (type === 'client') saveClientReviews(reviews);
    else saveStudentReviews(reviews);
    
    renderReviews(type);
    getEl('adminReviewModal').classList.remove('active');
    showToast(`Review ${index > -1 ? 'updated' : 'added'} successfully`);
  }

  function renderIntroPagesList() {
    const container = getEl('adminIntroList');
    if(!container) return;
    
    const pages = loadIntroPages();
    if (!pages || pages.length === 0) {
       container.innerHTML = '<p class="admin-empty-state">No intro pages found.</p>';
       return;
    }

    container.innerHTML = pages.map((p, index) => `
      <div class="admin-review-card" style="display:flex; flex-direction:column; gap:10px;">
        <div class="admin-review-header">
          <div class="admin-review-initials" style="width:40px;height:40px;border-radius:20px;background:#3e3e3e;display:flex;align-items:center;justify-content:center;color:#fff;">${index}</div>
          <div class="admin-review-info">
            <div class="admin-review-name">${p.labelEn}</div>
            <div class="admin-review-role">Type: ${p.type}</div>
          </div>
        </div>
        <div class="admin-review-actions">
          <button class="admin-edit-btn" onclick="window.adminApp.editIntro(${index})">Edit</button>
        </div>
      </div>
    `).join('');
  }

  function openIntroModal(index) {
    const modal = getEl('adminIntroModal');
    if(!modal) return;
    
    const pages = loadIntroPages();
    const p = pages[index];
    if(!p) return;

    getEl('adminIntroId').value = index;
    getEl('adminIntroLabelEn').value = p.labelEn || '';
    getEl('adminIntroLabelAr').value = p.labelAr || '';
    
    if (getEl('adminIntroNumber')) getEl('adminIntroNumber').value = p.number || '';
    if (getEl('adminIntroSuffixEn')) getEl('adminIntroSuffixEn').value = p.suffixEn || '';
    if (getEl('adminIntroSuffixAr')) getEl('adminIntroSuffixAr').value = p.suffixAr || '';
    if (getEl('adminIntroPhraseEn')) getEl('adminIntroPhraseEn').value = p.phraseEn || '';
    if (getEl('adminIntroPhraseAr')) getEl('adminIntroPhraseAr').value = p.phraseAr || '';
    if (getEl('adminIntroSubEn')) getEl('adminIntroSubEn').value = p.subEn || '';
    if (getEl('adminIntroSubAr')) getEl('adminIntroSubAr').value = p.subAr || '';
    
    const ctaGroup = getEl('adminIntroCtaGroup');
    if (p.type === 'final') {
       if(ctaGroup) ctaGroup.style.display = 'block';
       if(getEl('adminIntroCtaEn')) getEl('adminIntroCtaEn').value = p.ctaEn || '';
       if(getEl('adminIntroCtaAr')) getEl('adminIntroCtaAr').value = p.ctaAr || '';
    } else {
       if(ctaGroup) ctaGroup.style.display = 'none';
    }

    modal.classList.add('active');
  }

  function saveIntro() {
    const index = parseInt(getEl('adminIntroId').value);
    const pages = loadIntroPages();
    const p = pages[index];
    if(!p) return;

    p.labelEn = getEl('adminIntroLabelEn').value;
    p.labelAr = getEl('adminIntroLabelAr').value;
    
    if (getEl('adminIntroNumber') && getEl('adminIntroNumber').value !== '') {
       p.number = parseInt(getEl('adminIntroNumber').value);
    }
    
    if (getEl('adminIntroSuffixEn')) p.suffixEn = getEl('adminIntroSuffixEn').value;
    if (getEl('adminIntroSuffixAr')) p.suffixAr = getEl('adminIntroSuffixAr').value;
    
    if (getEl('adminIntroPhraseEn')) p.phraseEn = getEl('adminIntroPhraseEn').value;
    if (getEl('adminIntroPhraseAr')) p.phraseAr = getEl('adminIntroPhraseAr').value;
    
    if (getEl('adminIntroSubEn')) p.subEn = getEl('adminIntroSubEn').value;
    if (getEl('adminIntroSubAr')) p.subAr = getEl('adminIntroSubAr').value;
    
    if (p.type === 'final') {
       if (getEl('adminIntroCtaEn')) p.ctaEn = getEl('adminIntroCtaEn').value;
       if (getEl('adminIntroCtaAr')) p.ctaAr = getEl('adminIntroCtaAr').value;
    }
    
    saveIntroPages(pages);
    renderIntroPagesList();
    getEl('adminIntroModal').classList.remove('active');
    showToast('Chapter updated successfully');
  }

  // ═══════ TRAINING PAGES UI ═══════

  function renderTrainingPageAdmin() {
    const d = loadTrainingData();
    if (!d || !d.bullets) return;

    if(getEl('adminTrainingEyebrowEn')) getEl('adminTrainingEyebrowEn').value = d.eyebrowEn || '';
    if(getEl('adminTrainingEyebrowAr')) getEl('adminTrainingEyebrowAr').value = d.eyebrowAr || '';
    if(getEl('adminTrainingHeadingEn')) getEl('adminTrainingHeadingEn').value = d.headingEn || '';
    if(getEl('adminTrainingHeadingAr')) getEl('adminTrainingHeadingAr').value = d.headingAr || '';
    if(getEl('adminTrainingCardTitleEn')) getEl('adminTrainingCardTitleEn').value = d.cardTitleEn || '';
    if(getEl('adminTrainingCardTitleAr')) getEl('adminTrainingCardTitleAr').value = d.cardTitleAr || '';
    if(getEl('adminTrainingPara1En')) getEl('adminTrainingPara1En').value = d.para1En || '';
    if(getEl('adminTrainingPara1Ar')) getEl('adminTrainingPara1Ar').value = d.para1Ar || '';
    if(getEl('adminTrainingPara2En')) getEl('adminTrainingPara2En').value = d.para2En || '';
    if(getEl('adminTrainingPara2Ar')) getEl('adminTrainingPara2Ar').value = d.para2Ar || '';
    if(getEl('adminTrainingVideoHeadingEn')) getEl('adminTrainingVideoHeadingEn').value = d.videoHeadingEn || '';
    if(getEl('adminTrainingVideoHeadingAr')) getEl('adminTrainingVideoHeadingAr').value = d.videoHeadingAr || '';
    if(getEl('adminTrainingVideoSubEn')) getEl('adminTrainingVideoSubEn').value = d.videoSubEn || '';
    if(getEl('adminTrainingVideoSubAr')) getEl('adminTrainingVideoSubAr').value = d.videoSubAr || '';

    renderTrainingBullets();
    renderTrainingStats();
    renderTrainingVideos();
    renderAdminMentorPhotos();
    renderAdminMentorParagraphs();
  }

  function renderAdminMentorPhotos() {
    const d = loadTrainingData();
    const list = getEl('adminMentorPhotosList');
    if(!list) return;
    const photos = (d.whoIsMentor && d.whoIsMentor.photos) ? d.whoIsMentor.photos : [];
    if (photos.length === 0) {
      list.innerHTML = `<div style="color:var(--admin-text-muted); font-size:13px; padding:12px; background:rgba(255,255,255,0.02); border-radius:8px;">No photos added yet. Add a photo file or URL above.</div>`;
      return;
    }
    list.innerHTML = photos.map((p, i) => `
      <div class="mentor-photo-admin-card" style="display:flex; align-items:center; gap:12px; background:rgba(255,255,255,0.04); padding:10px; border-radius:10px; border:1px solid var(--admin-border-light); margin-bottom:8px;">
        <img src="${p}" style="width:60px; height:75px; object-fit:cover; border-radius:8px; background:#000;" alt="Mentor Photo ${i+1}">
        <div style="flex:1; min-width:0;">
          <div style="font-size:13px; font-weight:600; color:var(--admin-text);">Photo #${i+1}</div>
          <div style="font-size:11px; color:var(--admin-text-muted); text-overflow:ellipsis; overflow:hidden; white-space:nowrap; max-width:240px;">${p}</div>
        </div>
        <div style="display:flex; align-items:center; gap:6px;">
          ${i > 0 ? `<button type="button" class="admin-btn-secondary" style="padding:4px 8px; font-size:12px;" onclick="window.adminApp.moveMentorPhoto(${i}, -1)">▲</button>` : ''}
          ${i < photos.length - 1 ? `<button type="button" class="admin-btn-secondary" style="padding:4px 8px; font-size:12px;" onclick="window.adminApp.moveMentorPhoto(${i}, 1)">▼</button>` : ''}
          <button type="button" class="admin-btn-secondary" style="color:#ff4444; border-color:#ff4444; padding:4px 10px; font-size:12px;" onclick="window.adminApp.deleteMentorPhoto(${i})">Delete</button>
        </div>
      </div>
    `).join('');
  }

  function renderAdminMentorParagraphs() {
    const d = loadTrainingData();
    const list = getEl('adminMentorParasList');
    if(!list) return;
    const paras = (d.whoIsMentor && d.whoIsMentor.paragraphs) ? d.whoIsMentor.paragraphs : [];
    if (paras.length === 0) {
      list.innerHTML = `<div style="color:var(--admin-text-muted); font-size:13px; padding:12px; background:rgba(255,255,255,0.02); border-radius:8px;">No paragraphs added yet. Click "Add Paragraph" above to create one.</div>`;
      return;
    }
    list.innerHTML = paras.map((p, i) => `
      <div class="admin-list-item" style="flex-direction:column; align-items:stretch; gap:10px; margin-bottom:10px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <strong style="font-size:14px; color:var(--admin-accent);">Paragraph #${i+1}</strong>
          <div style="display:flex; align-items:center; gap:6px;">
            ${i > 0 ? `<button type="button" class="admin-btn-secondary" style="padding:4px 8px; font-size:12px;" onclick="window.adminApp.moveMentorPara(${i}, -1)">▲</button>` : ''}
            ${i < paras.length - 1 ? `<button type="button" class="admin-btn-secondary" style="padding:4px 8px; font-size:12px;" onclick="window.adminApp.moveMentorPara(${i}, 1)">▼</button>` : ''}
            <button type="button" class="admin-edit-btn" style="padding:4px 10px; font-size:12px;" onclick="window.adminApp.openMentorParaModal(${i})">Edit</button>
            <button type="button" class="admin-btn-secondary" style="color:#ff4444; border-color:#ff4444; padding:4px 10px; font-size:12px;" onclick="window.adminApp.deleteMentorPara(${i})">Delete</button>
          </div>
        </div>
        <div style="font-size:13px; line-height:1.5; color:var(--admin-text); background:rgba(0,0,0,0.2); padding:10px; border-radius:6px;">
          <div style="margin-bottom:4px;"><strong>EN:</strong> ${p.textEn}</div>
          <div dir="rtl" style="color:var(--admin-text-muted);"><strong>AR:</strong> ${p.textAr}</div>
        </div>
      </div>
    `).join('');
  }

  function renderTrainingBullets() {
    const d = loadTrainingData();
    const list = getEl('adminTrainingBulletsList');
    if(!list) return;
    list.innerHTML = (d.bullets || []).map((b, i) => `
      <div class="admin-list-item">
        <div style="flex:1; min-width:0; padding-right:16px;">
          <div style="margin-bottom:6px; font-size:15px; overflow:hidden; text-overflow:ellipsis;"><strong>EN:</strong> ${b.en}</div>
          <div dir="rtl" style="font-size:15px; color:var(--admin-text-muted); overflow:hidden; text-overflow:ellipsis;"><strong>AR:</strong> ${b.ar}</div>
        </div>
        <div style="display:flex; align-items:center; flex-shrink:0;">
          <button class="admin-edit-btn" style="margin-right:8px;" onclick="window.adminApp.editTrainingBullet(${i})">Edit</button>
          <button class="admin-btn-secondary" style="color:#ff4444;border-color:#ff4444;" onclick="window.adminApp.deleteTrainingBullet(${i})">Delete</button>
        </div>
      </div>
    `).join('');
  }

  function renderTrainingStats() {
    const d = loadTrainingData();
    const list = getEl('adminTrainingStatsList');
    if(!list) return;
    list.innerHTML = (d.stats || []).map((s, i) => `
      <div class="admin-list-item">
        <div style="flex:1; min-width:0; padding-right:16px;">
          <div style="margin-bottom:8px; font-weight:600; font-size:18px; color:var(--admin-accent);">Value/Target: ${s.target !== undefined ? s.target + (s.suffix||'') : (s.value || '')}</div>
          <div style="margin-bottom:4px; font-size:14px; overflow:hidden; text-overflow:ellipsis;"><strong>EN:</strong> ${s.labelEn}</div>
          <div dir="rtl" style="font-size:14px; color:var(--admin-text-muted); overflow:hidden; text-overflow:ellipsis;"><strong>AR:</strong> ${s.labelAr}</div>
        </div>
        <div style="display:flex; align-items:center; flex-shrink:0;">
          <button class="admin-edit-btn" style="margin-right:8px;" onclick="window.adminApp.editTrainingStat(${i})">Edit</button>
          <button class="admin-btn-secondary" style="color:#ff4444;border-color:#ff4444;" onclick="window.adminApp.deleteTrainingStat(${i})">Delete</button>
        </div>
      </div>
    `).join('');
  }

  function renderTrainingVideos() {
    const d = loadTrainingData();
    const list = getEl('adminTrainingVideosList');
    if(!list) return;
    list.innerHTML = (d.videos || []).map((v, i) => `
      <div class="admin-work-card" style="display:flex; flex-direction:column; gap:12px;">
        <div class="admin-work-info" style="min-width:0; width:100%;">
          <div class="admin-work-name" style="font-size:16px; font-weight:600; overflow:hidden; text-overflow:ellipsis;">${v.name}</div>
          <div class="admin-work-cat" style="font-size:13px; color:var(--admin-primary); margin-top:4px;">${v.roleEn}</div>
          <div style="margin-top:8px;font-size:12px;color:var(--admin-text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;background:rgba(255,255,255,0.05);padding:4px 8px;border-radius:4px;">${v.url}</div>
        </div>
        <div class="admin-work-actions" style="display:flex; align-items:center; gap:8px;">
          <button class="admin-edit-btn" style="flex:1;" onclick="window.adminApp.editTrainingVideo(${i})">Edit</button>
          <button class="admin-delete-btn" style="flex:1; color:#ff4444; border-color:#ff4444;" onclick="window.adminApp.deleteTrainingVideo(${i})">Delete</button>
        </div>
      </div>
    `).join('');
  }

  function saveTrainingMain() {
    const d = loadTrainingData();
    d.eyebrowEn = getEl('adminTrainingEyebrowEn').value;
    d.eyebrowAr = getEl('adminTrainingEyebrowAr').value;
    d.headingEn = getEl('adminTrainingHeadingEn').value;
    d.headingAr = getEl('adminTrainingHeadingAr').value;
    d.cardTitleEn = getEl('adminTrainingCardTitleEn').value;
    d.cardTitleAr = getEl('adminTrainingCardTitleAr').value;
    d.para1En = getEl('adminTrainingPara1En').value;
    d.para1Ar = getEl('adminTrainingPara1Ar').value;
    d.para2En = getEl('adminTrainingPara2En').value;
    d.para2Ar = getEl('adminTrainingPara2Ar').value;
    d.videoHeadingEn = getEl('adminTrainingVideoHeadingEn').value;
    d.videoHeadingAr = getEl('adminTrainingVideoHeadingAr').value;
    d.videoSubEn = getEl('adminTrainingVideoSubEn').value;
    d.videoSubAr = getEl('adminTrainingVideoSubAr').value;

    saveTrainingData(d);
    showToast('Training main settings saved');
  }

  function openTrainingVideoModal(index = -1) {
    const modal = getEl('adminTrainingVideoModal');
    if(!modal) return;
    const d = loadTrainingData();
    const v = index >= 0 ? d.videos[index] : null;

    getEl('trainingVideoEditIndex').value = index;
    getEl('tvName').value = v ? v.name : '';
    getEl('tvRoleEn').value = v ? v.roleEn : '';
    getEl('tvRoleAr').value = v ? v.roleAr : '';
    getEl('tvTextEn').value = v ? v.textEn : '';
    getEl('tvTextAr').value = v ? v.textAr : '';
    getEl('tvUrl').value = v ? v.url : '';
    if(getEl('tvCoverUrl')) getEl('tvCoverUrl').value = (v && v.coverUrl) ? v.coverUrl : '';

    modal.classList.add('active');
  }

  function saveTrainingVideo() {
    const index = parseInt(getEl('trainingVideoEditIndex').value);
    const d = loadTrainingData();
    const v = {
      name: getEl('tvName').value,
      roleEn: getEl('tvRoleEn').value,
      roleAr: getEl('tvRoleAr').value,
      textEn: getEl('tvTextEn').value,
      textAr: getEl('tvTextAr').value,
      url: getEl('tvUrl').value,
      coverUrl: getEl('tvCoverUrl') ? getEl('tvCoverUrl').value : ''
    };

    if (index >= 0) {
      d.videos[index] = v;
    } else {
      d.videos.push(v);
    }

    saveTrainingData(d);
    renderTrainingVideos();
    getEl('adminTrainingVideoModal').classList.remove('active');
    showToast(index >= 0 ? 'Video updated' : 'Video added');
  }

  window.adminApp = window.adminApp || {};
  window.adminApp.editTrainingVideo = openTrainingVideoModal;

  window.adminApp.formatParaText = function(editorId, command) {
    const editor = getEl(editorId);
    if (!editor) return;
    editor.focus();
    if (command === 'bold') {
      document.execCommand('bold', false, null);
    } else if (command === 'normal') {
      document.execCommand('removeFormat', false, null);
      document.execCommand('unlink', false, null);
      const sel = window.getSelection();
      if (sel && !sel.isCollapsed && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        let parent = range.commonAncestorContainer;
        if (parent.nodeType === 3) parent = parent.parentNode;
        while (parent && parent !== editor) {
          if (parent.tagName === 'STRONG' || parent.tagName === 'B') {
            const textNode = document.createTextNode(parent.textContent);
            parent.parentNode.replaceChild(textNode, parent);
            break;
          }
          parent = parent.parentNode;
        }
      }
    }
  };

  window.adminApp.openMentorParaModal = function(index = -1) {
    const modal = getEl('adminMentorParaModal');
    if(!modal) return;
    const d = loadTrainingData();
    const p = (index >= 0 && d.whoIsMentor && d.whoIsMentor.paragraphs) ? d.whoIsMentor.paragraphs[index] : null;

    getEl('mentorParaEditIndex').value = index;
    getEl('mentorParaModalTitle').innerText = index >= 0 ? 'Edit Mentor Paragraph' : 'Add Mentor Paragraph';
    
    const enEditor = getEl('mentorParaTextEn');
    const arEditor = getEl('mentorParaTextAr');
    if (enEditor) enEditor.innerHTML = p ? (p.textEn || '') : '';
    if (arEditor) arEditor.innerHTML = p ? (p.textAr || '') : '';

    modal.classList.add('active');
  };

  window.adminApp.saveMentorPara = function() {
    const index = parseInt(getEl('mentorParaEditIndex').value);
    const enEditor = getEl('mentorParaTextEn');
    const arEditor = getEl('mentorParaTextAr');

    let textEn = enEditor ? enEditor.innerHTML : '';
    let textAr = arEditor ? arEditor.innerHTML : '';

    // Standardize <b> and span bold tags to <strong>
    textEn = textEn
      .replace(/<b\b[^>]*>(.*?)<\/b>/gi, '<strong>$1</strong>')
      .replace(/<span style="font-weight:\s*bold;?">(.*?)<\/span>/gi, '<strong>$1</strong>');
    textAr = textAr
      .replace(/<b\b[^>]*>(.*?)<\/b>/gi, '<strong>$1</strong>')
      .replace(/<span style="font-weight:\s*bold;?">(.*?)<\/span>/gi, '<strong>$1</strong>');

    const cleanEn = (enEditor ? (enEditor.innerText || enEditor.textContent) : '').trim();
    const cleanAr = (arEditor ? (arEditor.innerText || arEditor.textContent) : '').trim();

    if(!cleanEn || !cleanAr) {
      showToast('Please enter both English and Arabic text', true);
      return;
    }

    const d = loadTrainingData();
    d.whoIsMentor = d.whoIsMentor || {};
    d.whoIsMentor.paragraphs = d.whoIsMentor.paragraphs || [];

    const paraObj = { textEn, textAr };

    if (index >= 0) {
      d.whoIsMentor.paragraphs[index] = paraObj;
    } else {
      d.whoIsMentor.paragraphs.push(paraObj);
    }

    saveTrainingData(d);
    renderAdminMentorParagraphs();
    if (getEl('adminMentorParaModal')) {
      getEl('adminMentorParaModal').classList.remove('active');
    }
    showToast(index >= 0 ? 'Paragraph updated globally' : 'Paragraph added globally');
  };

  window.adminApp.deleteMentorPara = async function(index) {
    const ok = await showConfirm('Delete Paragraph', 'Are you sure you want to delete this paragraph?');
    if(!ok) return;
    const d = loadTrainingData();
    if(d.whoIsMentor && d.whoIsMentor.paragraphs) {
      d.whoIsMentor.paragraphs.splice(index, 1);
      saveTrainingData(d);
      renderAdminMentorParagraphs();
      showToast('Paragraph deleted globally');
    }
  };

  window.adminApp.moveMentorPara = function(index, dir) {
    const d = loadTrainingData();
    if (!d.whoIsMentor || !d.whoIsMentor.paragraphs) return;
    const targetIdx = index + dir;
    if (targetIdx < 0 || targetIdx >= d.whoIsMentor.paragraphs.length) return;
    const temp = d.whoIsMentor.paragraphs[index];
    d.whoIsMentor.paragraphs[index] = d.whoIsMentor.paragraphs[targetIdx];
    d.whoIsMentor.paragraphs[targetIdx] = temp;
    saveTrainingData(d);
    renderAdminMentorParagraphs();
  };

  window.adminApp.deleteMentorPhoto = async function(index) {
    const ok = await showConfirm('Delete Photo', 'Are you sure you want to delete this mentor photo?');
    if(!ok) return;
    const d = loadTrainingData();
    if(d.whoIsMentor && d.whoIsMentor.photos) {
      d.whoIsMentor.photos.splice(index, 1);
      saveTrainingData(d);
      renderAdminMentorPhotos();
      showToast('Photo deleted globally');
    }
  };

  window.adminApp.moveMentorPhoto = function(index, dir) {
    const d = loadTrainingData();
    if (!d.whoIsMentor || !d.whoIsMentor.photos) return;
    const targetIdx = index + dir;
    if (targetIdx < 0 || targetIdx >= d.whoIsMentor.photos.length) return;
    const temp = d.whoIsMentor.photos[index];
    d.whoIsMentor.photos[index] = d.whoIsMentor.photos[targetIdx];
    d.whoIsMentor.photos[targetIdx] = temp;
    saveTrainingData(d);
    renderAdminMentorPhotos();
  };

  window.adminApp.toggleRichTextBold = function(editorId, makeBold) {
    const editor = getEl(editorId);
    if (!editor) return;

    editor.focus();
    const sel = window.getSelection();
    if (!sel.rangeCount || sel.isCollapsed) {
      showToast('Please select text inside the box first', true);
      return;
    }

    const range = sel.getRangeAt(0);
    if (!editor.contains(range.commonAncestorContainer)) {
      showToast('Please select text inside the box', true);
      return;
    }

    if (makeBold) {
      document.execCommand('bold', false, null);
    } else {
      const isBold = document.queryCommandState('bold');
      if (isBold) {
        document.execCommand('bold', false, null);
      } else {
        document.execCommand('removeFormat', false, null);
      }
    }
  };

  window.adminApp.editTrainingBullet = function(index) {
    const d = loadTrainingData();
    const b = d.bullets[index];
    if(!b) return;
    getEl('adminTrainingBulletEditIndex').value = index;
    getEl('adminTrainingBulletEn').value = b.en || '';
    getEl('adminTrainingBulletAr').value = b.ar || '';
    getEl('adminTrainingBulletBtnText').innerText = 'Save';
    getEl('adminTrainingBulletEn').focus();
  };

  window.adminApp.editTrainingStat = function(index) {
    const d = loadTrainingData();
    const s = d.stats[index];
    if(!s) return;
    getEl('adminTrainingStatEditIndex').value = index;
    getEl('adminTrainingStatTarget').value = s.target !== undefined ? s.target : '';
    getEl('adminTrainingStatSuffix').value = s.suffix || '';
    getEl('adminTrainingStatValue').value = s.value || '';
    getEl('adminTrainingStatLabelEn').value = s.labelEn || '';
    getEl('adminTrainingStatLabelAr').value = s.labelAr || '';
    getEl('adminTrainingStatBtnText').innerText = 'Save';
    getEl('adminTrainingStatTarget').focus();
  };

  window.adminApp.deleteTrainingVideo = async function(index) {
    const ok = await showConfirm('Delete Video', 'Are you sure you want to delete this video?');
    if(!ok) return;
    const d = loadTrainingData();
    d.videos.splice(index, 1);
    saveTrainingData(d);
    renderTrainingVideos();
    showToast('Video deleted');
  };

  window.adminApp.deleteTrainingBullet = async function(index) {
    const ok = await showConfirm('Delete Bullet', 'Are you sure you want to delete this bullet point?');
    if(!ok) return;
    const d = loadTrainingData();
    d.bullets.splice(index, 1);
    saveTrainingData(d);
    renderTrainingBullets();
    showToast('Bullet deleted');
  };

  window.adminApp.deleteTrainingStat = async function(index) {
    const ok = await showConfirm('Delete Stat', 'Are you sure you want to delete this stat?');
    if(!ok) return;
    const d = loadTrainingData();
    d.stats.splice(index, 1);
    saveTrainingData(d);
    renderTrainingStats();
    showToast('Stat deleted');
  };


  async function deleteReview(type, index) {
     const ok = await showConfirm('Delete Review', 'Are you sure you want to delete this review? This cannot be undone.');
     if(!ok) return;
     
     let reviews = type === 'client' ? window.clientReviews : window.studentReviews;
     const name = reviews[index].name;
     reviews.splice(index, 1);
     
     if (type === 'client') saveClientReviews(reviews);
     else saveStudentReviews(reviews);
     
     logActivity(`Deleted review for ${name}`);
     renderReviews(type);
     showToast('Review deleted');
  }

  // --- Works ---
  function renderWorksPage() {
    if(getEl('adminWorksCategory')) getEl('adminWorksCategory').value = currentWorksCategory;
    renderWorks(currentWorksCategory);
  }

  let editingWorkIndex = -1;
  let editingWorkCategory = null;

  function renderWorks(category) {
    const container = getEl('adminWorksList');
    if(!container) return;
    
    if (!window.serviceWorks || !window.serviceWorks[category] || !window.serviceWorks[category].works || window.serviceWorks[category].works.length === 0) {
      container.innerHTML = '<p class="admin-empty-state">No works found in this category.</p>';
      return;
    }
    
    container.innerHTML = window.serviceWorks[category].works.map((w, index) => {
      if (editingWorkCategory === category && editingWorkIndex === index) {
        return `
          <div class="admin-work-card" style="flex-direction: column; align-items: stretch; gap: 10px; background: rgba(255,255,255,0.05); padding: 15px;">
            <input type="text" id="editWorkName-${index}" class="admin-input" value="${(w.name||'').replace(/"/g, '&quot;')}" placeholder="Work Name">
            <input type="text" id="editWorkCat-${index}" class="admin-input" value="${(w.cat||'').replace(/"/g, '&quot;')}" placeholder="Category Tag">
            <textarea id="editWorkDesc-${index}" class="admin-input" style="resize:vertical; min-height:60px;" placeholder="Work Description">${(w.desc||'').replace(/</g, '&lt;')}</textarea>
            <input type="text" id="editWorkUrl-${index}" class="admin-input" value="${(w.url||'').replace(/"/g, '&quot;')}" placeholder="Video/Media URL">
            <div style="display:flex; gap: 10px; justify-content: flex-end;">
              <button class="admin-btn-secondary" onclick="window.adminApp.cancelEditWork()">Cancel</button>
              <button class="admin-add-btn" style="width: auto;" onclick="window.adminApp.saveEditWork('${category}', ${index})">Save</button>
            </div>
          </div>
        `;
      }
      return `
        <div class="admin-work-card">
          <div class="admin-work-info">
            <span class="admin-work-category">${w.cat}</span>
            <span class="admin-work-name">${w.name}</span>
            ${w.url ? `<a href="${w.url}" target="_blank" style="margin-left: 10px; color: var(--accent-color); font-size: 0.8rem;" title="Has media attached">[Media URL]</a>` : ''}
            ${w.desc ? `<div style="font-size: 0.8rem; color: #888; margin-top: 4px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${w.desc}</div>` : ''}
          </div>
          <div style="display:flex; gap: 8px;">
            <button class="admin-delete-btn" style="background: rgba(255,255,255,0.1); color: #fff;" onclick="window.adminApp.editWork('${category}', ${index})" title="Edit Work">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="admin-delete-btn" onclick="window.adminApp.deleteWork('${category}', ${index})" title="Delete Work">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  function addWork() {
    const catSelect = getEl('adminWorkMainCat');
    const category = catSelect ? catSelect.value : currentWorksCategory;
    const nameInput = getEl('adminWorkName');
    const catInput = getEl('adminWorkCat');
    const descInput = getEl('adminWorkDesc');
    
    const urlInput = getEl('adminWorkUrl');
    
    if(!category || category === "") {
      showToast('Please select a main category', 'error');
      return;
    }
    
    if(!nameInput.value.trim() || !catInput.value.trim()) {
      showToast('Please enter both name and category tag', 'error');
      return;
    }
    
    if (!window.serviceWorks) window.serviceWorks = {};
    if (!window.serviceWorks[category]) window.serviceWorks[category] = { title: category, works: [] };
    if (!window.serviceWorks[category].works) window.serviceWorks[category].works = [];
    
    window.serviceWorks[category].works.unshift({
      name: nameInput.value.trim(),
      cat: catInput.value.trim(),
      desc: descInput ? descInput.value.trim() : '',
      url: urlInput ? urlInput.value.trim() : ''
    });
    
    // Fix: Update the current category state and UI dropdown so it matches what was just added
    currentWorksCategory = category;
    if(getEl('adminWorksCategory')) getEl('adminWorksCategory').value = category;
    
    saveWorks(window.serviceWorks);
    logActivity(`Added work "${nameInput.value.trim()}" to ${category}`);
    renderWorks(category);
    
    nameInput.value = '';
    catInput.value = '';
    if (descInput) descInput.value = '';
    if (urlInput) urlInput.value = '';
    showToast('Work added successfully');
  }
  function editWork(category, index) {
    editingWorkCategory = category;
    editingWorkIndex = index;
    renderWorks(category);
  }

  function cancelEditWork() {
    const cat = editingWorkCategory;
    editingWorkCategory = null;
    editingWorkIndex = -1;
    if(cat) renderWorks(cat);
  }

  function saveEditWork(category, index) {
    const w = window.serviceWorks[category].works[index];
    const name = getEl(`editWorkName-${index}`).value.trim();
    const cat = getEl(`editWorkCat-${index}`).value.trim();
    const desc = getEl(`editWorkDesc-${index}`).value.trim();
    const url = getEl(`editWorkUrl-${index}`).value.trim();
    
    if(!name || !cat) {
      showToast('Name and Category tag are required', 'error');
      return;
    }
    
    w.name = name;
    w.cat = cat;
    w.desc = desc;
    w.url = url;
    
    saveWorks(window.serviceWorks);
    logActivity(`Edited work "${name}" in ${category}`);
    
    editingWorkCategory = null;
    editingWorkIndex = -1;
    renderWorks(category);
    showToast('Work updated successfully');
  }

  async function deleteWork(category, index) {
    const ok = await showConfirm('Delete Work', 'Are you sure you want to delete this work?');
    if(!ok) return;
    
    const name = window.serviceWorks[category].works[index].name;
    window.serviceWorks[category].works.splice(index, 1);
    saveWorks(window.serviceWorks);
    
    logActivity(`Deleted work "${name}" from ${category}`);
    renderWorks(category);
    showToast('Work deleted');
  }

  // --- Provided Services ---
  function loadProvidedServices() {
    let data = safeJSONParse(localStorage.getItem(STORAGE_KEYS.PROVIDED), {});
    if (Array.isArray(data)) data = {};
    return data;
  }
  
  function saveProvidedServices(data, updatedCategory) {
    localStorage.setItem(STORAGE_KEYS.PROVIDED, JSON.stringify(data));
    if (typeof window.renderFrontendProvidedServices === 'function') {
      window.renderFrontendProvidedServices(updatedCategory || currentProvidedCategory);
    }
  }

  // Row 3 separate storage
  function loadProvidedServicesRow3() {
    let data = safeJSONParse(localStorage.getItem(STORAGE_KEYS.PROVIDED_ROW3), {});
    if (Array.isArray(data)) data = {};
    return data;
  }

  function saveProvidedServicesRow3(data, updatedCategory) {
    localStorage.setItem(STORAGE_KEYS.PROVIDED_ROW3, JSON.stringify(data));
    if (typeof window.renderFrontendProvidedServices === 'function') {
      window.renderFrontendProvidedServices(updatedCategory || currentProvidedCategory);
    }
  }

  function renderProvidedPage() {
    if(getEl('adminProvidedCategory')) getEl('adminProvidedCategory').value = currentProvidedCategory;
    // Load 3rd line toggle state
    const thirdLineCheckbox = getEl('adminProvidedThirdLine');
    if (thirdLineCheckbox) {
      thirdLineCheckbox.checked = localStorage.getItem(STORAGE_KEYS.PROVIDED_THIRD_LINE) === 'true';
    }
    // Show/hide the Row 3 option in target row selector
    const targetRowSelect = getEl('adminProvidedTargetRow');
    if (targetRowSelect) {
      const row3Option = targetRowSelect.querySelector('option[value="row3"]');
      if (row3Option) {
        row3Option.disabled = localStorage.getItem(STORAGE_KEYS.PROVIDED_THIRD_LINE) !== 'true';
      }
    }

    // Load Divider Texts
    if(getEl('adminProvidedDivider1En')) getEl('adminProvidedDivider1En').value = localStorage.getItem(STORAGE_KEYS.PROVIDED_DIVIDER1_EN) || 'not just look pretty.';
    if(getEl('adminProvidedDivider1Ar')) getEl('adminProvidedDivider1Ar').value = localStorage.getItem(STORAGE_KEYS.PROVIDED_DIVIDER1_AR) || 'مش بس يبقى جميل.';
    if(getEl('adminProvidedDivider2En')) getEl('adminProvidedDivider2En').value = localStorage.getItem(STORAGE_KEYS.PROVIDED_DIVIDER2_EN) || 'not just look pretty.';
    if(getEl('adminProvidedDivider2Ar')) getEl('adminProvidedDivider2Ar').value = localStorage.getItem(STORAGE_KEYS.PROVIDED_DIVIDER2_AR) || 'مش بس يبقى جميل.';

    renderProvidedServices(currentProvidedCategory);
  }

  function renderProvidedServices(category) {
    const container = getEl('adminProvidedList');
    if(!container) return;
    
    const data = loadProvidedServices();
    const dataRow3 = loadProvidedServicesRow3();
    const row12Items = (data[category] || []);
    const row3Items = (dataRow3[category] || []);
    const thirdLineEnabled = localStorage.getItem(STORAGE_KEYS.PROVIDED_THIRD_LINE) === 'true';
    
    if (row12Items.length === 0 && (!thirdLineEnabled || row3Items.length === 0)) {
      container.innerHTML = '<p class="admin-empty-state">No items found in this category.</p>';
      return;
    }
    
    let html = '';
    
    // Row 1 & 2 items
    if (row12Items.length > 0) {
      html += '<div style="margin-bottom: 8px; color: rgba(255,255,255,0.5); font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px;">Row 1 & 2</div>';
      html += row12Items.map((item, index) => `
        <div class="admin-work-card">
          <div class="admin-work-info">
            <span class="admin-work-category">${item.orientation}</span>
            <span class="admin-work-name" style="word-break: break-all;">${item.url}</span>
          </div>
          <button class="admin-delete-btn" onclick="window.adminApp.deleteProvided('${category}', ${index})">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      `).join('');
    }
    
    // Row 3 items
    if (thirdLineEnabled) {
      html += '<div style="margin-top: 16px; margin-bottom: 8px; color: rgba(255,255,255,0.5); font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 12px;">Row 3</div>';
      if (row3Items.length > 0) {
        html += row3Items.map((item, index) => `
          <div class="admin-work-card" style="border-left: 3px solid var(--ka-accent, #4867ff);">
            <div class="admin-work-info">
              <span class="admin-work-category">${item.orientation}</span>
              <span class="admin-work-name" style="word-break: break-all;">${item.url}</span>
            </div>
            <button class="admin-delete-btn" onclick="window.adminApp.deleteProvidedRow3('${category}', ${index})">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        `).join('');
      } else {
        html += '<p class="admin-empty-state" style="margin: 8px 0;">Row 3 is empty — placeholders will be shown. Add items above using "Row 3" target.</p>';
      }
    }
    
    container.innerHTML = html;
  }

  function addProvidedService() {
    const catSelect = getEl('adminProvidedMainCat');
    const category = (catSelect && catSelect.value) ? catSelect.value : currentProvidedCategory;
    const orientation = getEl('adminProvidedOrientation').value;
    const url = getEl('adminProvidedUrl').value;
    const targetRow = getEl('adminProvidedTargetRow') ? getEl('adminProvidedTargetRow').value : 'rows12';
    
    if(!category || category === "") {
      showToast('Please select a main category', 'error');
      return;
    }
    
    let safeUrl = url.trim();
    if(!safeUrl) {
      showToast('Please enter an image URL', 'error');
      return;
    }
    
    if (!safeUrl.startsWith('http') && !safeUrl.startsWith('/') && !safeUrl.startsWith('<iframe')) {
      showToast('Please enter a valid URL or iframe (must start with http://, https://, or <iframe)', 'error');
      return;
    }
    
    if (targetRow === 'row3') {
      const data = loadProvidedServicesRow3();
      if (!data[category]) data[category] = [];
      data[category].unshift({ orientation, url: safeUrl });
      currentProvidedCategory = category;
      if(getEl('adminProvidedCategory')) getEl('adminProvidedCategory').value = category;
      saveProvidedServicesRow3(data, category);
      logActivity(`Added image to Provided Services Row 3: ${category}`);
    } else {
      const data = loadProvidedServices();
      if (!data[category]) data[category] = [];
      data[category].unshift({ orientation, url: safeUrl });
      currentProvidedCategory = category;
      if(getEl('adminProvidedCategory')) getEl('adminProvidedCategory').value = category;
      saveProvidedServices(data, category);
      logActivity(`Added image to Provided Services: ${category}`);
    }
    
    renderProvidedServices(category);
    getEl('adminProvidedUrl').value = '';
    showToast('Item added successfully');
  }

  async function deleteProvidedService(category, index) {
    const ok = await showConfirm('Delete Item', 'Are you sure you want to delete this item?');
    if(!ok) return;
    
    const data = loadProvidedServices();
    data[category].splice(index, 1);
    saveProvidedServices(data, category);
    logActivity(`Deleted image from Provided Services: ${category}`);
    renderProvidedServices(category);
    showToast('Item deleted');
  }

  async function deleteProvidedServiceRow3(category, index) {
    const ok = await showConfirm('Delete Item', 'Are you sure you want to delete this Row 3 item?');
    if(!ok) return;
    
    const data = loadProvidedServicesRow3();
    data[category].splice(index, 1);
    saveProvidedServicesRow3(data, category);
    logActivity(`Deleted image from Provided Services Row 3: ${category}`);
    renderProvidedServices(category);
    showToast('Item deleted');
  }

  // --- Map & Stats ---
  function loadMapCountries() {
    const saved = localStorage.getItem(STORAGE_KEYS.MAP_COUNTRIES);
    if (saved) return safeJSONParse(saved, []);
    return window.defaultMapCountries || []; 
  }

  function saveMapCountries(data) {
    localStorage.setItem(STORAGE_KEYS.MAP_COUNTRIES, JSON.stringify(data));
    // Optionally trigger update if map is visible
    if(window.buildWorldMap) {
      window.mapCountriesData = data;
      setTimeout(window.buildWorldMap, 100);
    }
  }

  function loadGlobalStats() {
    const saved = localStorage.getItem(STORAGE_KEYS.GLOBAL_STATS);
    if (saved) return safeJSONParse(saved, { projects: 1318, countries: 14, clients: 470 });
    return { projects: 1318, countries: 14, clients: 470 };
  }

  function saveGlobalStats(data) {
    localStorage.setItem(STORAGE_KEYS.GLOBAL_STATS, JSON.stringify(data));
    // Trigger update on frontend
    if (window.updateFrontendStats) {
       window.updateFrontendStats(data);
    }
  }

  function renderMapPage() {
    const stats = loadGlobalStats();
    if (getEl('adminMapProjects')) getEl('adminMapProjects').value = stats.projects;
    if (getEl('adminMapCountries')) getEl('adminMapCountries').value = stats.countries;
    if (getEl('adminMapClients')) getEl('adminMapClients').value = stats.clients;

    renderCountriesList();
  }

  function renderCountriesList() {
    const container = getEl('adminCountriesList');
    if(!container) return;
    
    const data = loadMapCountries();
    if (data.length === 0) {
      container.innerHTML = '<p class="admin-empty-state">No countries found.</p>';
      return;
    }
    
    container.innerHTML = data.map((item, index) => `
      <div class="admin-work-card">
        <div class="admin-work-info">
          <span class="admin-work-category">${item.flag} ${item.name} ${item.name_ar ? '(' + item.name_ar + ')' : ''}</span>
          <span class="admin-work-name" style="font-size: 12px; color: var(--admin-text-muted);">Lat: ${item.lat}, Lng: ${item.lng} ${item.home ? ' (Home)' : ''}</span>
        </div>
        <button class="admin-delete-btn" onclick="window.adminApp.deleteCountry(${index})">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
      </div>
    `).join('');
  }

  function addCountry() {
    const name = getEl('adminCountryName').value.trim();
    const name_ar = getEl('adminCountryNameAr').value.trim();
    const flag = getEl('adminCountryFlag').value.trim();
    const lat = parseFloat(getEl('adminCountryLat').value);
    const lng = parseFloat(getEl('adminCountryLng').value);
    const home = getEl('adminCountryHome').checked;

    if(!name || !flag || isNaN(lat) || isNaN(lng)) {
      showToast('Please fill all required fields correctly', 'error');
      return;
    }

    const data = loadMapCountries();
    // dx and dy are optional visual adjustments
    data.push({ name, name_ar, flag, lat, lng, home });
    saveMapCountries(data);
    
    logActivity(`Added country: ${name}`);
    renderCountriesList();
    
    getEl('adminCountryName').value = '';
    getEl('adminCountryNameAr').value = '';
    getEl('adminCountryFlag').value = '';
    getEl('adminCountryLat').value = '';
    getEl('adminCountryLng').value = '';
    getEl('adminCountryHome').checked = false;
    showToast('Country added successfully');
  }

  async function deleteCountry(index) {
    const ok = await showConfirm('Delete Country', 'Are you sure you want to delete this country?');
    if(!ok) return;
    
    const data = loadMapCountries();
    const name = data[index]?.name;
    data.splice(index, 1);
    saveMapCountries(data);
    
    logActivity(`Deleted country: ${name}`);
    renderCountriesList();
    showToast('Country deleted');
  }

  function saveStats(type) {
    const stats = loadGlobalStats();
    if (type === 'projects') stats.projects = getEl('adminMapProjects').value;
    if (type === 'countries') stats.countries = getEl('adminMapCountries').value;
    if (type === 'clients') stats.clients = getEl('adminMapClients').value;
    
    saveGlobalStats(stats);
    logActivity(`Updated ${type} stat`);
    showToast('Stats saved successfully');
  }

  // --- Analytics ---
  function renderAnalyticsPage() {
    document.querySelectorAll('.admin-analytics-tab').forEach(t => {
      t.classList.toggle('active', t.getAttribute('data-analytics-tab') === currentAnalyticsTab);
    });
    document.querySelectorAll('.admin-analytics-panel').forEach(p => {
      p.classList.toggle('active', p.getAttribute('data-analytics-panel') === currentAnalyticsTab);
    });
    
    const data = loadAnalytics();
    
    if (currentAnalyticsTab === 'viewers') renderViewersAnalytics(data.viewers || []);
    else if (currentAnalyticsTab === 'clicks') renderClicksAnalytics(data.clicks || []);
    else if (currentAnalyticsTab === 'contacts') renderContactsAnalytics(data.contacts || []);
  }

  function addAnalyticsEntry(type) {
    const data = loadAnalytics();
    let entry = {};
    
    if (type === 'viewers') {
      const date = getEl('viewerDate').value;
      const count = parseInt(getEl('viewerCount').value);
      const period = getEl('viewerPeriod').value;
      if(!date || isNaN(count)) return showToast('Please fill all fields', 'error');
      entry = { date, count, period, id: Date.now() };
      if(!data.viewers) data.viewers = [];
      data.viewers.push(entry);
    } 
    else if (type === 'clicks') {
      const date = getEl('clickDate').value;
      const count = parseInt(getEl('clickCount').value);
      const platform = getEl('clickPlatform').value;
      if(!date || isNaN(count)) return showToast('Please fill all fields', 'error');
      entry = { date, platform, count, id: Date.now() };
      if(!data.clicks) data.clicks = [];
      data.clicks.push(entry);
    }
    else if (type === 'contacts') {
      const date = getEl('contactDate').value;
      const count = parseInt(getEl('contactCount').value);
      const channel = getEl('contactChannel').value;
      if(!date || isNaN(count)) return showToast('Please fill all fields', 'error');
      entry = { date, channel, count, id: Date.now() };
      if(!data.contacts) data.contacts = [];
      data.contacts.push(entry);
    }
    
    saveAnalytics(data);
    showToast('Data added');
    logActivity(`Added ${type} analytics data`);
    renderAnalyticsPage();
  }

  async function deleteAnalyticsEntry(type, id) {
    const ok = await showConfirm('Delete Entry', 'Delete this analytics data?');
    if(!ok) return;
    
    const data = loadAnalytics();
    if(data[type]) {
       data[type] = data[type].filter(item => item.id !== id);
       saveAnalytics(data);
       renderAnalyticsPage();
       showToast('Entry deleted');
    }
  }

  function renderViewersAnalytics(viewers) {
    // Sort by date ascending
    const sorted = [...viewers].sort((a,b) => new Date(a.date) - new Date(b.date));
    
    // Stats
    let total = 0, thisMonth = 0, thisWeek = 0;
    const now = new Date();
    sorted.forEach(v => {
      total += v.count;
      const d = new Date(v.date);
      if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
        thisMonth += v.count;
      }
      const diffTime = Math.abs(now - d);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      if (diffDays <= 7) thisWeek += v.count;
    });
    
    if(getEl('totalViews')) getEl('totalViews').innerText = total;
    if(getEl('monthViews')) getEl('monthViews').innerText = thisMonth;
    if(getEl('weekViews')) getEl('weekViews').innerText = thisWeek;
    if(getEl('avgViews')) getEl('avgViews').innerText = sorted.length ? Math.round(total/sorted.length) : 0;
    
    // Table
    const table = getEl('viewersTable');
    if (table) {
      table.innerHTML = sorted.slice().reverse().map(v => `
        <tr>
          <td>${v.date}</td>
          <td>${v.count}</td>
          <td><span class="admin-period-badge">${v.period}</span></td>
          <td><button class="admin-btn-danger" onclick="window.adminApp.deleteAnalyticsEntry('viewers', ${v.id})">Delete</button></td>
        </tr>
      `).join('');
    }
    
    // Chart
    const canvas = getEl('viewersChart');
    if(canvas) {
       const chartData = sorted.map(v => ({ label: v.date, value: v.count }));
       drawLineChart(canvas, chartData);
    }
  }

  function renderClicksAnalytics(clicks) {
    let total = 0;
    const platformCounts = {};
    clicks.forEach(c => {
      total += c.count;
      platformCounts[c.platform] = (platformCounts[c.platform] || 0) + c.count;
    });
    
    let topPlatform = '—', max = 0;
    for(let p in platformCounts) {
      if(platformCounts[p] > max) { max = platformCounts[p]; topPlatform = p; }
    }
    
    if(getEl('totalClicks')) getEl('totalClicks').innerText = total;
    if(getEl('topPlatform')) getEl('topPlatform').innerText = topPlatform;
    
    const table = getEl('clicksTable');
    if(table) {
      table.innerHTML = [...clicks].reverse().map(c => `
        <tr>
          <td>${c.date}</td>
          <td>${c.platform}</td>
          <td>${c.count}</td>
          <td><button class="admin-btn-danger" onclick="window.adminApp.deleteAnalyticsEntry('clicks', ${c.id})">Delete</button></td>
        </tr>
      `).join('');
    }
    
    const canvas = getEl('clicksChart');
    if(canvas) {
       const colors = ['#b04dff', '#4867ff', '#10b981', '#f59e0b', '#ef4444', '#6ea8e5'];
       const chartData = Object.keys(platformCounts).map((p, i) => ({
          label: p, value: platformCounts[p], color: colors[i % colors.length]
       }));
       drawBarChart(canvas, chartData);
    }
  }

  function renderContactsAnalytics(contacts) {
    let total = 0, calls = 0, emails = 0, whatsapp = 0;
    contacts.forEach(c => {
      total += c.count;
      if(c.channel === 'Book a Call') calls += c.count;
      if(c.channel === 'Email') emails += c.count;
      if(c.channel === 'WhatsApp') whatsapp += c.count;
    });
    
    if(getEl('totalContacts')) getEl('totalContacts').innerText = total;
    if(getEl('callCount')) getEl('callCount').innerText = calls;
    if(getEl('emailCount')) getEl('emailCount').innerText = emails;
    if(getEl('whatsappCount')) getEl('whatsappCount').innerText = whatsapp;
    
    const table = getEl('contactsTable');
    if(table) {
      table.innerHTML = [...contacts].reverse().map(c => `
        <tr>
          <td>${c.date}</td>
          <td>${c.channel}</td>
          <td>${c.count}</td>
          <td><button class="admin-btn-danger" onclick="window.adminApp.deleteAnalyticsEntry('contacts', ${c.id})">Delete</button></td>
        </tr>
      `).join('');
    }
    
    const canvas = getEl('contactsChart');
    if(canvas) {
       const chartData = [
         { label: 'Book a Call', value: calls, color: '#b04dff' },
         { label: 'Email', value: emails, color: '#4867ff' },
         { label: 'WhatsApp', value: whatsapp, color: '#10b981' }
       ].filter(d => d.value > 0);
       drawDonutChart(canvas, chartData);
    }
  }

  // --- Settings ---
  function renderSettingsPage() {
    const credsStr = localStorage.getItem(STORAGE_KEYS.CREDS);
    if(credsStr) {
      const creds = JSON.parse(credsStr);
      if(getEl('settingsCurrentUser')) getEl('settingsCurrentUser').value = creds.username;
    }
    
    const settings = getSettings();
    if(getEl('settingsWhatsapp')) getEl('settingsWhatsapp').value = settings.whatsapp || window.QB_CONFIG?.whatsappNumber || '';
    if(getEl('settingsEmail')) getEl('settingsEmail').value = settings.email || window.QB_CONFIG?.email || '';
    if(getEl('settingsCalendly')) getEl('settingsCalendly').value = settings.calendly || window.QB_CONFIG?.calendlyUrl || '';
    
    if(getEl('settingsInstagram')) getEl('settingsInstagram').value = settings.instagram || document.querySelector('a[aria-label="Instagram"]')?.href || '';
    if(getEl('settingsLinkedin')) getEl('settingsLinkedin').value = settings.linkedin || document.querySelector('a[aria-label="LinkedIn"]')?.href || '';
    if(getEl('settingsYoutube')) getEl('settingsYoutube').value = settings.youtube || document.querySelector('a[aria-label="YouTube"]')?.href || '';
    if(getEl('settingsFacebook')) getEl('settingsFacebook').value = settings.facebook || document.querySelector('a[aria-label="Facebook"]')?.href || '';
    if(getEl('settingsTiktok')) getEl('settingsTiktok').value = settings.tiktok || document.querySelector('a[aria-label="TikTok"]')?.href || '';
  }

  async function updateCredentials() {
    const currentPass = getEl('settingsCurrentPassword').value;
    const newUsername = getEl('settingsNewUsername').value;
    const newPass = getEl('settingsNewPassword').value;
    const confPass = getEl('settingsConfirmPassword').value;
    
    if(!currentPass) return showToast('Current password required to make changes', 'error');
    if(newPass && newPass !== confPass) return showToast('New passwords do not match', 'error');
    
    const credsStr = localStorage.getItem(STORAGE_KEYS.CREDS);
    const creds = credsStr ? JSON.parse(credsStr) : DEFAULT_CREDS;
    
    const hashedInput = await hashPassword(currentPass);
    if(hashedInput !== creds.passwordHash) {
      return showToast('Incorrect current password', 'error');
    }
    
    if(newUsername) creds.username = newUsername;
    if(newPass) creds.passwordHash = await hashPassword(newPass);
    
    localStorage.setItem(STORAGE_KEYS.CREDS, JSON.stringify(creds));
    
    getEl('settingsCurrentPassword').value = '';
    getEl('settingsNewPassword').value = '';
    getEl('settingsConfirmPassword').value = '';
    
    renderSettingsPage();
    if(getEl('adminUserDisplay')) getEl('adminUserDisplay').innerText = creds.username;
    showToast('Credentials updated successfully');
  }

  // ═══ CHART RENDERER (HTML5 CANVAS) ═══
  
  function setupCanvas(canvas) {
    const parent = canvas.parentElement;
    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    return { ctx, w: canvas.width, h: canvas.height };
  }

  function drawEmptyChart(ctx, w, h) {
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '14px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('No data available', w/2, h/2);
  }

  function drawLineChart(canvas, data) {
    const { ctx, w, h } = setupCanvas(canvas);
    if(!data || data.length === 0) return drawEmptyChart(ctx, w, h);
    
    const padding = 40;
    const maxVal = Math.max(...data.map(d => d.value), 10);
    
    // Draw Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for(let i=0; i<=4; i++) {
      const y = padding + (h - 2*padding) * (i/4);
      ctx.moveTo(padding, y);
      ctx.lineTo(w - padding, y);
    }
    ctx.stroke();
    
    // Draw Line
    ctx.beginPath();
    const points = data.map((d, i) => {
      const x = padding + (w - 2*padding) * (i / Math.max(1, data.length - 1));
      const y = (h - padding) - ((d.value / maxVal) * (h - 2*padding));
      return {x, y};
    });
    
    if(points.length > 0) {
      ctx.moveTo(points[0].x, points[0].y);
      for(let i=1; i<points.length; i++) {
        // smooth curve approx
        const xc = (points[i].x + points[i-1].x) / 2;
        const yc = (points[i].y + points[i-1].y) / 2;
        ctx.quadraticCurveTo(points[i-1].x, points[i-1].y, xc, yc);
      }
      ctx.lineTo(points[points.length-1].x, points[points.length-1].y);
      
      ctx.strokeStyle = '#4867ff';
      ctx.lineWidth = 3;
      ctx.stroke();
      
      // Gradient Fill
      const gradient = ctx.createLinearGradient(0, padding, 0, h - padding);
      gradient.addColorStop(0, 'rgba(72,103,255,0.3)');
      gradient.addColorStop(1, 'rgba(72,103,255,0)');
      
      ctx.lineTo(points[points.length-1].x, h - padding);
      ctx.lineTo(points[0].x, h - padding);
      ctx.fillStyle = gradient;
      ctx.fill();
      
      // Points
      ctx.fillStyle = '#fff';
      points.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI*2);
        ctx.fill();
      });
    }
  }

  function drawBarChart(canvas, data) {
    const { ctx, w, h } = setupCanvas(canvas);
    if(!data || data.length === 0) return drawEmptyChart(ctx, w, h);
    
    const padding = 40;
    const maxVal = Math.max(...data.map(d => d.value), 10);
    const barWidth = Math.min(40, (w - 2*padding) / data.length * 0.6);
    
    data.forEach((d, i) => {
      const x = padding + (w - 2*padding) * ((i + 0.5) / data.length) - barWidth/2;
      const barH = (d.value / maxVal) * (h - 2*padding);
      const y = h - padding - barH;
      
      ctx.fillStyle = d.color || '#4867ff';
      
      // Rounded top bar
      ctx.beginPath();
      ctx.moveTo(x, h - padding);
      ctx.lineTo(x, y + 4);
      ctx.quadraticCurveTo(x, y, x + 4, y);
      ctx.lineTo(x + barWidth - 4, y);
      ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + 4);
      ctx.lineTo(x + barWidth, h - padding);
      ctx.fill();
      
      // Label
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = '12px Inter';
      ctx.textAlign = 'center';
      ctx.fillText(d.label, x + barWidth/2, h - padding + 15);
      
      // Value
      ctx.fillStyle = '#fff';
      ctx.fillText(d.value, x + barWidth/2, y - 8);
    });
  }

  function drawDonutChart(canvas, data) {
    const { ctx, w, h } = setupCanvas(canvas);
    if(!data || data.length === 0) return drawEmptyChart(ctx, w, h);
    
    const cx = w/2, cy = h/2;
    const r = Math.min(cx, cy) * 0.7;
    const thickness = r * 0.3;
    
    let total = data.reduce((s,d) => s + d.value, 0);
    let startAngle = -Math.PI/2;
    
    data.forEach(d => {
      const sliceAngle = (d.value / total) * Math.PI * 2;
      
      ctx.beginPath();
      ctx.arc(cx, cy, r, startAngle, startAngle + sliceAngle);
      ctx.arc(cx, cy, r - thickness, startAngle + sliceAngle, startAngle, true);
      ctx.fillStyle = d.color;
      ctx.fill();
      
      startAngle += sliceAngle;
    });
    
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 24px Inter';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(total, cx, cy - 10);
    
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '12px Inter';
    ctx.fillText('Total', cx, cy + 15);
    
    // Draw legend at bottom
    // ... basic legend drawing omitted for brevity, text is enough for donut
  }


  // ═══ INITIALIZATION ═══
  async function initAdmin() {
    await initAuth();
    loadData();
    applyHomePageData();
    
    // Live Sync Toggle Init
    const liveSyncToggle = getEl('adminLiveSyncToggle');
    const liveSyncStatus = getEl('adminModeStatusText');
    if (liveSyncToggle && liveSyncStatus) {
      // Load initial state from Firebase
      if (window.kaDatabase) {
        window.kaDatabase.ref('data/ka_maintenance_mode').once('value').then((snap) => {
          const isMaintenance = snap.val() === true;
          liveSyncToggle.checked = !isMaintenance;
          liveSyncStatus.textContent = isMaintenance ? 'OFF (Maintenance)' : 'ON (Live)';
          liveSyncStatus.className = 'admin-mode-status ' + (isMaintenance ? 'off' : 'on');
        });
      } else {
        liveSyncToggle.checked = true;
        liveSyncStatus.textContent = 'ON (Live)';
        liveSyncStatus.className = 'admin-mode-status on';
      }

      liveSyncToggle.addEventListener('change', async (e) => {
        const isON = e.target.checked;
        liveSyncStatus.textContent = isON ? 'ON (Live)' : 'OFF (Maintenance)';
        liveSyncStatus.className = 'admin-mode-status ' + (isON ? 'on' : 'off');
        
        if (window.kaDatabase) {
          try {
             if (isON) {
              // Disable maintenance mode — visitors will see the live site
              await window.kaDatabase.ref('data/ka_maintenance_mode').set(false);
              showToast('Website is LIVE! All your changes are already saved globally.', 'success');
            } else {
              // Enable maintenance mode — visitors will see "Under Repair" page
              await window.kaDatabase.ref('data/ka_maintenance_mode').set(true);
              showToast('Maintenance mode ON. Visitors see "Under Repair" page. Your edits still save globally.', 'info');
            }
          } catch (err) {
            console.error('Sync error:', err);
            showToast('Failed to update website status: ' + err.message, 'error');
          }
        } else {
          showToast('Firebase not connected', 'error');
        }
      });
    }
    
    // Resize listener for charts
    window.addEventListener('resize', () => {
       if(document.body.classList.contains('admin-mode') && currentAnalyticsTab) {
          setTimeout(renderAnalyticsPage, 100);
       }
    });

    // Login handling
    const loginForm = getEl('adminLoginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const u = getEl('adminUsername').value;
        const p = getEl('adminPassword').value;
        const errEl = getEl('adminLoginError');
        errEl.innerText = '';
        
        try {
          const btn = loginForm.querySelector('.admin-login-btn');
          btn.innerText = 'Signing in...';
          await login(u, p);
          // Success
          getEl('adminUsername').value = '';
          getEl('adminPassword').value = '';
          
          document.body.classList.add('admin-mode');
          document.documentElement.classList.add('admin-mode');
          loadData();
          if(window.spaGo) window.spaGo('admin', true);
          else window.location.hash = 'admin';
          adminNavigate('overview');
          
          btn.innerText = 'Sign In';
        } catch(err) {
          errEl.innerText = err.message;
          loginForm.querySelector('.admin-login-btn').innerText = 'Sign In';
        }
      });
    }
    
    // Logout
    if(getEl('adminLogout')) {
      getEl('adminLogout').addEventListener('click', logout);
    }
    
    // Sidebar Nav
    document.querySelectorAll('.admin-nav a[data-admin-page]').forEach(a => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        adminNavigate(a.getAttribute('data-admin-page'));
      });
    });
    
    // Mobile Menu
    if(getEl('adminMenuToggle')) {
      getEl('adminMenuToggle').addEventListener('click', () => {
        getEl('adminSidebar').classList.add('open');
      });
    }
    if(getEl('adminSidebarClose')) {
      getEl('adminSidebarClose').addEventListener('click', () => {
        getEl('adminSidebar').classList.remove('open');
      });
    }
    
    // Modals
    document.querySelectorAll('.admin-modal-close').forEach(btn => {
      btn.addEventListener('click', () => {
        btn.closest('.admin-modal-overlay').classList.remove('active');
      });
    });

    // Home Page Edit Listeners
    if(getEl('adminSaveHomeIntroText')) {
      getEl('adminSaveHomeIntroText').addEventListener('click', () => {
        let en = getEl('adminHomeIntroTextEn').innerHTML || '';
        let ar = getEl('adminHomeIntroTextAr').innerHTML || '';

        // Standardize <b> or <strong> to <em>
        en = en.replace(/<\/?(b|strong)>/gi, function(match) { return match.indexOf('/') !== -1 ? '</em>' : '<em>'; });
        ar = ar.replace(/<\/?(b|strong)>/gi, function(match) { return match.indexOf('/') !== -1 ? '</em>' : '<em>'; });

        // Strip unexpected HTML tags except <em> and </em>
        en = en.replace(/<(?!\/?em>)[^>]+>/gi, '');
        ar = ar.replace(/<(?!\/?em>)[^>]+>/gi, '');

        if(!en.trim()) return showToast('Please enter English text', 'error');
        saveHomeIntroText({ en: en.trim(), ar: ar.trim() || en.trim() });
        showToast('Intro text saved globally!');
      });
    }
    if(getEl('introTextBoldBtnEn')) getEl('introTextBoldBtnEn').addEventListener('click', () => wrapSelectionBold('adminHomeIntroTextEn'));
    if(getEl('introTextNormalBtnEn')) getEl('introTextNormalBtnEn').addEventListener('click', () => unwrapSelectionBold('adminHomeIntroTextEn'));
    if(getEl('introTextBoldBtnAr')) getEl('introTextBoldBtnAr').addEventListener('click', () => wrapSelectionBold('adminHomeIntroTextAr'));
    if(getEl('introTextNormalBtnAr')) getEl('introTextNormalBtnAr').addEventListener('click', () => unwrapSelectionBold('adminHomeIntroTextAr'));
    if(getEl('adminAddHomeSvcBtn')) getEl('adminAddHomeSvcBtn').addEventListener('click', () => openHomeSvcModal(-1));
    if(getEl('adminSaveHomeSvc')) {
      getEl('adminSaveHomeSvc').addEventListener('click', () => {
        const index = parseInt(getEl('adminHomeSvcEditIndex').value);
        const icon = getEl('adminHomeSvcIcon').value;
        const titleEn = getEl('adminHomeSvcTitleEn').value;
        const titleAr = getEl('adminHomeSvcTitleAr').value;
        const descEn = getEl('adminHomeSvcDescEn').value;
        const descAr = getEl('adminHomeSvcDescAr').value;
        if(!titleEn) return showToast('Please enter a title', 'error');
        const services = loadHomeServices();
        const svc = { icon, titleEn, titleAr: titleAr || titleEn, descEn, descAr: descAr || descEn };
        if (index >= 0) services[index] = svc;
        else services.push(svc);
        saveHomeServices(services);
        renderHomeServicesList();
        getEl('adminHomeSvcModal').classList.remove('active');
        showToast(index >= 0 ? 'Service card updated globally!' : 'Service card added globally!');
      });
    }

    // Training Pages Listeners
    if(getEl('adminSaveTrainingPage')) getEl('adminSaveTrainingPage').addEventListener('click', saveTrainingMain);
    if(getEl('adminAddTrainingVideoBtn')) getEl('adminAddTrainingVideoBtn').addEventListener('click', () => openTrainingVideoModal(-1));
    if(getEl('adminSaveTrainingVideo')) getEl('adminSaveTrainingVideo').addEventListener('click', saveTrainingVideo);
    
    if(getEl('adminAddTrainingBullet')) {
      getEl('adminAddTrainingBullet').addEventListener('click', () => {
        const index = parseInt(getEl('adminTrainingBulletEditIndex').value);
        const en = getEl('adminTrainingBulletEn').value;
        const ar = getEl('adminTrainingBulletAr').value;
        if(!en || !ar) return showToast('Please enter both English and Arabic bullets', true);
        const d = loadTrainingData();
        
        if (index >= 0) {
          d.bullets[index] = { en, ar };
        } else {
          d.bullets.push({ en, ar });
        }
        
        saveTrainingData(d);
        renderTrainingBullets();
        getEl('adminTrainingBulletEditIndex').value = '-1';
        getEl('adminTrainingBulletBtnText').innerText = 'Add';
        getEl('adminTrainingBulletEn').value = '';
        getEl('adminTrainingBulletAr').value = '';
        showToast(index >= 0 ? 'Bullet updated' : 'Bullet added');
      });
    }

    if(getEl('adminAddTrainingStat')) {
      getEl('adminAddTrainingStat').addEventListener('click', () => {
        const index = parseInt(getEl('adminTrainingStatEditIndex').value);
        const target = getEl('adminTrainingStatTarget').value;
        const suffix = getEl('adminTrainingStatSuffix').value;
        const val = getEl('adminTrainingStatValue').value;
        const labelEn = getEl('adminTrainingStatLabelEn').value;
        const labelAr = getEl('adminTrainingStatLabelAr').value;
        if(!labelEn || !labelAr) return showToast('Please enter both labels', true);
        const d = loadTrainingData();
        
        let statObj = { labelEn, labelAr };
        if(target !== '') {
          statObj.target = parseInt(target);
          statObj.suffix = suffix;
        } else {
          statObj.value = val;
        }
        
        if (index >= 0) {
          d.stats[index] = statObj;
        } else {
          d.stats.push(statObj);
        }
        
        saveTrainingData(d);
        renderTrainingStats();
        getEl('adminTrainingStatEditIndex').value = '-1';
        getEl('adminTrainingStatBtnText').innerText = 'Add';
        getEl('adminTrainingStatTarget').value = '';
        getEl('adminTrainingStatSuffix').value = '';
        getEl('adminTrainingStatValue').value = '';
        getEl('adminTrainingStatLabelEn').value = '';
        getEl('adminTrainingStatLabelAr').value = '';
        showToast(index >= 0 ? 'Stat updated' : 'Stat added');
      });
    }

    // Mentor Section Listeners
    if(getEl('adminAddMentorPhotoBtn')) {
      getEl('adminAddMentorPhotoBtn').addEventListener('click', () => {
        const urlInput = getEl('adminMentorPhotoUrl');
        const url = urlInput ? urlInput.value.trim() : '';
        if(!url) return showToast('Please enter an Image URL or choose a file', true);
        const d = loadTrainingData();
        d.whoIsMentor = d.whoIsMentor || {};
        d.whoIsMentor.photos = d.whoIsMentor.photos || [];
        d.whoIsMentor.photos.push(url);
        saveTrainingData(d);
        renderAdminMentorPhotos();
        if(urlInput) urlInput.value = '';
        showToast('Mentor photo added globally');
      });
    }

    if(getEl('adminMentorPhotoFile')) {
      getEl('adminMentorPhotoFile').addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if(!file) return;
        const reader = new FileReader();
        reader.onload = function(evt) {
          const dataUrl = evt.target.result;
          const d = loadTrainingData();
          d.whoIsMentor = d.whoIsMentor || {};
          d.whoIsMentor.photos = d.whoIsMentor.photos || [];
          d.whoIsMentor.photos.push(dataUrl);
          saveTrainingData(d);
          renderAdminMentorPhotos();
          showToast('Mentor photo uploaded and saved globally');
        };
        reader.readAsDataURL(file);
      });
    }

    // Home Page Picture Listeners
    let tempHomePhotoFile = null;
    let tempHomePhotoPreview = null;
    if(getEl('adminHomePhotoInput')) {
      getEl('adminHomePhotoInput').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if(!file) return;
        tempHomePhotoFile = file;
        // Show local preview immediately
        const reader = new FileReader();
        reader.onload = (ev) => {
          tempHomePhotoPreview = ev.target.result;
          getEl('adminHomePhotoPreview').src = tempHomePhotoPreview;
        };
        reader.readAsDataURL(file);
      });
    }
    if(getEl('adminHomePhotoSaveBtn')) {
      getEl('adminHomePhotoSaveBtn').addEventListener('click', async () => {
        if (tempHomePhotoFile) {
          try {
            getEl('adminHomePhotoSaveBtn').disabled = true;
            showToast('Compressing and saving photo...');
            
            // Compress image to reduce size
            const dataURL = await compressImage(tempHomePhotoFile, 1200, 0.7);
            
            // Save directly to Firebase Realtime Database
            await window.kaDatabase.ref('data/ka_admin_home_photo').set(dataURL);
            
            // Dynamically update frontend
            const photoBg = document.querySelector('.hero-image .photo-bg');
            if (photoBg) {
              photoBg.style.backgroundImage = 'url(' + dataURL + ')';
            }
            
            showToast('Home photo saved successfully!');
          } catch (e) {
            console.error('Storage error:', e);
            if (e.code === 'PERMISSION_DENIED' || (e.message && e.message.includes('PERMISSION_DENIED'))) {
              showToast('Permission denied! Go to Firebase Console → Realtime Database → Rules and set .read and .write to true', 'error');
            } else {
              showToast('Upload failed: ' + e.message, 'error');
            }
          } finally {
            getEl('adminHomePhotoSaveBtn').disabled = false;
          }
        } else {
          showToast('Please select a photo first');
        }
      });
    }
    if(getEl('adminHomePhotoRemoveBtn')) {
      getEl('adminHomePhotoRemoveBtn').addEventListener('click', async () => {
        getEl('adminHomePhotoPreview').src = 'correct-photo.jpeg';
        tempHomePhoto = null;
        
        // Remove from Firebase Realtime Database
        await window.kaDatabase.ref('data/ka_admin_home_photo').remove();
        
        // Dynamically update frontend back to default
        const photoBg = document.querySelector('.hero-image .photo-bg');
        if (photoBg) {
          photoBg.style.backgroundImage = ''; 
        }
        
        showToast('Home photo removed. Reverted to default.');
      });
    }
    // Load home photo from Firebase Realtime Database for admin preview
    if(getEl('adminHomePhotoPreview')) {
      window.kaDatabase.ref('data/ka_admin_home_photo').once('value').then((snapshot) => {
        const savedPhoto = snapshot.val();
        if (savedPhoto) {
          getEl('adminHomePhotoPreview').src = savedPhoto;
        }
      });
    }
    
    // Feedback Listeners
    if(getEl('adminAddReview')) getEl('adminAddReview').addEventListener('click', () => openReviewModal(currentFeedbackTab));
    if(getEl('adminSaveReview')) getEl('adminSaveReview').addEventListener('click', saveReview);
    document.querySelectorAll('.admin-tab[data-feedback-tab]').forEach(t => {
      t.addEventListener('click', () => switchFeedbackTab(t.getAttribute('data-feedback-tab')));
    });
    
    // Works Listeners
    if(getEl('adminWorksCategory')) {
       getEl('adminWorksCategory').addEventListener('change', (e) => {
         currentWorksCategory = e.target.value;
         renderWorks(currentWorksCategory);
       });
    }
    if(getEl('adminAddWork')) getEl('adminAddWork').addEventListener('click', addWork);
    
    // Provided Services Listeners
    if(getEl('adminProvidedCategory')) {
       getEl('adminProvidedCategory').addEventListener('change', (e) => {
         currentProvidedCategory = e.target.value;
         renderProvidedServices(currentProvidedCategory);
       });
    }
    
    if(getEl('adminWorkUpload')) {
       getEl('adminWorkUpload').addEventListener('change', async (e) => {
         const file = e.target.files[0];
         if(!file) return;
         try {
           getEl('adminWorkProgress').style.display = 'block';
           getEl('adminWorkProgress').innerText = 'Uploading... 0%';
           const btnLabel = document.querySelector('label[for="adminWorkUpload"]');
           if(btnLabel) btnLabel.style.opacity = '0.5';
           
           getEl('adminWorkProgress').innerText = 'Compressing...';
           const downloadURL = await compressImage(file, 1200, 0.7);
           
           getEl('adminWorkUrl').value = downloadURL;
           getEl('adminWorkProgress').innerText = 'Upload complete! Click Add Item.';
           setTimeout(() => getEl('adminWorkProgress').style.display = 'none', 3000);
           
         } catch (err) {
           console.error('Upload error:', err);
           showToast('Upload failed! Could not read the selected file.', 'error');
           getEl('adminWorkProgress').style.display = 'none';
         } finally {
           const btnLabel = document.querySelector('label[for="adminWorkUpload"]');
           if(btnLabel) btnLabel.style.opacity = '1';
           getEl('adminWorkUpload').value = ''; // Reset input
         }
       });
    }
    if(getEl('adminProvidedUpload')) {
       getEl('adminProvidedUpload').addEventListener('change', async (e) => {
         const file = e.target.files[0];
         if(!file) return;
         try {
           getEl('adminProvidedProgress').style.display = 'block';
           getEl('adminProvidedProgress').innerText = 'Uploading... 0%';
           const btnLabel = document.querySelector('label[for="adminProvidedUpload"]');
           if(btnLabel) btnLabel.style.opacity = '0.5';
           
           getEl('adminProvidedProgress').innerText = 'Compressing...';
           const downloadURL = await compressImage(file, 1200, 0.7);
           
           getEl('adminProvidedUrl').value = downloadURL;
           getEl('adminProvidedProgress').innerText = 'Upload complete! Click Add Item.';
           setTimeout(() => getEl('adminProvidedProgress').style.display = 'none', 3000);
           
         } catch (err) {
           console.error('Upload error:', err);
           showToast('Upload failed! Could not read the selected file.', 'error');
           getEl('adminProvidedProgress').style.display = 'none';
         } finally {
           const btnLabel = document.querySelector('label[for="adminProvidedUpload"]');
           if(btnLabel) btnLabel.style.opacity = '1';
           getEl('adminProvidedUpload').value = ''; // Reset input
         }
       });
    }
    if(getEl('adminAddProvided')) getEl('adminAddProvided').addEventListener('click', addProvidedService);
    
    // 3rd Line Toggle Listener
    if(getEl('adminProvidedThirdLine')) {
      getEl('adminProvidedThirdLine').addEventListener('change', (e) => {
        localStorage.setItem(STORAGE_KEYS.PROVIDED_THIRD_LINE, e.target.checked ? 'true' : 'false');
        if (typeof window.renderFrontendProvidedServices === 'function') {
          window.renderFrontendProvidedServices(currentProvidedCategory);
        }
        showToast(e.target.checked ? '3rd row enabled' : '3rd row disabled');
      });
    }

    // Save Edit Text Listener
    if(getEl('adminSaveProvidedDividerText')) {
      getEl('adminSaveProvidedDividerText').addEventListener('click', () => {
        const d1En = getEl('adminProvidedDivider1En').value.trim() || 'not just look pretty.';
        const d1Ar = getEl('adminProvidedDivider1Ar').value.trim() || 'مش بس يبقى جميل.';
        const d2En = getEl('adminProvidedDivider2En').value.trim() || d1En;
        const d2Ar = getEl('adminProvidedDivider2Ar').value.trim() || d1Ar;

        localStorage.setItem(STORAGE_KEYS.PROVIDED_DIVIDER1_EN, d1En);
        localStorage.setItem(STORAGE_KEYS.PROVIDED_DIVIDER1_AR, d1Ar);
        localStorage.setItem(STORAGE_KEYS.PROVIDED_DIVIDER2_EN, d2En);
        localStorage.setItem(STORAGE_KEYS.PROVIDED_DIVIDER2_AR, d2Ar);

        if (typeof window.renderFrontendProvidedServices === 'function') {
          window.renderFrontendProvidedServices(currentProvidedCategory);
        }
        showToast('Text updated successfully');
      });
    }
    
    // Map & Stats Listeners
    if(getEl('adminSaveReview')) getEl('adminSaveReview').addEventListener('click', saveReview);
    if(getEl('adminSaveIntro')) getEl('adminSaveIntro').addEventListener('click', saveIntro);
    if(getEl('adminAddCountry')) getEl('adminAddCountry').addEventListener('click', addCountry);
    if(getEl('adminSaveProjects')) getEl('adminSaveProjects').addEventListener('click', () => saveStats('projects'));
    if(getEl('adminSaveCountries')) getEl('adminSaveCountries').addEventListener('click', () => saveStats('countries'));
    if(getEl('adminSaveClients')) getEl('adminSaveClients').addEventListener('click', () => saveStats('clients'));

    // Analytics Listeners
    document.querySelectorAll('.admin-analytics-tab[data-analytics-tab]').forEach(t => {
      t.addEventListener('click', () => {
        currentAnalyticsTab = t.getAttribute('data-analytics-tab');
        renderAnalyticsPage();
      });
    });
    if(getEl('addViewerBtn')) getEl('addViewerBtn').addEventListener('click', () => addAnalyticsEntry('viewers'));
    if(getEl('addClickBtn')) getEl('addClickBtn').addEventListener('click', () => addAnalyticsEntry('clicks'));
    if(getEl('addContactBtn')) getEl('addContactBtn').addEventListener('click', () => addAnalyticsEntry('contacts'));
    
    // Settings Listeners
    if(getEl('settingsUpdateCreds')) getEl('settingsUpdateCreds').addEventListener('click', updateCredentials);
    if(getEl('settingsSaveContact')) {
      getEl('settingsSaveContact').addEventListener('click', () => {
        const s = getSettings();
        s.whatsapp = getEl('settingsWhatsapp').value;
        s.email = getEl('settingsEmail').value;
        s.calendly = getEl('settingsCalendly').value;
        saveSettings(s);
        showToast('Contact settings saved');
      });
    }
    if(getEl('settingsSaveSocial')) {
      getEl('settingsSaveSocial').addEventListener('click', () => {
        const s = getSettings();
        s.instagram = getEl('settingsInstagram').value;
        s.linkedin = getEl('settingsLinkedin').value;
        s.youtube = getEl('settingsYoutube').value;
        s.facebook = getEl('settingsFacebook').value;
        s.tiktok = getEl('settingsTiktok') ? getEl('settingsTiktok').value : '';
        saveSettings(s);
        showToast('Social links saved');
      });
    }
    if(getEl('settingsExport')) getEl('settingsExport').addEventListener('click', exportAllData);
    if(getEl('settingsImport')) getEl('settingsImport').addEventListener('click', () => getEl('settingsImportFile').click());
    if(getEl('settingsImportFile')) {
      getEl('settingsImportFile').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if(!file) return;
        const reader = new FileReader();
        reader.onload = (e) => importData(e.target.result);
        reader.readAsText(file);
      });
    }
    if(getEl('settingsReset')) {
      getEl('settingsReset').addEventListener('click', async () => {
        const ok = await showConfirm('Reset All Data', 'Are you ABSOLUTELY sure? This deletes all custom admin data.');
        if(ok) {
           ['CLIENT_REVIEWS', 'STUDENT_REVIEWS', 'WORKS', 'ANALYTICS', 'SETTINGS'].forEach(k => {
             localStorage.removeItem(STORAGE_KEYS[k]);
           });
           showToast('All admin data reset');
           setTimeout(() => window.location.reload(), 1000);
        }
      });
    }

    // Expose needed functions globally for inline handlers
    window.adminApp = window.adminApp || {};
    Object.assign(window.adminApp, {
      reloadAndRender: function() {
        loadData();
        const activeNav = document.querySelector('.admin-nav a.active');
        const page = activeNav ? activeNav.getAttribute('data-admin-page') : 'overview';
        adminNavigate(page || 'overview');
      },
      editIntro: (idx) => openIntroModal(idx),
      editReview: (type, idx) => openReviewModal(type, idx),
      deleteReview,
      deleteWork,
      editWork,
      saveEditWork,
      cancelEditWork,
      deleteProvided: deleteProvidedService,
      deleteProvidedRow3: deleteProvidedServiceRow3,
      deleteCountry,
      deleteAnalyticsEntry,
      editHomeSvc: openHomeSvcModal,
      deleteHomeSvc: async function(index) {
        const ok = await showConfirm('Delete Card', 'Are you sure you want to delete this service card?');
        if(!ok) return;
        const services = loadHomeServices();
        services.splice(index, 1);
        saveHomeServices(services);
        renderHomeServicesList();
        showToast('Service card deleted');
      }
    });
    
    // Set user display
    const credsStr = localStorage.getItem(STORAGE_KEYS.CREDS);
    if(credsStr && getEl('adminUserDisplay')) {
      getEl('adminUserDisplay').innerText = JSON.parse(credsStr).username;
    }
    
    // Check initial hash route
    function handleHashRoute() {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'admin' || hash === 'admin-login') {
         if (isAuthenticated()) {
           if (window.spaGo) window.spaGo('admin', true);
           document.body.classList.add('admin-mode');
           document.documentElement.classList.add('admin-mode');
           adminNavigate('overview');
         } else {
           if (window.spaGo) window.spaGo('admin-login', true);
         }
      }
    }
    
    handleHashRoute();
    window.addEventListener('hashchange', handleHashRoute);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdmin);
  } else {
    initAdmin();
  }
})();
