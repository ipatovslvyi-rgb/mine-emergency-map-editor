export function openGioWindow() {
  const base = window.location.href.split('#')[0];
  const w = Math.min(1280, window.screen.availWidth - 80);
  const h = Math.min(900, window.screen.availHeight - 80);
  const win = window.open(`${base}#/gio`, 'sau-gio', `width=${w},height=${h},left=40,top=40,resizable=yes,scrollbars=yes`);
  win?.focus();
}

export default openGioWindow;
