// ================================
// /research survey wizard
// Relies on trackEvent() from main.js (already loaded before this file).
// No PII goes into analytics events — only step/answer-shape signals.
// ================================
(function () {
    const form = document.getElementById('rForm');
    if (!form) return;

    const TOTAL_CORE = 8;

    // Order matches the DOM (data-step="0..8"). The "bonus" step (email) sits
    // after the 8 numbered research questions and isn't reflected in the
    // progress bar — there's no product-interest gating anymore, it's just
    // always the last optional step before submit. The qualitative question
    // sits right after the task pick (step 3) while it's fresh, and frequency
    // + time-spent are combined onto one screen since they're both short and
    // both refer to the same task.
    const STEPS = [
        { key: 'languages', type: 'checkbox', name: 'languages', required: true, event: 'question_1_completed' },
        { key: 'experience', type: 'radio', name: 'experience', required: true, event: 'question_2_completed' },
        { key: 'topTask', type: 'radio', name: 'topTask', required: true, event: 'question_3_completed' },
        { key: 'moreDetail', type: 'textarea', required: false, event: 'question_4_completed' },
        { key: 'frequencyAndTime', type: 'multi-radio', names: ['frequency', 'timeSpent'], required: true, event: 'question_5_completed' },
        { key: 'frustration', type: 'radio', name: 'frustration', required: true, event: 'question_6_completed' },
        { key: 'tools', type: 'checkbox', name: 'tools', required: true, event: 'question_7_completed' },
        { key: 'eliminate', type: 'textarea', required: false, event: 'question_8_completed' },
        { key: 'email', type: 'email', required: false, bonus: true },
    ];

    // Steps whose "Other" / "Something else" option requires the paired text
    // field once selected — keeps the exported data usable instead of a bare
    // "Other" with no context.
    const OTHER_FIELDS = {
        languages: { triggerId: 'lang-other', inputId: 'rLangOtherInput' },
        topTask: { triggerId: 'tt-13', inputId: 'rTopTaskOtherInput' },
        tools: { triggerId: 'tool-11', inputId: 'rToolsOtherInput' },
    };

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
    const LEAD_FIRED_KEY = 'ta_research_lead_fired';
    const loadStart = Date.now();

    let currentIndex = 0;
    let started = false;
    let wasRestored = false;
    let isSubmitting = false;

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
            topTask: getRadio('topTask'),
            topTaskOther: val('rTopTaskOtherInput'),
            frequency: getRadio('frequency'),
            timeSpent: getRadio('timeSpent'),
            frustration: getRadio('frustration'),
            moreDetail: val('rMoreDetail'),
            tools: getChecked('tools'),
            toolsOther: val('rToolsOtherInput'),
            eliminate: val('rEliminate'),
            email: val('rEmail'),
        };
    }

    function applyAnswersToDom(a) {
        setChecked('languages', a.languages || []);
        setVal('rLangOtherInput', a.languagesOther);
        setRadio('experience', a.experience);
        setRadio('topTask', a.topTask);
        setVal('rTopTaskOtherInput', a.topTaskOther);
        setRadio('frequency', a.frequency);
        setRadio('timeSpent', a.timeSpent);
        setRadio('frustration', a.frustration);
        setVal('rMoreDetail', a.moreDetail);
        setChecked('tools', a.tools || []);
        setVal('rToolsOtherInput', a.toolsOther);
        setVal('rEliminate', a.eliminate);
        setVal('rEmail', a.email);
        refreshOtherFieldVisibility();
    }

    // Human-readable label for the task chosen in step 3 (topTask), used to
    // make the frequency/time-spent questions obviously refer back to it.
    function getTopTaskLabel() {
        const raw = getRadio('topTask');
        if (!raw) return '';
        if (raw === 'Something else') {
            const other = val('rTopTaskOtherInput');
            return other || 'that task';
        }
        return raw;
    }

    function updateTaskReferences() {
        const label = getTopTaskLabel() || 'the task you just selected';
        const el = document.getElementById('rFreqTimeTaskLabel');
        if (el) el.textContent = label;
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
    function updateContinueLabel() {
        continueBtn.textContent = currentIndex === STEPS.length - 1 ? 'Submit my answers →' : 'Continue →';
    }

    function showStep(index, opts) {
        opts = opts || {};
        steps.forEach((el, i) => { el.hidden = i !== index; });
        backBtn.hidden = index === 0;
        inlineError.hidden = true;
        updateTaskReferences();

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

    // Returns null when valid, or a friendly message to show otherwise.
    function validateStep(index) {
        const step = STEPS[index];
        if (step.required) {
            if (step.type === 'checkbox' && getChecked(step.name).length === 0) {
                return 'Please choose at least one option to continue.';
            }
            if (step.type === 'radio' && !getRadio(step.name)) {
                return 'Please choose one option to continue.';
            }
            if (step.type === 'multi-radio' && step.names.some((n) => !getRadio(n))) {
                return 'Please choose one option to continue.';
            }
        }
        const other = OTHER_FIELDS[step.key];
        if (other) {
            const trigger = document.getElementById(other.triggerId);
            const input = document.getElementById(other.inputId);
            if (trigger && trigger.checked && input && !input.value.trim()) {
                return 'Please tell us what you mean by "Other."';
            }
        }
        return null;
    }

    function showError(msg) {
        inlineError.textContent = msg;
        inlineError.hidden = false;
    }

    // On a multi-radio step, focuses the first sub-group that's still unanswered
    // rather than always jumping to the first input on the step.
    function focusFirstUnansweredField(index) {
        const step = STEPS[index];
        if (step.type === 'multi-radio') {
            const missingName = step.names.find((n) => !getRadio(n));
            const el = missingName && form.querySelector(`input[name="${missingName}"]`);
            if (el) { el.focus({ preventScroll: true }); return; }
        }
        const firstField = steps[index].querySelector('input');
        if (firstField) firstField.focus({ preventScroll: true });
    }

    function goNext() {
        const index = currentIndex;
        const step = STEPS[index];

        const errorMsg = validateStep(index);
        if (errorMsg) {
            showError(errorMsg);
            focusFirstUnansweredField(index);
            return;
        }
        inlineError.hidden = true;
        if (step.event) trackEvent(step.event);

        const nextIndex = index + 1;
        if (nextIndex >= STEPS.length) {
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

    function topTaskLabel(answers) {
        if (!answers.topTask) return '—';
        if (answers.topTask === 'Something else') return answers.topTaskOther || 'Something else (unspecified)';
        return answers.topTask;
    }

    function buildMessage(answers) {
        const languages = joinOrDash(answers.languages, answers.languagesOther);
        const topTask = topTaskLabel(answers);
        const tools = joinOrDash(answers.tools, answers.toolsOther);

        const lines = [
            'Language teacher research survey response',
            '',
            `Languages taught: ${languages}`,
            `Teaching experience: ${answers.experience || '—'}`,
            `Primary time-consuming task: ${topTask}`,
            `Frequency of that task: ${answers.frequency || '—'}`,
            `Time spent on that task: ${answers.timeSpent || '—'}`,
            `Frustration (1-5): ${answers.frustration || '—'}`,
            `What they actually did: ${answers.moreDetail || '—'}`,
            `Current tools/workflow: ${tools}`,
            `Would eliminate: ${answers.eliminate || '—'}`,
            '',
            '--- CSV row (paste into a spreadsheet) ---',
            'timestamp,languages,experience,primary_task,frequency,time_spent,frustration,qualitative_detail,tools,eliminate,email',
            [
                new Date().toISOString(),
                csvField(languages),
                csvField(answers.experience),
                csvField(topTask),
                csvField(answers.frequency),
                csvField(answers.timeSpent),
                csvField(answers.frustration),
                csvField(answers.moreDetail),
                csvField(tools),
                csvField(answers.eliminate),
                csvField(answers.email),
            ].join(','),
        ];

        return lines.join('\n').slice(0, 2000);
    }

    // ---- Meta Pixel "Lead" conversion ----
    // Fires once, only after the backend confirms the response was actually
    // saved (HTTP 200 from /api/contact). Never fires on click, on validation
    // failure, on a network/backend error, or more than once per visitor.
    function hasLeadAlreadyFired() {
        try {
            return !!sessionStorage.getItem(LEAD_FIRED_KEY);
        } catch {
            return false;
        }
    }

    function fireLeadEvent() {
        if (hasLeadAlreadyFired()) return;
        try { sessionStorage.setItem(LEAD_FIRED_KEY, '1'); } catch { /* ignore */ }
        if (typeof fbq === 'function') fbq('track', 'Lead');
    }

    async function submitSurvey() {
        // Guards double-click / repeated-Enter: the synchronous part of this
        // function (through the `await`) always completes before a second
        // queued click can re-enter it, so this flag alone prevents re-submission.
        if (isSubmitting) return;
        isSubmitting = true;
        continueBtn.disabled = true;

        const answers = collectAllAnswers();

        trackEvent('survey_submitted');
        if (answers.email) trackEvent('email_provided');

        try {
            sessionStorage.setItem(SUBMITTED_KEY, '1');
            sessionStorage.removeItem(STORAGE_KEY);
        } catch { /* ignore */ }

        // The thank-you screen shows immediately regardless of backend outcome —
        // that UX decision is unchanged. The Lead pixel event is separate and
        // strictly gated on a confirmed-successful save below.
        showThanks(true);

        if (isLikelySpam()) {
            isSubmitting = false;
            return;
        }

        // Same shared contact endpoint (and same name/email requirements) as the
        // site's other forms. The survey itself never requires an email from the
        // visitor, so a placeholder fills the backend's required field when none
        // was given — it's not a real address, just a valid-format value so the
        // response still gets emailed.
        try {
            const res = await fetch('https://web-compose.onrender.com/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    'app-id': 'teacher-assistant',
                    'service-id': 'research',
                    name: 'Teacher Assistant research',
                    email: answers.email || 'no-email-provided@teacher-assistant.center',
                    message: buildMessage(answers),
                }),
            });

            // res.ok (HTTP 200) is the backend's confirmation that the response
            // was validated and successfully saved/delivered. Anything else
            // (400/422/429/500, or the fetch throwing on a network failure) must
            // not count as a Lead.
            if (res.ok) fireLeadEvent();
        } catch {
            // Network failure — no Lead, per spec.
        } finally {
            isSubmitting = false;
        }
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
