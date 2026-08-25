// ================================
// Analytics scaffold
// ================================
// Pushes events to window.dataLayer so a GTM/GA4/PostHog container can pick
// them up later without touching this file again. No analytics vendor is
// wired in yet — this only fires when analytics cookies have been accepted.
window.dataLayer = window.dataLayer || [];

function analyticsAllowed() {
    try {
        const consent = JSON.parse(localStorage.getItem('cookieConsent') || 'null');
        return !!(consent && consent.analytics);
    } catch {
        return false;
    }
}

function trackEvent(name, params) {
    if (!analyticsAllowed()) return;
    window.dataLayer.push(Object.assign({ event: name }, params || {}));
}

// UTM / acquisition capture (stored once per session, sent with the lead form)
function captureAcquisition() {
    const params = new URLSearchParams(window.location.search);
    const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
    const existing = sessionStorage.getItem('ta_acquisition');
    if (existing) return JSON.parse(existing);

    const data = {};
    keys.forEach((k) => {
        if (params.get(k)) data[k] = params.get(k);
    });
    sessionStorage.setItem('ta_acquisition', JSON.stringify(data));
    return data;
}

captureAcquisition();
trackEvent('landing_page_visit', captureAcquisition());

// CTA click tracking (any element with data-track)
document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-track]');
    if (el) trackEvent('cta_click', { cta_id: el.dataset.track, cta_label: el.textContent.trim() });
});

// Scroll depth tracking (25/50/75/100%)
(function scrollDepthTracker() {
    const thresholds = [25, 50, 75, 100];
    const fired = new Set();
    let ticking = false;

    function check() {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const pct = docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0;
        thresholds.forEach((t) => {
            if (pct >= t && !fired.has(t)) {
                fired.add(t);
                trackEvent('scroll_depth', { percent: t });
            }
        });
        ticking = false;
    }

    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(check);
            ticking = true;
        }
    }, { passive: true });
})();

// ================================
// A/B testing scaffold (headline + CTA copy)
// ================================
const TA_VARIANTS = {
    headline: {
        A: 'Create your next language lesson in seconds.',
        B: 'Stop spending hours preparing language lessons.',
        C: 'Your next lesson is only a prompt away.',
        D: 'Turn your lesson idea into a PowerPoint in seconds.',
    },
    cta: {
        A: 'Get Early Access',
        B: 'Create Your First Lesson',
        C: 'Try Teacher Assistant',
    },
};

function pickVariant(group) {
    const params = new URLSearchParams(window.location.search);
    const forced = params.get('ta_' + group);
    if (forced && TA_VARIANTS[group][forced]) return forced;

    const storageKey = 'ta_variant_' + group;
    const stored = localStorage.getItem(storageKey);
    if (stored && TA_VARIANTS[group][stored]) return stored;

    const keys = Object.keys(TA_VARIANTS[group]);
    const assigned = keys[Math.floor(Math.random() * keys.length)];
    localStorage.setItem(storageKey, assigned);
    return assigned;
}

function applyVariants() {
    const headlineVariant = pickVariant('headline');
    const ctaVariant = pickVariant('cta');

    // Headline variant only swaps the lead sentence; "Not hours. Seconds."
    // sub-line stays fixed as the emotional payoff across all variants.
    if (headlineVariant !== 'A') {
        const headlineEl = document.getElementById('heroHeadline');
        if (headlineEl) {
            headlineEl.innerHTML = `${TA_VARIANTS.headline[headlineVariant]}<br><span class="hero-highlight">Not hours. Seconds.</span>`;
        }
    }

    if (ctaVariant !== 'A') {
        const label = TA_VARIANTS.cta[ctaVariant];
        document.querySelectorAll('[data-ab-cta]').forEach((el) => {
            el.textContent = label;
        });
    }

    trackEvent('experiment_view', { headline_variant: headlineVariant, cta_variant: ctaVariant });
}

applyVariants();

// ================================
// Header scroll shadow
// ================================
(function headerScrollShadow() {
    const header = document.querySelector('.header');
    if (!header) return;
    const update = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
    update();
    window.addEventListener('scroll', update, { passive: true });
})();

// ================================
// Mobile navigation
// ================================
const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
const mobileNav = document.getElementById('mobileNav');

if (mobileMenuBtn && mobileNav) {
    mobileMenuBtn.addEventListener('click', () => {
        mobileMenuBtn.classList.toggle('active');
        mobileNav.classList.toggle('active');
    });

    mobileNav.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => {
            mobileMenuBtn.classList.remove('active');
            mobileNav.classList.remove('active');
        });
    });
}

// ================================
// Hero product mockup animation
// ================================
(function heroMockup() {
    const promptEl = document.getElementById('mockupPrompt');
    const optionsEl = document.getElementById('mockupOptions');
    const levelEl = document.getElementById('mockupLevel');
    const topicEl = document.getElementById('mockupTopic');
    const typeEl = document.getElementById('mockupType');
    const generateBtn = document.getElementById('mockupGenerateBtn');
    const spinnerEl = document.getElementById('mockupSpinner');
    const slidesEl = document.getElementById('mockupSlides');
    const inputPanel = document.getElementById('mockupInputPanel');

    if (!promptEl || !generateBtn) return;

    const examples = [
        {
            prompt: 'Create a B1 English lesson about travelling.',
            level: 'B1', topic: 'Travelling', type: 'Vocabulary + Speaking',
            slides: ['Travel Vocabulary', 'Match the Words', 'Discussion Questions', 'Speaking Activity', 'Review'],
        },
        {
            prompt: 'Create a B2 German lesson about climate change.',
            level: 'B2', topic: 'Climate Change', type: 'Reading + Discussion',
            slides: ['Key Vocabulary', 'Reading Passage', 'Comprehension Check', 'Discussion Questions', 'Wrap-Up'],
        },
        {
            prompt: 'Create an A2 Spanish lesson on daily routines.',
            level: 'A2', topic: 'Daily Routines', type: 'Grammar + Practice',
            slides: ['Present Tense Verbs', 'Example Sentences', 'Fill in the Blanks', 'Pair Practice', 'Review'],
        },
    ];

    let exampleIndex = 0;
    let timer = null;

    function typeInto(el, text, speed, onDone) {
        let i = 0;
        el.textContent = '';
        (function step() {
            if (i <= text.length) {
                el.textContent = text.slice(0, i);
                i++;
                timer = setTimeout(step, speed);
            } else if (onDone) {
                onDone();
            }
        })();
    }

    function resetSlides() {
        slidesEl.innerHTML = '';
        slidesEl.hidden = true;
        inputPanel.hidden = false;
        optionsEl.classList.remove('is-visible');
        generateBtn.classList.remove('is-visible', 'is-loading');
        spinnerEl.hidden = true;
    }

    function buildSlides(titles) {
        slidesEl.innerHTML = titles.map((title, i) => `
            <div class="mockup-slide">
                <span class="mockup-slide-index">${i + 1}</span>
                <span class="mockup-slide-title">${title}</span>
            </div>
        `).join('');
    }

    function runCycle() {
        const example = examples[exampleIndex % examples.length];
        exampleIndex++;

        resetSlides();
        levelEl.textContent = example.level;
        topicEl.textContent = example.topic;
        typeEl.textContent = example.type;

        typeInto(promptEl, example.prompt, 42, () => {
            timer = setTimeout(() => {
                optionsEl.classList.add('is-visible');
                generateBtn.classList.add('is-visible');

                timer = setTimeout(() => {
                    generateBtn.classList.add('is-loading');
                    spinnerEl.hidden = false;

                    timer = setTimeout(() => {
                        inputPanel.hidden = true;
                        slidesEl.hidden = false;
                        buildSlides(example.slides);

                        requestAnimationFrame(() => {
                            slidesEl.querySelectorAll('.mockup-slide').forEach((slide, i) => {
                                setTimeout(() => slide.classList.add('is-visible'), i * 120);
                            });
                        });

                        timer = setTimeout(runCycle, 4200);
                    }, 1100);
                }, 900);
            }, 500);
        });
    }

    // Respect users who've asked for less motion: show a static first example.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        const example = examples[0];
        promptEl.textContent = example.prompt;
        levelEl.textContent = example.level;
        topicEl.textContent = example.topic;
        typeEl.textContent = example.type;
        optionsEl.classList.add('is-visible');
        generateBtn.classList.add('is-visible');
        return;
    }

    runCycle();
})();

// ================================
// FAQ accordion
// ================================
document.querySelectorAll('.faq-item').forEach((item) => {
    const question = item.querySelector('.faq-question');
    if (!question) return;
    question.addEventListener('click', () => {
        const isActive = item.classList.contains('active');
        document.querySelectorAll('.faq-item.active').forEach((i) => {
            i.classList.remove('active');
            i.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
        });
        if (!isActive) {
            item.classList.add('active');
            question.setAttribute('aria-expanded', 'true');
            trackEvent('faq_interaction', { question: question.textContent.trim() });
        }
    });
});

// ================================
// Vimeo playlist (desktop only, product showcase section)
// ================================
const vimeoPlaylist = [1186039329, 1186040172];
let vimeoIndex = 0;

const vimeoIframe = document.getElementById('vimeo-player');
if (vimeoIframe && window.innerWidth >= 768) {
    vimeoIframe.src = vimeoIframe.dataset.src;

    const vimeoPlayer = new Vimeo.Player(vimeoIframe);
    let trackedPlay = false;

    vimeoPlayer.ready().then(function () {
        vimeoPlayer.setPlaybackRate(4);
    });

    vimeoPlayer.on('play', function () {
        if (!trackedPlay) {
            trackedPlay = true;
            trackEvent('product_demo_play');
        }
    });

    vimeoPlayer.on('ended', function () {
        vimeoIndex = (vimeoIndex + 1) % vimeoPlaylist.length;
        vimeoPlayer.loadVideo(vimeoPlaylist[vimeoIndex]).then(function () {
            vimeoPlayer.setPlaybackRate(4);
            vimeoPlayer.play();
        });
    });
}

// ================================
// Cookie Consent
// ================================
const cookieBanner = document.getElementById('cookieBanner');
const cookieModal = document.getElementById('cookieModal');
const cookieAccept = document.getElementById('cookieAccept');
const cookieReject = document.getElementById('cookieReject');
const cookieSettings = document.getElementById('cookieSettings');
const cookieModalClose = document.getElementById('cookieModalClose');
const cookieModalSave = document.getElementById('cookieModalSave');
const cookieModalReject = document.getElementById('cookieModalReject');
const footerCookieSettings = document.getElementById('footerCookieSettings');
const analyticsCookies = document.getElementById('analyticsCookies');
const marketingCookies = document.getElementById('marketingCookies');

function checkCookieConsent() {
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
        cookieBanner.classList.add('show');
    }
}

function saveCookiePreferences(analytics, marketing) {
    const preferences = {
        essential: true,
        analytics: analytics,
        marketing: marketing,
        timestamp: new Date().toISOString(),
    };
    localStorage.setItem('cookieConsent', JSON.stringify(preferences));
    cookieBanner.classList.remove('show');
    cookieModal.classList.remove('show');
}

if (cookieAccept) {
    cookieAccept.addEventListener('click', () => saveCookiePreferences(true, true));
}

if (cookieReject) {
    cookieReject.addEventListener('click', () => saveCookiePreferences(false, false));
}

if (cookieSettings) {
    cookieSettings.addEventListener('click', () => cookieModal.classList.add('show'));
}

if (cookieModalClose) {
    cookieModalClose.addEventListener('click', () => cookieModal.classList.remove('show'));
}

if (cookieModalSave) {
    cookieModalSave.addEventListener('click', () => {
        saveCookiePreferences(
            analyticsCookies ? analyticsCookies.checked : false,
            marketingCookies ? marketingCookies.checked : false
        );
    });
}

if (cookieModalReject) {
    cookieModalReject.addEventListener('click', () => saveCookiePreferences(false, false));
}

if (footerCookieSettings) {
    footerCookieSettings.addEventListener('click', (e) => {
        e.preventDefault();
        const consent = localStorage.getItem('cookieConsent');
        if (consent) {
            const prefs = JSON.parse(consent);
            if (analyticsCookies) analyticsCookies.checked = prefs.analytics;
            if (marketingCookies) marketingCookies.checked = prefs.marketing;
        }
        cookieModal.classList.add('show');
    });
}

if (cookieModal) {
    cookieModal.addEventListener('click', (e) => {
        if (e.target === cookieModal) cookieModal.classList.remove('show');
    });
}

checkCookieConsent();

// ================================
// Trial Signup Modal + qualification survey
// ================================
const trialModal = document.getElementById('trialModal');
const trialModalClose = document.getElementById('trialModalClose');
const trialForm = document.getElementById('trialForm');
const trialFormError = document.getElementById('trialFormError');
const trialSuccess = document.getElementById('trialSuccess');
const trialSuccessEmail = document.getElementById('trialSuccessEmail');
const trialReset = document.getElementById('trialReset');
const trialFormWrap = document.getElementById('trialFormWrap');
const trialSurvey = document.getElementById('trialSurvey');
const trialSurveySkip = document.getElementById('trialSurveySkip');
const trialSurveyThanks = document.getElementById('trialSurveyThanks');

const trialFields = {
    name: {
        input: document.getElementById('trialName'),
        error: document.getElementById('trial-err-name'),
    },
    email: {
        input: document.getElementById('trialEmail'),
        error: document.getElementById('trial-err-email'),
    },
};

// Holds the lead's identity so the (optional) qualification survey can be
// sent as a follow-up message to the same web-compose contact endpoint.
let leadContext = { name: '', email: '' };
const surveyAnswers = {};
const surveySteps = ['level', 'prep-time', 'wants'];

function validateTrialField(key) {
    const { input, error } = trialFields[key];
    const val = input.value.trim();
    let msg = '';

    if (key === 'name') {
        if (!val) msg = 'Your first name is required.';
        else if (val.length > 100) msg = 'Name must be 100 characters or fewer.';
    } else if (key === 'email') {
        if (!val) msg = 'Email address is required.';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) msg = 'Enter a valid email address.';
    }

    const valid = msg === '';
    error.textContent = msg;
    input.classList.toggle('is-invalid', !valid);
    error.classList.toggle('is-visible', !valid);
    return valid;
}

let formStarted = false;
if (trialFields.name.input) {
    Object.keys(trialFields).forEach((key) => {
        trialFields[key].input.addEventListener('blur', () => validateTrialField(key));
        trialFields[key].input.addEventListener('input', () => {
            if (!formStarted) {
                formStarted = true;
                trackEvent('form_started');
            }
            if (trialFields[key].input.classList.contains('is-invalid')) validateTrialField(key);
        });
    });
}

function resetSurvey() {
    Object.keys(surveyAnswers).forEach((k) => delete surveyAnswers[k]);
    if (trialSurvey) trialSurvey.hidden = false;
    if (trialSurveyThanks) trialSurveyThanks.hidden = true;
    if (trialSurveySkip) trialSurveySkip.hidden = false;
    document.querySelectorAll('.trial-survey-step').forEach((step, i) => {
        step.hidden = i !== 0;
    });
    document.querySelectorAll('.trial-chip.is-selected').forEach((chip) => chip.classList.remove('is-selected'));
}

function resetTrialModal() {
    if (trialFormWrap) trialFormWrap.hidden = false;
    if (trialSuccess) trialSuccess.hidden = true;
    if (trialFormError) trialFormError.hidden = true;
    resetSurvey();
}

function openTrialModal() {
    if (trialModal) {
        resetTrialModal();
        trialModal.classList.add('show');
        document.body.style.overflow = 'hidden';
        trackEvent('trial_modal_open');
    }
}

function closeTrialModal() {
    if (trialModal) {
        trialModal.classList.remove('show');
        document.body.style.overflow = '';
    }
}

function showTrialSuccess(email) {
    if (trialForm) trialForm.reset();
    Object.keys(trialFields).forEach((key) => {
        if (trialFields[key].input) {
            trialFields[key].input.classList.remove('is-invalid');
            trialFields[key].error.classList.remove('is-visible');
            trialFields[key].error.textContent = '';
        }
    });
    if (trialFormWrap) trialFormWrap.hidden = true;
    if (trialSuccessEmail) trialSuccessEmail.textContent = email;
    if (trialSuccess) trialSuccess.hidden = false;
    trackEvent('email_submitted');
}

async function sendContact(payload) {
    return fetch('https://web-compose.onrender.com/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
}

document.querySelectorAll('[data-open-trial]').forEach((button) => {
    button.addEventListener('click', (e) => {
        e.preventDefault();
        openTrialModal();
    });
});

// Fallback for early-access-style CTAs that predate the data-open-trial hook.
document.querySelectorAll('.btn-primary').forEach((button) => {
    if (button.hasAttribute('data-open-trial') || button.closest('#trialModal')) return;
    const label = button.textContent.trim().toLowerCase();
    const opensTrial = label.includes('early access') || label.includes('first lesson') || label.includes('try teacher assistant');
    if (opensTrial) {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            openTrialModal();
        });
    }
});

if (trialModalClose) trialModalClose.addEventListener('click', closeTrialModal);

if (trialModal) {
    trialModal.addEventListener('click', (e) => {
        if (e.target === trialModal) closeTrialModal();
    });
}

if (trialReset) trialReset.addEventListener('click', resetTrialModal);

if (trialForm) {
    trialForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (trialFormError) trialFormError.hidden = true;

        const allValid = Object.keys(trialFields).map(validateTrialField).every(Boolean);
        if (!allValid) return;

        const submitBtn = trialForm.querySelector('[type="submit"]');
        const originalLabel = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending…';

        const name = trialFields.name.input.value.trim();
        const email = trialFields.email.input.value.trim();
        const languageEl = document.getElementById('trialLanguage');
        const language = languageEl ? languageEl.value : '';
        const acquisition = captureAcquisition();

        leadContext = { name, email };

        let message = 'Free trial signup request.';
        if (language) message += `\nLanguage taught: ${language}`;
        if (Object.keys(acquisition).length) {
            message += `\nAcquisition: ${JSON.stringify(acquisition)}`;
        }

        try {
            const res = await sendContact({
                'app-id': 'teacher-assistant',
                'service-id': 'trial-signup',
                name,
                email,
                message,
            });

            if (res.ok) {
                showTrialSuccess(email);
            } else if (res.status === 429) {
                if (trialFormError) {
                    trialFormError.textContent = 'Too many requests. Please wait a few minutes and try again.';
                    trialFormError.hidden = false;
                }
            } else {
                if (trialFormError) {
                    trialFormError.textContent = 'Something went wrong. Please try again.';
                    trialFormError.hidden = false;
                }
            }
        } catch {
            if (trialFormError) {
                trialFormError.textContent = 'Could not connect. Check your internet connection and try again.';
                trialFormError.hidden = false;
            }
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalLabel;
        }
    });
}

// Qualification survey: chip-based, single click per question, optional.
document.querySelectorAll('.trial-survey-chips').forEach((group) => {
    group.addEventListener('click', (e) => {
        const chip = e.target.closest('.trial-chip');
        if (!chip) return;

        const field = group.dataset.surveyField;
        surveyAnswers[field] = chip.textContent.trim();
        group.querySelectorAll('.trial-chip').forEach((c) => c.classList.remove('is-selected'));
        chip.classList.add('is-selected');

        const currentIndex = surveySteps.indexOf(field);
        const nextField = surveySteps[currentIndex + 1];

        setTimeout(() => {
            const currentStep = document.querySelector(`[data-survey-step="${field}"]`);
            if (currentStep) currentStep.hidden = true;

            if (nextField) {
                const nextStep = document.querySelector(`[data-survey-step="${nextField}"]`);
                if (nextStep) nextStep.hidden = false;
            } else {
                finishSurvey();
            }
        }, 250);
    });
});

function finishSurvey() {
    if (trialSurveySkip) trialSurveySkip.hidden = true;
    if (trialSurveyThanks) trialSurveyThanks.hidden = false;

    if (Object.keys(surveyAnswers).length && leadContext.email) {
        const lines = Object.entries(surveyAnswers).map(([k, v]) => `${k}: ${v}`);
        sendContact({
            'app-id': 'teacher-assistant',
            'service-id': 'trial-signup',
            name: leadContext.name || 'Teacher Assistant lead',
            email: leadContext.email,
            message: `Early access qualification survey.\n${lines.join('\n')}`,
        }).catch(() => {});
        trackEvent('qualification_survey_completed', surveyAnswers);
    }
}

if (trialSurveySkip) {
    trialSurveySkip.addEventListener('click', () => {
        trackEvent('qualification_survey_skipped');
        if (trialSurvey) trialSurvey.hidden = true;
    });
}

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (trialModal && trialModal.classList.contains('show')) closeTrialModal();
        if (cookieModal && cookieModal.classList.contains('show')) cookieModal.classList.remove('show');
    }
});
