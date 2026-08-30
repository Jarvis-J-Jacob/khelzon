export async function shareScore(score, gameName) {
  const shareText = `I just scored ${score} in ${gameName} on KhelZon! Can you beat me? 🎮 https://khelzon.pages.dev/`;

  if (navigator.share) {
    try {
      await navigator.share({ text: shareText });
    } catch (err) {
      if (err.name !== 'AbortError') {
        fallbackCopyToClipboard(shareText);
      }
    }
  } else {
    fallbackCopyToClipboard(shareText);
  }
}

async function fallbackCopyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast('Score copied to clipboard!');
  } catch (err) {
    legacyCopyFallback(text);
  }
}

function legacyCopyFallback(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  try {
    document.execCommand('copy');
    showToast('Score copied to clipboard!');
  } catch (err) {
    showToast('Could not copy score. Please copy manually.');
  }
  document.body.removeChild(textarea);
}

function showToast(message) {
  const toast = document.createElement('div');
  toast.textContent = message;
  toast.className = 'toast';
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('toast-visible'));
  setTimeout(() => {
    toast.classList.remove('toast-visible');
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}