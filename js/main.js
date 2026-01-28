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

// Feature Tabs
const featureTabs = document.querySelectorAll('.feature-tab');
const featureVideo = document.querySelector('.feature-video');

// Video sources for each tab
const videoSources = {
    vocabulary: 'first-section-video/vocabulary.mp4',
    grammar: 'first-section-video/grammar.mp4',
    reading: 'first-section-video/reading.mp4',
    exercises: 'first-section-video/exercises.mp4'
};

function switchVideo(tabName) {
    if (featureVideo && videoSources[tabName]) {
        featureVideo.src = videoSources[tabName];
        featureVideo.load();
        featureVideo.play();
    }
}

featureTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        // Remove active class from all tabs
        featureTabs.forEach(t => t.classList.remove('active'));
        // Add active class to clicked tab
        tab.classList.add('active');

        // Switch video based on tab
        const tabType = tab.dataset.tab;
        switchVideo(tabType);
    });
});

// Autoplay prompt video on page load
if (featureVideo) {
    featureVideo.play();
}

// Ship Features Accordion
const shipFeatures = document.querySelectorAll('.ship-feature');

shipFeatures.forEach(feature => {
    const header = feature.querySelector('.ship-feature-header');
    if (header) {
        header.addEventListener('click', () => {
            // Remove active from all
            shipFeatures.forEach(f => f.classList.remove('active'));
            // Add active to clicked
            feature.classList.add('active');
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
// Login/Signup Modal
// ================================
const loginModal = document.getElementById('loginModal');
const loginModalClose = document.getElementById('loginModalClose');
const loginForm = document.getElementById('loginForm');
const getStartedButtons = document.querySelectorAll('.btn-primary');

// Open login modal when clicking "Get started for free" buttons
getStartedButtons.forEach(button => {
    if (button.textContent.trim().toLowerCase().includes('get started')) {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            loginModal.classList.add('show');
            document.body.style.overflow = 'hidden';
        });
    }
});

// Close login modal
if (loginModalClose) {
    loginModalClose.addEventListener('click', () => {
        loginModal.classList.remove('show');
        document.body.style.overflow = '';
    });
}

// Close modal when clicking outside
if (loginModal) {
    loginModal.addEventListener('click', (e) => {
        if (e.target === loginModal) {
            loginModal.classList.remove('show');
            document.body.style.overflow = '';
        }
    });
}

// Handle form submission
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        console.log('Login attempt:', { email, password });
        // Here you would typically send the data to your backend
        alert('Login functionality would be implemented here.');
    });
}

// Handle Google login
const loginGoogle = document.getElementById('loginGoogle');
if (loginGoogle) {
    loginGoogle.addEventListener('click', () => {
        console.log('Google login clicked');
        // Here you would implement Google OAuth
        alert('Google login would be implemented here.');
    });
}

// Handle Microsoft login
const loginMicrosoft = document.getElementById('loginMicrosoft');
if (loginMicrosoft) {
    loginMicrosoft.addEventListener('click', () => {
        console.log('Microsoft login clicked');
        // Here you would implement Microsoft OAuth
        alert('Microsoft login would be implemented here.');
    });
}

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (loginModal && loginModal.classList.contains('show')) {
            loginModal.classList.remove('show');
            document.body.style.overflow = '';
        }
        if (cookieModal && cookieModal.classList.contains('show')) {
            cookieModal.classList.remove('show');
        }
    }
});
