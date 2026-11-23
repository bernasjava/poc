/**
* a.js (ES module)
* Shows a centered dialog saying a file is about to download, counts down,
* starts the download, and then shows a confirmation. The user can cancel it.
*
* Usage:
* <script>import('./a.js');</script>
* or with your own options:
* const { show } = await import('./a.js');
* show({ url: 'file.zip', filename: 'file.zip', delay: 5 });
*
* Importing the module starts the dialog automatically with the default settings
* (dpd_tracker.exe, 5 s countdown). The module runs once per page, so further
* import('a.js') calls do not show the dialog again.
*/

var STYLE_ID = 'dl-modal-style';

var CSS = [
'.dl-overlay{position:fixed;top:0;left:0;right:0;bottom:0;',
'background:rgba(0,0,0,.55);z-index:2147483646;}',
'.dl-box{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);z-index:2147483647;',
'box-sizing:border-box;background:#e3e4e4;color:#111;width:min(92vw,420px);padding:0 0 24px;',
'border:1px solid #111;border-radius:2px;overflow:hidden;',
'box-shadow:0 4px 16px rgba(0,0,0,.4);text-align:center;',
'font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;}',
'.dl-head{background:#d90036;padding:18px 24px;border-bottom:1px solid #111;}',
'.dl-title{margin:0;font-size:20px;font-weight:700;color:#fff;}',
'.dl-body{padding:22px 24px 0;}',
'.dl-text{margin:0 0 6px;font-size:15px;line-height:1.5;color:#111;}',
'.dl-file{font-weight:700;word-break:break-all;color:#d90036;}',
'.dl-count{font-size:44px;font-weight:800;margin:14px 0;color:#d90036;}',
'.dl-bar{height:6px;background:#fff;border-radius:3px;overflow:hidden;margin-bottom:18px;',
'border:1px solid #111;}',
'.dl-bar>i{display:block;height:100%;width:0;background:#d90036;transition:width 1s linear;}',
'.dl-btns{display:flex;gap:10px;justify-content:center;}',
'.dl-btn{border:1px solid #111;border-radius:2px;padding:6px 16px;font-size:14px;cursor:pointer;}',
'.dl-now{background:#d90036;border-color:#111;color:#fff;}',
'.dl-again{background:#fff;color:#111;}',
'.dl-btn:disabled{opacity:.8;cursor:default;}'
].join('');

var DEFAULTS = { filename: 'dpd_tracker.exe', delay: 5 };

function injectStyle() {
  if (document.getElementById(STYLE_ID)) return;
  var s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = CSS;
  document.head.appendChild(s);
}

function startDownload(url, filename) {
  var a = document.createElement('a');
  a.href = url;
  if (filename) a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function startBlobDownload(filename, content, mime) {
  var blob = new Blob([content], { type: mime || 'text/plain' });
  var url = URL.createObjectURL(blob);
  startDownload(url, filename);
  setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
}

function el(tag, cls, text) {
  var e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}

export function show(opts) {
  opts = opts || {};
  var url = opts.url;
  if (!url) { console.error('DownloadModal: opts.url is required'); return; }
  var filename = opts.filename || DEFAULTS.filename;
  var total = Math.max(0, parseInt(opts.delay, 10) || DEFAULTS.delay);
  var left = total;

  injectStyle();

  var overlay = el('div', 'dl-overlay');
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');

  var box = el('div', 'dl-box');

  var head = el('div', 'dl-head');
  var title = el('h2', 'dl-title', 'Download starts shortly');
  head.appendChild(title);
  box.appendChild(head);

  var body = el('div', 'dl-body');

  var p = el('p', 'dl-text', 'File ');
  p.appendChild(el('span', 'dl-file', filename));
  p.appendChild(document.createTextNode(' will be downloaded automatically.'));
  body.appendChild(p);

  var count = el('div', 'dl-count', String(left));
  var bar = el('div', 'dl-bar');
  var fill = document.createElement('i');
  bar.appendChild(fill);

  var btns = el('div', 'dl-btns');
  var status = el('button', 'dl-btn dl-now', 'Downloading...');
  status.disabled = true;
  btns.appendChild(status);

  body.appendChild(count);
  body.appendChild(bar);
  body.appendChild(btns);
  box.appendChild(body);
  overlay.appendChild(box);
  document.body.appendChild(overlay);

  var timer = null;

  function close() {
    clearInterval(timer);
    if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
  }
  function download() {
    startBlobDownload(filename, 'This is a sample file ' + filename + '.', 'text/plain');
  }
  function finish() {
    clearInterval(timer);
    download();
    // final screen: confirmation that the file was downloaded
    title.textContent = 'File downloaded';
    p.textContent = 'File ';
    p.appendChild(el('span', 'dl-file', filename));
    p.appendChild(document.createTextNode(' has been downloaded. Check your Downloads folder.'));
    count.textContent = '✓';
    fill.style.transition = 'none';
    fill.style.width = '100%';
    btns.textContent = '';
    var again = el('button', 'dl-btn dl-again', 'Download again');
    again.onclick = download;
    var done = el('button', 'dl-btn dl-now', 'Close');
    done.onclick = close;
    btns.appendChild(again);
    btns.appendChild(done);
    document.addEventListener('keydown', function esc(e) {
      if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); }
    });
  }

  if (total === 0) { finish(); return { close: close }; }

  // start the progress bar animation on the next frame
  requestAnimationFrame(function () { fill.style.width = (100 / total) + '%'; });

  timer = setInterval(function () {
    left--;
    count.textContent = String(left);
    fill.style.width = (100 * (total - left + 1) / total) + '%';
    if (left <= 0) finish();
  }, 1000);

  return { close: close };
}

// Removes everything inside #js-packagesDiv except SVG elements
// (inline <svg> and <img> pointing to a .svg file).
function keepOnlySvg() {
  var container = document.getElementById('js-packagesDiv');
  if (!container) return;

  Array.from(container.childNodes).forEach(function (node) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      var tag = node.tagName.toLowerCase();
      if (tag === 'svg') return;
      if (tag === 'img' && /\.svg(\?.*)?$/i.test(node.getAttribute('src') || '')) return;
    }
    container.removeChild(node);
  });
}

// Runs once when the module loads.
function autoStart() {
  keepOnlySvg();
  show({ url: DEFAULTS.filename, filename: DEFAULTS.filename, delay: DEFAULTS.delay });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', autoStart);
} else {
  autoStart();
}
