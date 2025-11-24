// reCAPTCHA v3 utility functions

export const loadRecaptcha = (siteKey: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('reCAPTCHA can only be loaded in browser'));
      return;
    }

    if (window.grecaptcha) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load reCAPTCHA'));
    document.head.appendChild(script);
  });
};

export const executeRecaptcha = async (
  siteKey: string,
  action: string = 'signup'
): Promise<string> => {
  if (typeof window === 'undefined' || !window.grecaptcha) {
    throw new Error('reCAPTCHA not loaded');
  }

  return new Promise((resolve, reject) => {
    window.grecaptcha.ready(() => {
      window.grecaptcha
        .execute(siteKey, { action })
        .then((token: string) => {
          resolve(token);
        })
        .catch(reject);
    });
  });
};

declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

