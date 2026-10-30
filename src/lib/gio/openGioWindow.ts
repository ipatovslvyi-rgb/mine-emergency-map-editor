export function openGioWindow() {
  const standalone = window.matchMedia('(display-mode: standalone)').matches;
  const mobile = window.matchMedia('(max-width: 767px), (pointer: coarse)').matches;
  if (standalone || mobile) {
    window.location.href = '/gio';
    return;
  }
  const w = Math.min(1280, window.screen.availWidth - 80);
  const h = Math.min(900, window.screen.availHeight - 80);
  const win = window.open('/gio', 'sau-gio', `width=${w},height=${h},left=40,top=40,resizable=yes,scrollbars=yes`);
  win?.focus();
}

export default openGioWindow;
