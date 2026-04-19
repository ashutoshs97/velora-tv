export function triggerHaptic(type = 'light') {
  if (typeof navigator === 'undefined' || !navigator.vibrate) return;

  try {
    switch (type) {
      case 'light':
        navigator.vibrate(10);
        break;
      case 'medium':
        navigator.vibrate(25);
        break;
      case 'heavy':
        navigator.vibrate(50);
        break;
      case 'error':
        navigator.vibrate([50, 50, 50]);
        break;
      default:
        navigator.vibrate(10);
    }
  } catch (error) {
    // Ignore errors for devices without vibration hardware
  }
}
