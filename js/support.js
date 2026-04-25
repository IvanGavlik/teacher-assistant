(function () {
    const form = document.getElementById('supportForm');
    if (!form) return;

    const fields = {
        name: {
            input: document.getElementById('supportName'),
            error: document.getElementById('err-name'),
        },
        email: {
            input: document.getElementById('supportEmail'),
            error: document.getElementById('err-email'),
        },
        description: {
            input: document.getElementById('supportDescription'),
            error: document.getElementById('err-description'),
        },
    };

    function validateField(key) {
        const { input, error } = fields[key];
        const val = input.value.trim();
        let msg = '';

        if (key === 'name') {
            if (!val)             msg = 'Your name is required.';
            else if (val.length > 100) msg = 'Name must be 100 characters or fewer.';
        } else if (key === 'email') {
            if (!val)             msg = 'Email address is required.';
            else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) msg = 'Enter a valid email address.';
        } else if (key === 'description') {
            if (!val)             msg = 'Please describe the problem.';
            else if (val.length < 10)  msg = 'Description must be at least 10 characters.';
            else if (val.length > 2000) msg = 'Description must be 2000 characters or fewer.';
        }

        const valid = msg === '';
        error.textContent = msg;
        input.classList.toggle('is-invalid', !valid);
        error.classList.toggle('is-visible', !valid);
        return valid;
    }

    Object.keys(fields).forEach((key) => {
        fields[key].input.addEventListener('blur', () => validateField(key));
        fields[key].input.addEventListener('input', () => {
            if (fields[key].input.classList.contains('is-invalid')) validateField(key);
        });
    });

    const successPanel  = document.getElementById('supportSuccess');
    const resetBtn      = document.getElementById('supportReset');
    const submitBtn     = form.querySelector('[type="submit"]');
    const sectionHeader = form.closest('.support-report-inner').querySelector('.support-section-header');
    const submitLabel   = submitBtn.textContent;

    let formErrorEl = null;

    function showFormError(msg) {
        if (!formErrorEl) {
            formErrorEl = document.createElement('p');
            formErrorEl.className = 'support-form-error';
            submitBtn.parentElement.insertBefore(formErrorEl, submitBtn);
        }
        formErrorEl.textContent = msg;
        formErrorEl.hidden = false;
    }

    function clearFormError() {
        if (formErrorEl) formErrorEl.hidden = true;
    }

    function showSuccess() {
        form.reset();
        Object.keys(fields).forEach((key) => {
            fields[key].input.classList.remove('is-invalid');
            fields[key].error.classList.remove('is-visible');
            fields[key].error.textContent = '';
        });
        clearFormError();
        form.hidden = true;
        if (sectionHeader) sectionHeader.hidden = true;
        successPanel.hidden = false;
    }

    function resetForm() {
        form.reset();
        Object.keys(fields).forEach((key) => {
            fields[key].input.classList.remove('is-invalid');
            fields[key].error.classList.remove('is-visible');
            fields[key].error.textContent = '';
        });
        clearFormError();
        form.hidden = false;
        if (sectionHeader) sectionHeader.hidden = false;
        successPanel.hidden = true;
    }

    if (resetBtn) resetBtn.addEventListener('click', resetForm);

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearFormError();

        const allValid = Object.keys(fields).map(validateField).every(Boolean);
        if (!allValid) return;

        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending…';

        const typeSelect  = document.getElementById('supportType');
        const typeLabel   = typeSelect.value ? typeSelect.options[typeSelect.selectedIndex].text : null;
        const version     = document.getElementById('supportVersion').value.trim();
        const steps       = document.getElementById('supportSteps').value.trim();

        const lines = [];
        if (typeLabel) lines.push(`Problem Type: ${typeLabel}`);
        if (version)   lines.push(`Version: ${version}`);
        lines.push('', 'Description:', fields.description.input.value.trim());
        if (steps)     lines.push('', 'Steps to Reproduce:', steps);

        try {
            const res = await fetch('https://web-compose.onrender.com/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    'app-id': 'teacher-assistant',
                    'service-id': 'support',
                    name: fields.name.input.value.trim(),
                    email: fields.email.input.value.trim(),
                    message: lines.join('\n'),
                }),
            });

            if (res.ok) {
                showSuccess();
            } else if (res.status === 429) {
                showFormError('Too many submissions. Please wait a few minutes and try again.');
            } else {
                showFormError('Something went wrong. Please try again.');
            }
        } catch {
            showFormError('Could not connect. Check your internet connection and try again.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = submitLabel;
        }
    });
})();
