/* ===== EPIOS — Réservation appel découverte ===== */
const menuBtn = document.getElementById('menuBtn'), menu = document.getElementById('menu');
menuBtn.addEventListener('click', () => menu.classList.toggle('open'));

const DEST_EMAIL = window.EP_DEST_EMAIL, EMAILJS = window.EP_EMAILJS, emailjsReady = window.EP_EMAILJS_READY;

const $ = id => document.getElementById(id);
const DOW = ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam'];
const MON = ['janv', 'févr', 'mars', 'avr', 'mai', 'juin', 'juil', 'août', 'sept', 'oct', 'nov', 'déc'];

/* ===== STOCKAGE local ===== */
const STORE_KEY = 'epios_rdv';
let mem = {};
function loadStore() { try { const s = localStorage.getItem(STORE_KEY); return s ? JSON.parse(s) : {}; } catch (e) { return mem; } }
function saveStore(o) { mem = o; try { localStorage.setItem(STORE_KEY, JSON.stringify(o)); } catch (e) {} }
let store = loadStore();
const iso = dt => `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
const toMin = v => { const [a, b] = v.split(':').map(Number); return a * 60 + b; };
const fromMin = m => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
const bookedFor = k => store[k] || [];

/* Plage d'ouverture selon le jour */
function hoursForDay(dow) {
  if (dow >= 1 && dow <= 3) return { min: '18:00', max: '20:30', txt: '18h00 – 20h30' };
  if (dow === 4 || dow === 5) return { min: '17:30', max: '20:30', txt: '17h30 – 20h30' };
  return { min: '08:00', max: '20:00', txt: '08h00 – 20h00' };
}
const STEP = 30;
function validSlots(k, dow) {
  const h = hoursForDay(dow), a = toMin(h.min), b = toMin(h.max), bk = bookedFor(k).map(toMin), out = [];
  for (let t = a; t <= b; t += STEP) { if (bk.every(x => Math.abs(x - t) >= 60)) out.push(fromMin(t)); }
  return out;
}
function dayCapacity(dow) { const h = hoursForDay(dow); return Math.floor((toMin(h.max) - toMin(h.min)) / 60) + 1; }
function avLevel(k, dow) {
  const cnt = bookedFor(k).length;
  if (cnt === 0) return 'green';
  if (validSlots(k, dow).length === 0 || cnt >= dayCapacity(dow)) return 'red';
  return 'orange';
}
function timeConflict(k, val) { const t = toMin(val); return bookedFor(k).some(x => Math.abs(toMin(x) - t) < 60); }

const SHORT = {
  'Site vitrine Essentiel (1 à 3 pages)': 'Site Essentiel',
  'Site vitrine Pro (4 à 8 pages)': 'Site Pro',
  'Refonte de site existant': 'Refonte',
  'Je ne sais pas encore': 'À définir'
};

/* Génère 14 dates à partir d'aujourd'hui */
const datesWrap = $('dates');
const today = new Date(); today.setHours(0, 0, 0, 0);
const dateBtns = [];
for (let i = 0; i < 14; i++) {
  const dt = new Date(today); dt.setDate(today.getDate() + i);
  const k = iso(dt), dow = dt.getDay();
  const lvl = avLevel(k, dow);
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'dbtn ' + lvl;
  btn.dataset.key = k;
  btn.dataset.dow = dow;
  btn.innerHTML = `<span class="dow">${DOW[dow]}</span><span class="d">${dt.getDate()}</span><span class="m">${MON[dt.getMonth()]}</span><span class="dot"></span>`;
  if (lvl === 'red') btn.disabled = true;
  btn.addEventListener('click', () => selectDate(btn, dt));
  datesWrap.appendChild(btn);
  dateBtns.push({ btn, dt, k, dow });
}

let selDate = null, selKey = null, selDow = null;
function selectDate(btn, dt) {
  dateBtns.forEach(x => x.btn.classList.remove('sel'));
  btn.classList.add('sel');
  selDate = dt; selKey = btn.dataset.key; selDow = +btn.dataset.dow;
  const label = `${DOW[selDow]} ${dt.getDate()} ${MON[dt.getMonth()]}`;
  $('sumDate').textContent = label; $('sumDate').classList.remove('empty');
  fillTimes();
}

const heureSel = $('heure');
function fillTimes() {
  heureSel.innerHTML = '';
  const slots = validSlots(selKey, selDow);
  const h = hoursForDay(selDow);
  if (slots.length === 0) {
    heureSel.innerHTML = '<option value="" disabled selected>Aucun créneau disponible ce jour</option>';
    heureSel.disabled = true;
    $('slotNote').textContent = 'Aucun créneau libre ce jour. Choisissez une autre date.';
    $('sumTime').textContent = '—'; $('sumTime').classList.add('empty');
    return;
  }
  heureSel.disabled = false;
  const ph = document.createElement('option');
  ph.value = ''; ph.disabled = true; ph.selected = true; ph.textContent = `Horaires ${h.txt}`;
  heureSel.appendChild(ph);
  slots.forEach(s => { const o = document.createElement('option'); o.value = s; o.textContent = s.replace(':', 'h'); heureSel.appendChild(o); });
  $('slotNote').textContent = `Créneaux disponibles ce jour : ${h.txt}. Chaque appel dure environ 30 minutes.`;
}
heureSel.addEventListener('change', () => {
  if (heureSel.value) { $('sumTime').textContent = heureSel.value.replace(':', 'h'); $('sumTime').classList.remove('empty'); }
});

/* Sync résumé formule/mode */
document.querySelectorAll('input[name=formule]').forEach(r => r.addEventListener('change', () => {
  const v = document.querySelector('input[name=formule]:checked').value;
  $('sumFormule').textContent = SHORT[v] || v;
}));
document.querySelectorAll('input[name=mode]').forEach(r => r.addEventListener('change', () => {
  $('sumMode').textContent = document.querySelector('input[name=mode]:checked').value;
}));

const form = $('rdvForm');
const REF = 'EP-' + Math.floor(100000 + Math.random() * 900000);

function setErr(id, errId, cond) {
  const el = $(id), msg = $(errId);
  if (cond) { el.classList.add('err'); if (msg) msg.classList.add('show'); return false; }
  el.classList.remove('err'); if (msg) msg.classList.remove('show'); return true;
}

form.addEventListener('submit', async e => {
  e.preventDefault();
  const hp = $('hp'); if (hp && hp.value.trim() !== '') { return; }

  let ok = true;
  if (!selDate) { $('conflictNote').textContent = 'Merci de choisir une date.'; $('conflictNote').classList.add('show'); ok = false; }
  else if (!heureSel.value) { $('conflictNote').textContent = 'Merci de choisir un horaire.'; $('conflictNote').classList.add('show'); ok = false; }
  else { $('conflictNote').classList.remove('show'); }

  ok = setErr('nom', 'nomErr', $('nom').value.trim() === '') && ok;
  ok = setErr('tel', 'telErr', $('tel').value.replace(/[^\d+]/g, '').length < 10) && ok;
  const em = $('email').value.trim();
  ok = setErr('email', 'emailErr', !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) && ok;

  const rgpd = $('rgpd');
  if (!rgpd.checked) { $('rgpdErr').classList.add('show'); ok = false; } else { $('rgpdErr').classList.remove('show'); }

  if (!ok) {
    const f = form.querySelector('.err,.errmsg.show,.conflict-note.show');
    if (f) f.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  const clean = (s, max = 500) => String(s).replace(/[<>]/g, '').trim().slice(0, max);
  const formuleVal = document.querySelector('input[name=formule]:checked').value;
  const modeVal = document.querySelector('input[name=mode]:checked').value;
  const dateLabel = `${DOW[selDow]} ${selDate.getDate()} ${MON[selDate.getMonth()]} ${selDate.getFullYear()}`;

  const d = {
    ref: REF,
    date: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }),
    formule: formuleVal,
    mode: modeVal,
    dateLabel: dateLabel,
    time: heureSel.value.replace(':', 'h'),
    nom: clean($('nom').value, 120),
    entreprise: clean($('entreprise').value, 120),
    tel: clean($('tel').value, 30),
    email: clean(em, 150),
    msg: clean($('msg').value, 2000)
  };

  // enregistre localement le créneau
  const bk = bookedFor(selKey); bk.push(heureSel.value); store[selKey] = bk; saveStore(store);

  // PDF récap
  const doc = window.EP.buildRdvPDF(d);
  const url = URL.createObjectURL(doc.output('blob'));
  const fname = `RDV_EPIOS_${d.ref}.pdf`;
  $('rdvDl').href = url; $('rdvDl').setAttribute('download', fname);

  const recap = $('recap');
  recap.innerHTML = `<div><b>Réf.</b> <span class="mono">${d.ref}</span></div>
    <div><b>Formule :</b> ${d.formule}</div>
    <div><b>Mode :</b> ${d.mode}</div>
    <div><b>Quand :</b> ${d.dateLabel} — ${d.time}</div>
    <div><b>Contact :</b> ${d.nom}${d.entreprise ? ' (' + d.entreprise + ')' : ''} · ${d.tel} · ${d.email}</div>`;

  form.style.display = 'none';
  const s = $('success'); s.classList.add('show');
  s.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // Email
  const st = $('mailStatus');
  if (emailjsReady) {
    try {
      emailjs.init({ publicKey: EMAILJS.publicKey });
      const b64 = doc.output('datauristring').split(',')[1];
      await emailjs.send(EMAILJS.serviceId, EMAILJS.templateRdv, {
        type: 'RENDEZ-VOUS',
        subject: `[RDV] ${d.ref} — ${d.formule} — ${d.dateLabel} ${d.time}`,
        to_email: DEST_EMAIL,
        reference: d.ref,
        prestation: d.formule,
        materiel: '—',
        intervention: d.mode,
        date_rdv: d.dateLabel,
        heure_rdv: d.time,
        client_nom: d.nom + (d.entreprise ? ' (' + d.entreprise + ')' : ''),
        client_tel: d.tel,
        client_email: d.email,
        message: d.msg || '—',
        content: b64,
        filename: fname
      });
      st.className = 'mail-status ok';
      st.innerHTML = `Demande envoyée automatiquement à <b>${DEST_EMAIL}</b>.`;
    } catch (err) {
      const s2 = encodeURIComponent(`[RDV] ${d.ref} — ${d.formule} — ${d.dateLabel} ${d.time}`);
      const b2 = encodeURIComponent(`Réf. ${d.ref}\nFormule : ${d.formule}\nMode : ${d.mode}\nQuand : ${d.dateLabel} — ${d.time}\n\nClient : ${d.nom}${d.entreprise ? ' (' + d.entreprise + ')' : ''}\nTéléphone : ${d.tel}\nE-mail : ${d.email}\n\nMessage :\n${d.msg || '—'}`);
      st.className = 'mail-status warn';
      st.innerHTML = `Envoi automatique en échec. <a href="mailto:${DEST_EMAIL}?subject=${s2}&body=${b2}"><b>Envoyer par e-mail</b></a>.`;
    }
  } else {
    const s2 = encodeURIComponent(`[RDV] ${d.ref} — ${d.formule} — ${d.dateLabel} ${d.time}`);
    const b2 = encodeURIComponent(`Réf. ${d.ref}\nFormule : ${d.formule}\nMode : ${d.mode}\nQuand : ${d.dateLabel} — ${d.time}\n\nClient : ${d.nom}${d.entreprise ? ' (' + d.entreprise + ')' : ''}\nTéléphone : ${d.tel}\nE-mail : ${d.email}\n\nMessage :\n${d.msg || '—'}`);
    st.className = 'mail-status warn';
    st.innerHTML = `Envoi automatique non configuré. <a href="mailto:${DEST_EMAIL}?subject=${s2}&body=${b2}"><b>Envoyer par e-mail</b></a>.`;
  }
});
