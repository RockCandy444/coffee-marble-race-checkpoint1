(() => {
  'use strict';
  const locale = ['en', 'ja'].includes(document.documentElement.lang) ? document.documentElement.lang : 'ko';
  const messages = window.MarbleMessages || {};
  const t = (key, values = []) => (messages[key] ?? key).replace(/\{(\d+)\}/g, (_, index) => String(values[+index] ?? ''));
  const storageKey = 'coffee-marble-language-transfer-v1';
  let saveSettings = null;
  window.MarbleI18n = {
    locale, t,
    bindSettings(save) { saveSettings = save; },
    takeSettings() {
      try {
        const raw = sessionStorage.getItem(storageKey);
        sessionStorage.removeItem(storageKey);
        const transfer = raw ? JSON.parse(raw) : null;
        return transfer?.locale === locale && Date.now() - transfer.at < 60_000 ? transfer.settings : null;
      } catch { return null; }
    }
  };
  for (const link of document.querySelectorAll('[data-locale-link]')) {
    if (link.dataset.localeLink === locale) link.setAttribute('aria-current', 'page');
    link.addEventListener('click', event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      if (link.dataset.localeLink === locale) { event.preventDefault(); return; }
      try {
        sessionStorage.setItem(storageKey, JSON.stringify({locale: link.dataset.localeLink, at: Date.now(), settings: saveSettings?.()}));
      } catch {
        event.preventDefault();
        document.querySelector('#languageStatus').textContent = t('언어를 변경하려면 이 탭의 브라우저 저장소를 허용해 주세요. 입력한 명단은 유지됩니다.');
      }
    });
  }
})();
