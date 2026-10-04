'use strict';

function inquiryToday(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
function inquiryPhoneValid(value) {
  return (
    /^[+()\d\s.-]+$/.test(value) &&
    value.replace(/\D/g, '').length >= 7 &&
    value.replace(/\D/g, '').length <= 15
  );
}
function inquiryAccepted(result) {
  return (
    (result?.success === true || result?.success === 'true') &&
    !/activat/i.test(result?.message || '')
  );
}

const inquiryForm = document.getElementById('inquiry-form');
if (inquiryForm) {
  const fields = inquiryForm.querySelector('.inquiry-fields');
  const button = inquiryForm.querySelector('.inquiry-submit');
  const label = button.querySelector('.inquiry-submit-label');
  const status = inquiryForm.querySelector('.inquiry-status');
  const date = document.getElementById('inquiry-date');
  const mobile = document.getElementById('inquiry-mobile');
  const account = document.getElementById('inquiry-account');
  const accountLabel = document.getElementById('inquiry-account-label');
  const accountHelp = document.getElementById('inquiry-account-help');
  const other = document.getElementById('inquiry-other');
  const otherField = document.getElementById('inquiry-other-field');
  const timezone =
    Intl.DateTimeFormat().resolvedOptions().timeZone || 'Not provided';
  document.getElementById('inquiry-timezone').value = timezone;
  document.getElementById('inquiry-date-help').textContent =
    `Requested date in ${timezone}. Availability will be confirmed by reply.`;
  date.min = inquiryToday();
  let submitting = false;
  function updateAccount() {
    const platform = inquiryForm.querySelector(
      'input[name="Preferred platform"]:checked',
    )?.value;
    const phone = platform === 'Viber' || platform === 'WhatsApp';
    const isOther = platform === 'Other Platform';
    otherField.hidden = !isOther;
    other.disabled = !isOther;
    other.required = isOther;
    other.setCustomValidity('');
    account.disabled = !platform;
    account.type = phone ? 'tel' : 'text';
    account.inputMode = phone ? 'tel' : 'text';
    account.autocomplete = 'off';
    accountLabel.textContent = isOther
      ? 'Contact username, number or profile link'
      : platform
        ? `${platform} ${phone ? 'mobile number' : 'user ID or username'}`
        : 'Platform user ID or mobile number';
    account.placeholder = isOther
      ? 'Your username, mobile number or profile URL'
      : phone
        ? '+63 9XX XXX XXXX'
        : platform
          ? 'Your user ID or @username'
          : 'Choose a contact platform above';
    accountHelp.textContent = phone
      ? 'Include the country code for the number registered with this app.'
      : 'Enter the account where you want me to reply.';
    account.setCustomValidity('');
  }
  inquiryForm
    .querySelectorAll('input[name="Preferred platform"]')
    .forEach((radio) => radio.addEventListener('change', updateAccount));
  [mobile, account, date, other].forEach((input) =>
    input.addEventListener('input', () => input.setCustomValidity('')),
  );
  inquiryForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (submitting) return;
    other.setCustomValidity(
      other.required && !other.value.trim()
        ? 'Enter the name of your contact platform.'
        : '',
    );
    date.min = inquiryToday();
    date.setCustomValidity(
      date.value < date.min ? 'Choose today or a future date.' : '',
    );
    mobile.setCustomValidity(
      inquiryPhoneValid(mobile.value)
        ? ''
        : 'Enter a valid mobile number, including the country code.',
    );
    const phonePlatform = ['Viber', 'WhatsApp'].includes(
      inquiryForm.querySelector('input[name="Preferred platform"]:checked')
        ?.value,
    );
    account.setCustomValidity(
      phonePlatform && !inquiryPhoneValid(account.value)
        ? 'Enter the mobile number registered with this app.'
        : account.value.trim()
          ? ''
          : 'Enter your platform user ID or mobile number.',
    );
    const name = document.getElementById('inquiry-name');
    const message = document.getElementById('inquiry-message');
    name.setCustomValidity(name.value.trim() ? '' : 'Enter your full name.');
    message.setCustomValidity(
      message.value.trim() ? '' : 'Enter your message.',
    );
    [name, message].forEach((input) =>
      input.addEventListener('input', () => input.setCustomValidity(''), {
        once: true,
      }),
    );
    if (!inquiryForm.reportValidity()) return;
    const payload = Object.fromEntries(new FormData(inquiryForm));
    Object.keys(payload).forEach((key) => {
      if (typeof payload[key] === 'string') payload[key] = payload[key].trim();
    });
    submitting = true;
    fields.disabled = true;
    button.disabled = true;
    inquiryForm.setAttribute('aria-busy', 'true');
    inquiryForm.classList.add('is-submitting');
    button.classList.add('cv-loading');
    status.textContent = 'Submitting your inquiry…';
    status.className = 'inquiry-status';
    inquiryForm.classList.remove('is-complete');
    let seconds = 3;
    label.textContent = 'Submitting · 3s';
    const countdown = setInterval(() => {
      seconds--;
      label.textContent = seconds > 0 ? `Submitting · ${seconds}s` : 'Sending…';
    }, 1000);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    const send = async () => {
      const response = await fetch(
        'https://formsubmit.co/ajax/lopez.jimuelb@yahoo.com',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        },
      );
      if (!response.ok) throw new Error('Service unavailable');
      return response.json();
    };
    const [request] = await Promise.allSettled([
      send(),
      new Promise((resolve) => setTimeout(resolve, 3000)),
    ]);
    clearInterval(countdown);
    clearTimeout(timeout);
    inquiryForm.classList.remove('is-submitting');
    button.classList.remove('cv-loading');
    inquiryForm.removeAttribute('aria-busy');
    fields.disabled = false;
    button.disabled = false;
    submitting = false;
    if (request.status === 'fulfilled' && inquiryAccepted(request.value)) {
      inquiryForm.reset();
      document.getElementById('inquiry-timezone').value = timezone;
      updateAccount();
      label.textContent = 'Submit';
      status.classList.add('is-success');
      inquiryForm.classList.add('is-complete');
      status.textContent =
        'Submission complete. Thank you—your inquiry has been accepted. I’ll reply to confirm any meeting request.';
    } else {
      label.textContent = 'Submit';
      status.classList.add('is-error');
      status.textContent =
        request.status === 'fulfilled' &&
        /activat/i.test(request.value?.message || '')
          ? 'The email form is not ready yet. Please use Email Jimuel above. Your details have been kept here.'
          : 'Unable to confirm submission. Your details have been kept. Check your connection or email Jimuel before retrying to avoid sending a duplicate.';
    }
  });
}

