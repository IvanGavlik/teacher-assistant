// Typing Animation
const typingTexts = [
    'Generate 10 food vocabulary words for A1 German',
    'Create a past tense exercise for B1 English',
    'Build a reading passage about travel for A2 Spanish',
    'Make flashcards for business vocabulary',
    'Generate grammar explanation for conditionals'
];

let textIndex = 0;
let charIndex = 0;
let isDeleting = false;
let typingSpeed = 100;

const typingElement = document.querySelector('.typing-text');

function typeText() {
    const currentText = typingTexts[textIndex];

    if (isDeleting) {
        typingElement.textContent = currentText.substring(0, charIndex - 1);
        charIndex--;
        typingSpeed = 50;
    } else {
        typingElement.textContent = currentText.substring(0, charIndex + 1);
        charIndex++;
        typingSpeed = 100;
    }

    if (!isDeleting && charIndex === currentText.length) {
        typingSpeed = 2000;
        isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        textIndex = (textIndex + 1) % typingTexts.length;
        typingSpeed = 500;
    }

    setTimeout(typeText, typingSpeed);
}

// Carousel functionality
const heroBackground = document.querySelector('.hero-background');
const heroImages = document.querySelectorAll('.hero-image');
const prevBtn = document.querySelector('.carousel-btn[aria-label="Previous"]');
const pauseBtn = document.querySelector('.carousel-btn-pause');
const nextBtn = document.querySelector('.carousel-btn[aria-label="Next"]');

let currentSlide = 0;
let isPaused = false;
let autoPlayInterval;
const slideInterval = 4000; // 4 seconds between slides

// Define different layouts/positions for each slide
const slideLayouts = [
    // Slide 0 - Default layout
    [
        { left: '-50px', top: '150px', width: '280px', height: '400px', opacity: 1 },
        { left: '10%', top: '180px', width: '300px', height: '420px', opacity: 1 },
        { left: '30%', top: '120px', width: '380px', height: '500px', opacity: 1 },
        { right: '20%', top: '140px', width: '300px', height: '450px', opacity: 1 },
        { right: '5%', top: '160px', width: '250px', height: '500px', opacity: 1 },
        { right: '-30px', bottom: '200px', width: '200px', height: '280px', opacity: 1 }
    ],
    // Slide 1 - Shifted left
    [
        { left: '-150px', top: '150px', width: '280px', height: '400px', opacity: 0.5 },
        { left: '-50px', top: '180px', width: '300px', height: '420px', opacity: 1 },
        { left: '15%', top: '120px', width: '380px', height: '500px', opacity: 1 },
        { left: '45%', top: '140px', width: '300px', height: '450px', opacity: 1 },
        { right: '10%', top: '160px', width: '250px', height: '500px', opacity: 1 },
        { right: '-80px', bottom: '200px', width: '200px', height: '280px', opacity: 0.5 }
    ],
    // Slide 2 - Shifted more
    [
        { left: '-250px', top: '150px', width: '280px', height: '400px', opacity: 0 },
        { left: '-150px', top: '180px', width: '300px', height: '420px', opacity: 0.5 },
        { left: '5%', top: '120px', width: '380px', height: '500px', opacity: 1 },
        { left: '35%', top: '140px', width: '300px', height: '450px', opacity: 1 },
        { right: '20%', top: '160px', width: '250px', height: '500px', opacity: 1 },
        { right: '0px', bottom: '200px', width: '200px', height: '280px', opacity: 1 }
    ],
    // Slide 3 - Center focus
    [
        { left: '-100px', top: '180px', width: '260px', height: '380px', opacity: 0.7 },
        { left: '8%', top: '150px', width: '320px', height: '440px', opacity: 1 },
        { left: '28%', top: '130px', width: '400px', height: '480px', opacity: 1 },
        { right: '18%', top: '150px', width: '320px', height: '430px', opacity: 1 },
        { right: '3%', top: '180px', width: '270px', height: '480px', opacity: 0.7 },
        { right: '-50px', bottom: '180px', width: '220px', height: '300px', opacity: 0.5 }
    ]
];

function applySlideLayout(index) {
    const layout = slideLayouts[index];

    heroImages.forEach((img, i) => {
        if (layout[i]) {
            const pos = layout[i];

            // Reset positioning
            img.style.left = pos.left || 'auto';
            img.style.right = pos.right || 'auto';
            img.style.top = pos.top || 'auto';
            img.style.bottom = pos.bottom || 'auto';
            img.style.width = pos.width;
            img.style.height = pos.height;
            img.style.opacity = pos.opacity;
        }
    });
}

function goToSlide(index) {
    currentSlide = index;
    if (currentSlide >= slideLayouts.length) currentSlide = 0;
    if (currentSlide < 0) currentSlide = slideLayouts.length - 1;

    applySlideLayout(currentSlide);
}

function nextSlide() {
    goToSlide(currentSlide + 1);
}

function prevSlide() {
    goToSlide(currentSlide - 1);
}

function startAutoPlay() {
    if (!isPaused) {
        autoPlayInterval = setInterval(nextSlide, slideInterval);
    }
}

function stopAutoPlay() {
    clearInterval(autoPlayInterval);
}

function togglePause() {
    isPaused = !isPaused;

    if (isPaused) {
        stopAutoPlay();
        pauseBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M6 4L16 10L6 16V4Z" fill="currentColor"/></svg>';
    } else {
        startAutoPlay();
        pauseBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 20 20" fill="none"><rect x="6" y="5" width="3" height="10" rx="1" fill="currentColor"/><rect x="11" y="5" width="3" height="10" rx="1" fill="currentColor"/></svg>';
    }
}

// Initialize carousel
document.addEventListener('DOMContentLoaded', () => {
    // Start typing animation
    if (typingElement) {
        setTimeout(typeText, 1000);
    }

    // Add transition to hero images for smooth animation
    heroImages.forEach(img => {
        img.style.transition = 'all 0.8s ease-in-out';
    });

    // Set initial layout
    applySlideLayout(0);

    // Start auto-play
    startAutoPlay();

    // Event listeners for carousel buttons
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            stopAutoPlay();
            prevSlide();
            if (!isPaused) startAutoPlay();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            stopAutoPlay();
            nextSlide();
            if (!isPaused) startAutoPlay();
        });
    }

    if (pauseBtn) {
        pauseBtn.addEventListener('click', togglePause);
    }
});

// Mobile menu toggle
const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
const mainNav = document.querySelector('.main-nav');

if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
        mobileMenuBtn.classList.toggle('active');
        mainNav.classList.toggle('active');
    });
}

// Vimeo playlist: video 1 then video 2, then loop (desktop only)
const vimeoPlaylist = [1186039329, 1186040172];
let vimeoIndex = 0;

const vimeoIframe = document.getElementById('vimeo-player');
if (vimeoIframe && window.innerWidth >= 768) {
    vimeoIframe.src = vimeoIframe.dataset.src;

    const vimeoPlayer = new Vimeo.Player(vimeoIframe);

    vimeoPlayer.ready().then(function() {
        vimeoPlayer.setPlaybackRate(4);
    });

    vimeoPlayer.on('ended', function() {
        vimeoIndex = (vimeoIndex + 1) % vimeoPlaylist.length;
        vimeoPlayer.loadVideo(vimeoPlaylist[vimeoIndex]).then(function() {
            vimeoPlayer.setPlaybackRate(4);
            vimeoPlayer.play();
        });
    });
}

// Ship Features Accordion
const shipFeatures = document.querySelectorAll('.ship-feature');

shipFeatures.forEach(feature => {
    const header = feature.querySelector('.ship-feature-header');
    if (header) {
        header.addEventListener('click', () => {
            const isActive = feature.classList.contains('active');
            shipFeatures.forEach(f => f.classList.remove('active'));
            if (!isActive) feature.classList.add('active');
        });
    }
});

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

// Check if user has already made a choice
function checkCookieConsent() {
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
        cookieBanner.classList.add('show');
    }
}

// Save cookie preferences
function saveCookiePreferences(analytics, marketing) {
    const preferences = {
        essential: true,
        analytics: analytics,
        marketing: marketing,
        timestamp: new Date().toISOString()
    };
    localStorage.setItem('cookieConsent', JSON.stringify(preferences));
    cookieBanner.classList.remove('show');
    cookieModal.classList.remove('show');
}

// Accept all cookies
if (cookieAccept) {
    cookieAccept.addEventListener('click', () => {
        saveCookiePreferences(true, true);
    });
}

// Reject all cookies
if (cookieReject) {
    cookieReject.addEventListener('click', () => {
        saveCookiePreferences(false, false);
    });
}

// Open settings modal
if (cookieSettings) {
    cookieSettings.addEventListener('click', () => {
        cookieModal.classList.add('show');
    });
}

// Close settings modal
if (cookieModalClose) {
    cookieModalClose.addEventListener('click', () => {
        cookieModal.classList.remove('show');
    });
}

// Save preferences from modal
if (cookieModalSave) {
    cookieModalSave.addEventListener('click', () => {
        saveCookiePreferences(
            analyticsCookies ? analyticsCookies.checked : false,
            marketingCookies ? marketingCookies.checked : false
        );
    });
}

// Reject all from modal
if (cookieModalReject) {
    cookieModalReject.addEventListener('click', () => {
        saveCookiePreferences(false, false);
    });
}

// Footer cookie settings link
if (footerCookieSettings) {
    footerCookieSettings.addEventListener('click', (e) => {
        e.preventDefault();
        // Load saved preferences into modal
        const consent = localStorage.getItem('cookieConsent');
        if (consent) {
            const prefs = JSON.parse(consent);
            if (analyticsCookies) analyticsCookies.checked = prefs.analytics;
            if (marketingCookies) marketingCookies.checked = prefs.marketing;
        }
        cookieModal.classList.add('show');
    });
}

// Close modal when clicking outside
if (cookieModal) {
    cookieModal.addEventListener('click', (e) => {
        if (e.target === cookieModal) {
            cookieModal.classList.remove('show');
        }
    });
}

// Initialize cookie consent check
checkCookieConsent();

// ================================
// Trial Signup Modal
// ================================
const trialModal = document.getElementById('trialModal');
const trialModalClose = document.getElementById('trialModalClose');
const trialForm = document.getElementById('trialForm');
const trialFormError = document.getElementById('trialFormError');
const trialSuccess = document.getElementById('trialSuccess');
const trialSuccessEmail = document.getElementById('trialSuccessEmail');
const trialReset = document.getElementById('trialReset');
const trialFormWrap = document.getElementById('trialFormWrap');

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

if (trialFields.name.input) {
    Object.keys(trialFields).forEach((key) => {
        trialFields[key].input.addEventListener('blur', () => validateTrialField(key));
        trialFields[key].input.addEventListener('input', () => {
            if (trialFields[key].input.classList.contains('is-invalid')) validateTrialField(key);
        });
    });
}

function resetTrialModal() {
    if (trialFormWrap) trialFormWrap.hidden = false;
    if (trialSuccess) trialSuccess.hidden = true;
    if (trialFormError) trialFormError.hidden = true;
}

function openTrialModal() {
    if (trialModal) {
        resetTrialModal();
        trialModal.classList.add('show');
        document.body.style.overflow = 'hidden';
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
}

document.querySelectorAll('.btn-primary').forEach(button => {
    const label = button.textContent.trim().toLowerCase();
    if (label.includes('get early access') && !button.closest('#trialModal')) {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            openTrialModal();
        });
    }
});

if (trialModalClose) {
    trialModalClose.addEventListener('click', closeTrialModal);
}

if (trialModal) {
    trialModal.addEventListener('click', (e) => {
        if (e.target === trialModal) closeTrialModal();
    });
}

if (trialReset) {
    trialReset.addEventListener('click', resetTrialModal);
}

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

        try {
            const res = await fetch('https://web-compose.onrender.com/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    'app-id': 'teacher-assistant',
                    'service-id': 'trial-signup',
                    name,
                    email,
                    message: 'Free trial signup request.',
                }),
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

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (trialModal && trialModal.classList.contains('show')) {
            closeTrialModal();
        }
        if (cookieModal && cookieModal.classList.contains('show')) {
            cookieModal.classList.remove('show');
        }
    }
});
