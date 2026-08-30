// ================================
// /research survey wizard
// Relies on trackEvent() from main.js (already loaded before this file).
// No PII goes into analytics events — only step/answer-shape signals.
// ================================
(function () {
    const form = document.getElementById('rForm');
    if (!form) return;

    const TOTAL_CORE = 8;

    // Order matches the DOM (data-step="0..9"). "bonus" steps sit after the
    // 8 numbered questions and aren't reflected in the progress bar.
    const STEPS = [
        { key: 'languages', type: 'checkbox', name: 'languages', required: true, event: 'question_1_completed' },
        { key: 'experience', type: 'radio', name: 'experience', required: true, event: 'question_2_completed' },
        { key: 'timeCost', type: 'checkbox', name: 'timeCost', required: true, event: 'question_3_completed' },
        { key: 'moreDetail', type: 'textarea', required: false, event: 'question_4_completed' },
        { key: 'frequency', type: 'radio', name: 'frequency', required: true, event: 'question_5_completed' },
        { key: 'prepTime', type: 'radio', name: 'prepTime', required: true, event: 'question_6_completed' },
        { key: 'tools', type: 'checkbox', name: 'tools', required: true, event: 'question_7_completed' },
        { key: 'dreamFeature', type: 'textarea', required: false, event: 'question_8_completed' },
        { key: 'interest', type: 'radio', name: 'interest', required: false, bonus: true },
        { key: 'email', type: 'email', required: false, bonus: true },
    ];

    const steps = Array.from(form.querySelectorAll('.q-step'));
    const hero = document.getElementById('rHero');
    const surveySection = document.getElementById('rSurvey');
    const thanksSection = document.getElementById('rThanks');
    const startBtn = document.getElementById('rStartBtn');
    const backBtn = document.getElementById('rBackBtn');
    const continueBtn = document.getElementById('rContinueBtn');
    const inlineError = document.getElementById('rInlineError');
    const progressWrap = document.getElementById('rProgress');
    const progressLabel = document.getElementById('rProgressLabel');
    const progressFill = document.getElementById('rProgressFill');
    const progressBar = document.getElementById('rProgressBar');
    const honeypot = document.getElementById('rWebsite');
    const yearEl = document.getElementById('rYear');
    const productLink = document.getElementById('rProductLink');

    if (yearEl) yearEl.textContent = new Date().getFullYear();

    const STORAGE_KEY = 'ta_research_state';
    const SUBMITTED_KEY = 'ta_research_submitted';
    const loadStart = Date.now();

    let currentIndex = 0;
    let started = false;
    let wasRestored = false;

    trackEvent('research_page_view');

    // ---- field helpers ----
    function val(id) {
        const el = document.getElementById(id);
        return el ? el.value.trim() : '';
    }
    function setVal(id, v) {
        const el = document.getElementById(id);
        if (el && v) el.value = v;
    }
    function getChecked(name) {
        return Array.from(form.querySelectorAll(`input[name="${name}"]:checked`)).map((el) => el.value);
    }
    function setChecked(name, values) {
        form.querySelectorAll(`input[name="${name}"]`).forEach((el) => {
            el.checked = values.indexOf(el.value) !== -1;
        });
    }
    function getRadio(name) {
        const el = form.querySelector(`input[name="${name}"]:checked`);
        return el ? el.value : '';
    }
    function setRadio(name, value) {
        if (!value) return;
        form.querySelectorAll(`input[name="${name}"]`).forEach((el) => {
            el.checked = el.value === value;
        });
    }

    function collectAllAnswers() {
        return {
            languages: getChecked('languages'),
            languagesOther: val('rLangOtherInput'),
            experience: getRadio('experience'),
            timeCost: getChecked('timeCost'),
            timeCostOther: val('rTimeCostOtherInput'),
            moreDetail: val('rMoreDetail'),
            frequency: getRadio('frequency'),
            prepTime: getRadio('prepTime'),
            tools: getChecked('tools'),
            dreamFeature: val('rDreamFeature'),
            interest: getRadio('interest'),
            email: val('rEmail'),
        };
    }

    function applyAnswersToDom(a) {
        setChecked('languages', a.languages || []);
        setVal('rLangOtherInput', a.languagesOther);
        setRadio('experience', a.experience);
        setChecked('timeCost', a.timeCost || []);
        setVal('rTimeCostOtherInput', a.timeCostOther);
        setVal('rMoreDetail', a.moreDetail);
        setRadio('frequency', a.frequency);
        setRadio('prepTime', a.prepTime);
        setChecked('tools', a.tools || []);
        setVal('rDreamFeature', a.dreamFeature);
        setRadio('interest', a.interest);
        setVal('rEmail', a.email);
        refreshOtherFieldVisibility();
    }

    // ---- "Other" / "Something else" inline text reveal ----
    function refreshOtherFieldVisibility() {
        form.querySelectorAll('[data-reveals]').forEach((input) => {
            const target = document.getElementById(input.dataset.reveals);
            if (target) target.classList.toggle('is-visible', input.checked);
        });
    }

    // ---- persistence (survives a refresh mid-survey) ----
    function persistState() {
        try {
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
                index: currentIndex,
                answers: collectAllAnswers(),
            }));
        } catch {
            // storage unavailable (private mode, quota) — in-memory state still works for this page view
        }
    }

    function restoreState() {
        let submitted = false;
        try {
            submitted = !!sessionStorage.getItem(SUBMITTED_KEY);
        } catch { /* ignore */ }

        if (submitted) {
            showThanks(false);
            return true;
        }

        try {
            const raw = sessionStorage.getItem(STORAGE_KEY);
            if (!raw) return false;
            const state = JSON.parse(raw);
            if (!state || typeof state.index !== 'number') return false;

            applyAnswersToDom(state.answers || {});
            currentIndex = Math.min(state.index, STEPS.length - 1);
            started = true;
            wasRestored = true;
            hero.hidden = true;
            surveySection.hidden = false;
            showStep(currentIndex, { scroll: false, focus: false });
            return true;
        } catch {
            return false;
        }
    }

    // ---- wizard navigation ----
    function willShowEmailStep() {
        return getRadio('interest') === 'Yes';
    }

    function isLastVisibleStep(index) {
        if (index === STEPS.length - 1) return true; // email step
        if (index === STEPS.length - 2 && !willShowEmailStep()) return true; // interest step, email will be skipped
        return false;
    }

    function updateContinueLabel() {
        continueBtn.textContent = isLastVisibleStep(currentIndex) ? 'Submit my answers →' : 'Continue →';
    }

    function showStep(index, opts) {
        opts = opts || {};
        steps.forEach((el, i) => { el.hidden = i !== index; });
        backBtn.hidden = index === 0;
        inlineError.hidden = true;

        const step = STEPS[index];
        progressWrap.hidden = !!step.bonus;
        if (!step.bonus) {
            const qNum = index + 1;
            progressLabel.textContent = `Question ${qNum} of ${TOTAL_CORE}`;
            progressFill.style.width = ((qNum / TOTAL_CORE) * 100) + '%';
            progressBar.setAttribute('aria-valuenow', String(qNum));
        }

        updateContinueLabel();

        if (opts.scroll !== false) {
            surveySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        if (opts.focus !== false) {
            const firstField = steps[index].querySelector('input, textarea');
            if (firstField) setTimeout(() => firstField.focus({ preventScroll: true }), 300);
        }
    }

    function validateStep(index) {
        const step = STEPS[index];
        if (!step.required) return true;
        if (step.type === 'checkbox') return getChecked(step.name).length > 0;
        if (step.type === 'radio') return !!getRadio(step.name);
        return true;
    }

    function showError(msg) {
        inlineError.textContent = msg;
        inlineError.hidden = false;
    }

    function goNext() {
        const index = currentIndex;
        const step = STEPS[index];

        if (!validateStep(index)) {
            showError('Please choose at least one answer to continue.');
            const firstField = steps[index].querySelector('input');
            if (firstField) firstField.focus({ preventScroll: true });
            return;
        }
        inlineError.hidden = true;
        if (step.event) trackEvent(step.event);

        const nextIndex = index + 1;
        if (nextIndex >= STEPS.length) {
            submitSurvey();
            return;
        }
        if (STEPS[nextIndex].key === 'email' && !willShowEmailStep()) {
            submitSurvey();
            return;
        }
        currentIndex = nextIndex;
        persistState();
        showStep(currentIndex);
    }

    function goBack() {
        if (currentIndex === 0) return;
        currentIndex -= 1;
        persistState();
        showStep(currentIndex);
    }

    continueBtn.addEventListener('click', goNext);
    backBtn.addEventListener('click', goBack);

    // Enter advances the wizard everywhere except inside a <textarea>, which needs real newlines.
    form.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
            goNext();
        }
    });

    form.addEventListener('change', () => {
        refreshOtherFieldVisibility();
        updateContinueLabel();
        persistState();
    });
    form.addEventListener('input', persistState);

    // ---- spam heuristics (client-side only — real protection needs the backend) ----
    function isLikelySpam() {
        if (honeypot && honeypot.value.trim() !== '') return true;
        // Only meaningful for a fresh start — a resumed (refreshed) session can legitimately
        // finish within a couple of seconds of this page load.
        if (!wasRestored && Date.now() - loadStart < 2000) return true;
        return false;
    }

    // ---- submission ----
    function csvField(v) {
        return `"${(v || '').toString().replace(/"/g, '""')}"`;
    }

    function joinOrDash(arr, other) {
        const values = (arr || []).slice();
        if (other) values.push(`Other: ${other}`);
        return values.length ? values.join('; ') : '—';
    }

    function buildMessage(answers) {
        const languages = joinOrDash(answers.languages, answers.languagesOther);
        const timeCost = joinOrDash(answers.timeCost, answers.timeCostOther);
        const tools = answers.tools && answers.tools.length ? answers.tools.join('; ') : '—';

        const lines = [
            'Language teacher research survey response',
            '',
            `Languages taught: ${languages}`,
            `Teaching experience: ${answers.experience || '—'}`,
            `Biggest time cost: ${timeCost}`,
            `More detail: ${answers.moreDetail || '—'}`,
            `Frequency: ${answers.frequency || '—'}`,
            `Prep time per lesson: ${answers.prepTime || '—'}`,
            `Current tools: ${tools}`,
            `Dream AI feature: ${answers.dreamFeature || '—'}`,
            `Interested in trying it: ${answers.interest || '—'}`,
            '',
            '--- CSV row (paste into a spreadsheet) ---',
            'timestamp,languages,experience,biggest_time_cost,more_detail,frequency,prep_time,tools,dream_feature,interested,email',
            [
                new Date().toISOString(),
                csvField(languages),
                csvField(answers.experience),
                csvField(timeCost),
                csvField(answers.moreDetail),
                csvField(answers.frequency),
                csvField(answers.prepTime),
                csvField(tools),
                csvField(answers.dreamFeature),
                csvField(answers.interest),
                csvField(answers.email),
            ].join(','),
        ];

        return lines.join('\n').slice(0, 2000);
    }

    function submitSurvey() {
        const answers = collectAllAnswers();

        trackEvent('survey_submitted');
        if (answers.email) trackEvent('email_provided');

        try {
            sessionStorage.setItem(SUBMITTED_KEY, '1');
            sessionStorage.removeItem(STORAGE_KEY);
        } catch { /* ignore */ }

        showThanks(true);

        if (isLikelySpam()) return;

        // Same shared contact endpoint (and same name/email requirements) as the
        // site's other forms. The survey itself never requires an email from the
        // visitor, so a placeholder fills the backend's required field when none
        // was given — it's not a real address, just a valid-format value so the
        // response still gets emailed. The thank-you screen never depends on this
        // call succeeding.
        fetch('https://web-compose.onrender.com/api/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                'app-id': 'teacher-assistant',
                'service-id': 'research',
                name: 'Teacher Assistant research',
                email: answers.email || 'no-email-provided@teacher-assistant.center',
                message: buildMessage(answers),
            }),
        }).catch(() => { /* best-effort */ });
    }

    function showThanks(animate) {
        hero.hidden = true;
        surveySection.hidden = true;
        thanksSection.hidden = false;
        if (animate) thanksSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // ---- entry points ----
    startBtn.addEventListener('click', () => {
        if (!started) {
            started = true;
            trackEvent('survey_started');
        }
        hero.hidden = true;
        surveySection.hidden = false;
        showStep(currentIndex);
    });

    if (productLink) {
        productLink.addEventListener('click', () => trackEvent('product_link_clicked'));
    }

    surveySection.hidden = true;
    restoreState();
})();
