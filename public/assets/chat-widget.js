(() => {
  const copy = {
    ar: {
      title: 'مساعد KetCode', subtitle: 'لنحدد احتياج موقعك', open: 'تحدث معنا', close: 'إغلاق',
      status: 'مساعد تصميم المواقع', welcome: 'أهلًا بك! 👋 هل تريد تصميم موقع جديد أم تطوير موقع حالي؟',
      choices: ['تصميم موقع جديد', 'تطوير موقع حالي', 'أريد استشارة عن موقعي'], placeholder: 'اكتب رسالتك هنا...',
      send: 'إرسال', sending: 'جارٍ التفكير...', followUp: 'طلب متابعة بشرية', followUpTitle: 'بيانات التواصل',
      name: 'الاسم', contactMethod: 'طريقة التواصل', email: 'البريد الإلكتروني', phone: 'اتصال هاتفي',
      whatsapp: 'واتساب', contact: 'البريد أو رقم الهاتف',
      consent: 'أوافق على حفظ هذه البيانات والمحادثة ليتواصل معي فريق KetCode.', submitLead: 'إرسال الطلب',
      saving: 'جارٍ الحفظ...', cancel: 'إلغاء', leadSaved: 'تم استلام طلبك. سيتواصل معك فريق KetCode بعد مراجعة الاحتياج.',
      turnLimit: 'وصلت المحادثة إلى الحد المسموح. يمكنك طلب متابعة بشرية.',
      genericError: 'تعذر إكمال الطلب الآن. حاول مرة أخرى.',
      notice: 'مساعد رقمي لجمع احتياج موقعك. تُعالج الرسائل عبر مزود ذكاء اصطناعي؛ لا تشارك كلمات مرور أو بيانات دفع أو معلومات حساسة.'
    },
    en: {
      title: 'KetCode Assistant', subtitle: "Let's define your website needs", open: 'Chat with us', close: 'Close',
      status: 'Website design assistant', welcome: 'Welcome! 👋 Do you need a new website or improvements to an existing one?',
      choices: ['Design a new website', 'Improve my current website', 'I need website advice'], placeholder: 'Type your message...',
      send: 'Send', sending: 'Thinking...', followUp: 'Request human follow-up', followUpTitle: 'Contact details',
      name: 'Name', contactMethod: 'Contact method', email: 'Email', phone: 'Phone call', whatsapp: 'WhatsApp',
      contact: 'Email or phone number', consent: 'I agree that KetCode may store these details and this conversation to contact me.',
      submitLead: 'Send request', saving: 'Saving...', cancel: 'Cancel',
      leadSaved: 'Your request was received. The KetCode team will review it and contact you.',
      turnLimit: 'This chat has reached its message limit. You can request a human follow-up.',
      genericError: 'The request could not be completed. Please try again.',
      notice: 'A digital assistant for your website enquiry. Messages are processed by an AI provider; do not share passwords, payment details, or sensitive information.'
    }
  };

  const state = {
    language: document.documentElement.lang === 'en' ? 'en' : 'ar',
    messages: [], open: false, sending: false, leadOpen: false, leadSaved: false, error: '',
    sessionId: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  };

  const root = document.createElement('div');
  root.className = 'kc-chat-root';
  document.body.appendChild(root);

  function text() { return copy[state.language]; }
  function resetConversation(language) {
    state.language = language;
    state.messages = [{ role: 'assistant', content: copy[language].welcome }];
    state.error = '';
    state.sending = false;
    state.leadOpen = false;
    state.leadSaved = false;
    state.sessionId = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  function element(tag, className, content) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (content !== undefined) node.textContent = content;
    return node;
  }

  function render() {
    const t = text();
    root.replaceChildren();
    root.dir = state.language === 'ar' ? 'rtl' : 'ltr';

    const launcher = element('button', 'kc-chat-launcher');
    launcher.type = 'button';
    launcher.hidden = state.open;
    launcher.setAttribute('aria-expanded', String(state.open));
    launcher.setAttribute('aria-label', t.open);
    launcher.append(element('span', 'kc-chat-launcher-mark', 'K'), element('span', '', t.open));
    launcher.addEventListener('click', () => { state.open = true; render(); root.querySelector('.kc-chat-close')?.focus(); });
    root.appendChild(launcher);

    const panel = element('section', 'kc-chat-panel');
    panel.hidden = !state.open;
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', t.title);

    const header = element('header', 'kc-chat-header');
    const brand = element('div', 'kc-chat-brand');
    const brandCopy = element('div');
    brandCopy.append(element('strong', '', t.title), element('small', '', t.subtitle));
    brand.append(element('span', 'kc-chat-brand-mark', 'K'), brandCopy);
    const close = element('button', 'kc-chat-close', '×');
    close.type = 'button';
    close.setAttribute('aria-label', t.close);
    close.addEventListener('click', () => { state.open = false; render(); root.querySelector('.kc-chat-launcher')?.focus(); });
    header.append(brand, close);

    const toolbar = element('div', 'kc-chat-toolbar');
    toolbar.appendChild(element('span', 'kc-chat-status', t.status));
    const languages = element('div', 'kc-chat-languages');
    [['ar', 'العربية'], ['en', 'English']].forEach(([language, label], index) => {
      const button = element('button', 'kc-chat-language', label);
      button.type = 'button';
      button.setAttribute('aria-pressed', String(state.language === language));
      button.addEventListener('click', () => { if (state.language !== language) { resetConversation(language); render(); } });
      languages.appendChild(button);
      if (index === 0) languages.appendChild(element('span', '', '|'));
    });
    toolbar.appendChild(languages);

    const messages = element('div', 'kc-chat-messages');
    messages.setAttribute('aria-live', 'polite');
    state.messages.forEach((message) => {
      const row = element('div', 'kc-chat-message');
      row.dataset.role = message.role;
      row.appendChild(element('div', 'kc-chat-bubble', message.content));
      messages.appendChild(row);
    });

    const userTurns = state.messages.filter((message) => message.role === 'user').length;
    if (userTurns === 0 && !state.sending) {
      const choices = element('div', 'kc-chat-choices');
      t.choices.forEach((choice) => {
        const button = element('button', 'kc-chat-choice', choice);
        button.type = 'button';
        button.addEventListener('click', () => sendMessage(choice));
        choices.appendChild(button);
      });
      messages.appendChild(choices);
    }
    if (state.sending) messages.appendChild(element('p', 'kc-chat-note', t.sending));
    if (state.error) {
      const error = element('p', 'kc-chat-error', state.error);
      error.setAttribute('role', 'alert');
      messages.appendChild(error);
    }
    if (state.leadSaved) messages.appendChild(element('p', 'kc-chat-success', t.leadSaved));
    if (state.leadOpen && !state.leadSaved) messages.appendChild(buildLeadForm());

    const followUp = element('button', 'kc-chat-followup', t.followUp);
    followUp.type = 'button';
    followUp.hidden = state.leadOpen || state.leadSaved;
    followUp.addEventListener('click', () => { state.leadOpen = true; render(); root.querySelector('.kc-chat-lead input')?.focus(); });

    const compose = element('form', 'kc-chat-compose');
    const input = document.createElement('input');
    input.maxLength = 500;
    input.placeholder = t.placeholder;
    input.setAttribute('aria-label', t.placeholder);
    input.disabled = state.sending || userTurns >= 5;
    const send = element('button', '', t.send);
    send.type = 'submit';
    send.disabled = true;
    input.addEventListener('input', () => { send.disabled = !input.value.trim() || state.sending || userTurns >= 5; });
    compose.addEventListener('submit', (event) => { event.preventDefault(); const value = input.value; input.value = ''; sendMessage(value); });
    compose.append(input, send);

    panel.append(header, toolbar, messages, followUp, compose, element('p', 'kc-chat-disclaimer', t.notice));
    root.appendChild(panel);
    requestAnimationFrame(() => { messages.scrollTop = messages.scrollHeight; });
  }

  function buildLeadForm() {
    const t = text();
    const form = element('form', 'kc-chat-lead');
    form.appendChild(element('h3', '', t.followUpTitle));

    const name = document.createElement('input');
    name.name = 'name'; name.required = true; name.minLength = 2; name.maxLength = 100; name.placeholder = t.name;
    const method = document.createElement('select');
    method.name = 'contactMethod'; method.setAttribute('aria-label', t.contactMethod);
    [['email', t.email], ['phone', t.phone], ['whatsapp', t.whatsapp]].forEach(([value, label]) => {
      const option = document.createElement('option'); option.value = value; option.textContent = label; method.appendChild(option);
    });
    const contact = document.createElement('input');
    contact.name = 'contact'; contact.required = true; contact.minLength = 5; contact.maxLength = 160; contact.placeholder = t.contact;
    const consentLabel = element('label', 'kc-chat-consent');
    const consent = document.createElement('input');
    consent.type = 'checkbox'; consent.name = 'consent'; consent.required = true;
    consentLabel.append(consent, element('span', '', t.consent));
    const actions = element('div', 'kc-chat-lead-actions');
    const submit = element('button', '', t.submitLead); submit.type = 'submit';
    const cancel = element('button', '', t.cancel); cancel.type = 'button';
    cancel.addEventListener('click', () => { state.leadOpen = false; render(); });
    actions.append(submit, cancel);
    form.append(name, method, contact, consentLabel, actions);
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      submit.disabled = true; submit.textContent = t.saving; state.error = '';
      try {
        const response = await fetch('/api/leads', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: state.sessionId, language: state.language, name: name.value,
            contactMethod: method.value, contact: contact.value, consent: consent.checked,
            sourcePage: location.href, messages: state.messages.slice(-10)
          })
        });
        const payload = await response.json();
        if (!response.ok || !payload.saved) throw new Error(payload.error || t.genericError);
        state.leadSaved = true; state.leadOpen = false;
      } catch (error) {
        state.error = error instanceof Error ? error.message : t.genericError;
      }
      render();
    });
    return form;
  }

  async function sendMessage(value) {
    const t = text();
    const content = value.trim().slice(0, 500);
    if (!content || state.sending) return;
    if (state.messages.filter((message) => message.role === 'user').length >= 5) {
      state.error = t.turnLimit; render(); return;
    }

    state.messages.push({ role: 'user', content });
    state.sending = true; state.error = ''; render();
    try {
      const response = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: state.sessionId, language: state.language, messages: state.messages.slice(-10) })
      });
      const payload = await response.json();
      if (!response.ok || !payload.reply) throw new Error(payload.error || t.genericError);
      state.messages.push({ role: 'assistant', content: payload.reply });
    } catch (error) {
      state.error = error instanceof Error ? error.message : t.genericError;
    } finally {
      state.sending = false; render();
    }
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && state.open) { state.open = false; render(); root.querySelector('.kc-chat-launcher')?.focus(); }
  });

  new MutationObserver(() => {
    const language = document.documentElement.lang === 'en' ? 'en' : 'ar';
    if (language !== state.language) { resetConversation(language); render(); }
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

  resetConversation(state.language);
  render();
})();
