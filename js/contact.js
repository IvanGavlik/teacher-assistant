(function () {
    const form = document.getElementById('contactForm');
    if (!form) return;

    const fields = {
        firstName: {
            input: document.getElementById('contactFirstName'),
            error: document.getElementById('err-firstName'),
        },
        lastName: {
            input: document.getElementById('contactLastName'),
            error: document.getElementById('err-lastName'),
        },
        email: {
            input: document.getElementById('contactEmail'),
            error: document.getElementById('err-email'),
        },
        message: {
            input: document.getElementById('contactMessage'),
            error: document.getElementById('err-message'),
        },
    };

    function validateField(key) {
        const { input, error } = fields[key];
        const val = input.value.trim();
        let msg = '';

        if (key === 'firstName') {
            if (!val)                  msg = 'First name is required.';
            else if (val.length > 100) msg = 'Name must be 100 characters or fewer.';
        } else if (key === 'lastName') {
            if (!val)                  msg = 'Last name is required.';
            else if (val.length > 100) msg = 'Name must be 100 characters or fewer.';
        } else if (key === 'email') {
            if (!val)                                              msg = 'Email address is required.';
            else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val))    msg = 'Enter a valid email address.';
        } else if (key === 'message') {
            if (!val)                   msg = 'Message is required.';
            else if (val.length < 10)   msg = 'Message must be at least 10 characters.';
            else if (val.length > 2000) msg = 'Message must be 2000 characters or fewer.';
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

    const successPanel  = document.getElementById('contactSuccess');
    const resetBtn      = document.getElementById('contactReset');
    const submitBtn     = form.querySelector('[type="submit"]');
    const formErrorEl   = document.getElementById('contactFormError');
    const submitLabel   = submitBtn.textContent;

    function showFormError(msg) {
        formErrorEl.textContent = msg;
        formErrorEl.hidden = false;
    }

    function clearFormError() {
        formErrorEl.hidden = true;
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

        const firstName  = fields.firstName.input.value.trim();
        const lastName   = fields.lastName.input.value.trim();
        const topicSelect = document.getElementById('contactTopic');
        const topicLabel  = topicSelect.value
            ? topicSelect.options[topicSelect.selectedIndex].text
            : null;

        const lines = [];
        if (topicLabel) lines.push(`Topic: ${topicLabel}`);
        lines.push('', 'Message:', fields.message.input.value.trim());

        try {
            const res = await fetch('https://web-compose.onrender.com/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    'app-id':     'teacher-assistant',
                    'service-id': 'support',
                    name:         `${firstName} ${lastName}`,
                    email:        fields.email.input.value.trim(),
                    message:      lines.join('\n'),
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
