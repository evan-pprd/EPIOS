/* ===== EPIOS — Devis (site Internet) ===== */
const DEST_EMAIL = window.EP_DEST_EMAIL;
const EMAILJS = window.EP_EMAILJS;
const emailjsReady = window.EP_EMAILJS_READY;

const $ = id => document.getElementById(id);
const menuBtn = $('menuBtn'), menu = $('menu');
menuBtn.addEventListener('click', () => menu.classList.toggle('open'));

const form = $('devisForm');
const REF = 'EP-' + Math.floor(100000 + Math.random() * 900000);

function formuleLabel() {
  const r = form.querySelector('input[name=formule]:checked');
  return r ? r.value : '';
}

function setErr(id, errId, cond) {
  const el = $(id), msg = $(errId);
  if (cond) { el.classList.add('err'); if (msg) msg.classList.add('show'); return false; }
  el.classList.remove('err'); if (msg) msg.classList.remove('show'); return true;
}

function mailtoFallback(d, fname, prefix) {
  const s = encodeURIComponent(`[DEVIS SITE] ${d.ref} — ${d.formule}`);
  const b = encodeURIComponent(
    `DEMANDE DE DEVIS — SITE INTERNET\nRéférence : ${d.ref}\nDate : ${d.date}\n\n` +
    `Formule : ${d.formule}\nActivité : ${d.activite}\nPages : ${d.pages}\n` +
    `Site actuel : ${d.siteActuel || '—'}\nDélai : ${d.urg}\nLogo/charte : ${d.logo}\n\n` +
    `Projet :\n${d.desc}\n\n` +
    `Client : ${d.nom}${d.entreprise ? ' (' + d.entreprise + ')' : ''}\n` +
    `Téléphone : ${d.tel}\nE-mail : ${d.email}\n\n` +
    `(Pensez à joindre le PDF « ${fname} ».)`
  );
  return `${prefix} Le devis PDF s'est ouvert dans un nouvel onglet. <a href="mailto:${DEST_EMAIL}?subject=${s}&body=${b}"><b>Envoyez-le en un clic</b></a>.`;
}

form.addEventListener('submit', async e => {
  e.preventDefault();
  const hp = $('hp'); if (hp && hp.value.trim() !== '') { return; }

  let ok = true;
  ok = setErr('activite', 'activiteErr', $('activite').value === '') && ok;
  ok = setErr('desc', 'descErr', $('desc').value.trim().length < 15) && ok;
  ok = setErr('nom', 'nomErr', $('nom').value.trim() === '') && ok;
  ok = setErr('tel', 'telErr', $('tel').value.replace(/[^\d+]/g, '').length < 10) && ok;
  const em = $('email').value.trim();
  ok = setErr('email', 'emailErr', !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) && ok;
  const rgpd = $('rgpd');
  if (!rgpd.checked) { $('rgpdErr').classList.add('show'); ok = false; } else { $('rgpdErr').classList.remove('show'); }

  if (!ok) {
    const f = form.querySelector('.err,.errmsg.show');
    if (f) f.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  const btn = $('submitBtn'); btn.style.pointerEvents = 'none'; btn.style.opacity = '.65';
  const clean = (s, max = 500) => String(s).replace(/[<>]/g, '').trim().slice(0, max);

  const d = {
    ref: REF,
    date: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }),
    formule: formuleLabel(),
    activite: clean($('activite').value, 120),
    pages: clean($('pages').value, 60),
    siteActuel: clean($('siteActuel').value, 200),
    urg: clean($('urgence').value, 60),
    logo: clean($('logo').value, 60),
    desc: clean($('desc').value, 3000),
    nom: clean($('nom').value, 120),
    entreprise: clean($('entreprise').value, 120),
    tel: clean($('tel').value, 30),
    email: clean(em, 150)
  };

  // 1) PDF de marque
  const doc = window.EP.buildDevisPDF(d);
  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  const fname = `Devis_EPIOS_${d.ref}.pdf`;

  window.open(url, '_blank', 'noopener');

  $('btnOpen').href = url;
  $('btnDl').href = url;
  $('btnDl').setAttribute('download', fname);
  $('refNo').textContent = 'Réf. ' + d.ref;
  $('doneRef').textContent = d.ref;
  form.style.display = 'none';
  const s = $('success'); s.classList.add('show');
  s.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // 2) e-mail automatique
  const st = $('mailStatus');
  if (emailjsReady) {
    try {
      emailjs.init({ publicKey: EMAILJS.publicKey });
      const b64 = doc.output('datauristring').split(',')[1];
      await emailjs.send(EMAILJS.serviceId, EMAILJS.templateDevis, {
        type: 'DEVIS SITE',
        subject: `[DEVIS SITE] ${d.ref} — ${d.formule}`,
        to_email: DEST_EMAIL,
        reference: d.ref,
        date: d.date,
        prestation: d.formule,
        materiel: `${d.activite} · ${d.pages}`,
        intervention: d.logo,
        ville: d.siteActuel || '—',
        urgence: d.urg,
        description: d.desc,
        client_nom: d.nom + (d.entreprise ? ' (' + d.entreprise + ')' : ''),
        client_tel: d.tel,
        client_email: d.email,
        content: b64,
        filename: fname
      });
      st.className = 'mail-status ok';
      st.innerHTML = `Devis envoyé automatiquement à <b>${DEST_EMAIL}</b>. Il s'est aussi ouvert dans un nouvel onglet.`;
    } catch (err) {
      st.className = 'mail-status warn';
      st.innerHTML = mailtoFallback(d, fname, "L'envoi automatique a échoué.");
    }
  } else {
    st.className = 'mail-status warn';
    st.innerHTML = mailtoFallback(d, fname, 'Envoi automatique non configuré.');
  }
});
