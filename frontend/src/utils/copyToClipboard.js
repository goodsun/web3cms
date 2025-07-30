export const copyToClipboard = async (text) => {
  // Method 1: Modern Clipboard API
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn('Clipboard API failed:', err);
    }
  }

  // Method 2: execCommand fallback
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      const successful = document.execCommand('copy');
      if (successful) {
        document.body.removeChild(textArea);
        return true;
      }
    } catch (err) {
      console.warn('execCommand failed:', err);
    }
    
    document.body.removeChild(textArea);
  } catch (err) {
    console.error('Fallback copy failed:', err);
  }

  // Method 3: iOS Safari fallback
  if (navigator.userAgent.match(/ipad|iphone/i)) {
    try {
      const range = document.createRange();
      const selection = window.getSelection();
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.fontSize = '12pt';
      textArea.style.border = '0';
      textArea.style.padding = '0';
      textArea.style.margin = '0';
      textArea.style.position = 'absolute';
      textArea.style.left = '-9999px';
      textArea.style.top = (window.pageYOffset || document.documentElement.scrollTop) + 'px';
      textArea.setAttribute('readonly', '');
      document.body.appendChild(textArea);
      
      range.selectNodeContents(textArea);
      selection.removeAllRanges();
      selection.addRange(range);
      textArea.setSelectionRange(0, 999999);
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) return true;
    } catch (err) {
      console.warn('iOS fallback failed:', err);
    }
  }

  return false;
};