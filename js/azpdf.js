/* ===== EPIOS — Générateur PDF de marque (jsPDF) — Création de sites Internet ===== */
(function () {
  const C = {
    ink:[10,10,10], inkSoft:[90,90,90], azur:[227,6,19], deep:[176,5,16],
    light:[255,38,53], sky:[253,236,237], skyLine:[245,198,201], sea:[15,166,156],
    coral:[255,107,74], amber:[247,168,27], line:[234,234,234], ok:[30,158,106],
    okBg:[230,244,236], white:[255,255,255]
  };
  const W = 210, H = 297, M = 18, CW = W - 2 * M;

  function header(doc, badge, d) {
    doc.setFillColor.apply(doc, C.ink); doc.rect(0, 0, W, 34, 'F');
    doc.setFillColor.apply(doc, C.azur); doc.rect(0, 27, W, 7, 'F');
    const segs = [C.azur, C.sea, C.coral, C.amber], sw = W / 4;
    segs.forEach((c, i) => { doc.setFillColor.apply(doc, c); doc.rect(i * sw, 34, sw, 1.7, 'F'); });
    doc.setFillColor.apply(doc, C.white); doc.roundedRect(M, 10, 12.5, 12.5, 3, 3, 'F');
    doc.setTextColor.apply(doc, C.ink); doc.setFont('helvetica', 'bold'); doc.setFontSize(13);
    doc.text('E', M + 4.6, 18.4);
    doc.setTextColor.apply(doc, C.azur); doc.text('P', M + 8.2, 18.4);
    doc.setTextColor.apply(doc, C.white); doc.setFont('helvetica', 'bold'); doc.setFontSize(17);
    doc.text('EPIOS', M + 17, 17);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.4); doc.setTextColor(240, 200, 205);
    doc.text("Cr\u00e9ation & refonte de sites Internet \u00b7 Nice", M + 17, 22.5);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(15); doc.setTextColor.apply(doc, C.white);
    doc.text(badge, W - M, 15.5, { align: 'right' });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(240, 200, 205);
    doc.text('R\u00e9f. ' + d.ref, W - M, 21, { align: 'right' });
    doc.text(d.date, W - M, 25.5, { align: 'right' });
  }

  function footer(doc) {
    doc.setDrawColor.apply(doc, C.line); doc.setLineWidth(0.3); doc.line(M, 274, W - M, 274);
    doc.setFontSize(7.6); doc.setTextColor.apply(doc, C.inkSoft);
    doc.text('EPIOS \u2014 Evan POUPARD, entrepreneur individuel (EI)  \u00b7  185 chemin de la Costi\u00e8re, 06000 Nice', M, 279.5);
    doc.text('SIREN 108 663 626  \u00b7  APE 6202A  \u00b7  07 68 69 55 40  \u00b7  contact@epios.fr', M, 283.5);
    doc.setFont('helvetica', 'bold');
    doc.text('TVA non applicable, article 293 B du Code g\u00e9n\u00e9ral des imp\u00f4ts.', M, 287.5);
    doc.setFont('helvetica', 'normal');
    doc.text('Cr\u00e9ation & refonte de sites Internet \u2014 Nice et alentours. Prestations soumises aux conditions', M, 291.5);
    doc.text('g\u00e9n\u00e9rales disponibles sur epios.fr/cgv.html \u2014 d\u00e9lai de r\u00e9tractation de 14 jours pour les particuliers.', M, 295);
  }

  function title(doc, y, txt) {
    doc.setTextColor.apply(doc, C.ink); doc.setFont('helvetica', 'bold'); doc.setFontSize(13.5);
    doc.text(txt, M, y);
    doc.setDrawColor.apply(doc, C.skyLine); doc.setLineWidth(0.5); doc.line(M, y + 3, W - M, y + 3);
    return y + 12;
  }

  function row(doc, y, k, v) {
    const labelW = 52;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor.apply(doc, C.inkSoft);
    doc.text(k.toUpperCase(), M, y + 4.4);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10.5); doc.setTextColor.apply(doc, C.ink);
    const lines = doc.splitTextToSize(v || '\u2014', CW - labelW);
    doc.text(lines, M + labelW, y + 4.4);
    const h = Math.max(9, lines.length * 5.2 + 3.5);
    doc.setDrawColor(238, 242, 245); doc.setLineWidth(0.3); doc.line(M, y + h, W - M, y + h);
    return y + h + 2.5;
  }

  function callout(doc, y, bg, border, titleTx, titleCol, body, bodyCol, h) {
    h = h || 20;
    doc.setFillColor.apply(doc, bg); doc.setDrawColor.apply(doc, border); doc.setLineWidth(0.5);
    doc.roundedRect(M, y, CW, h, 3, 3, 'FD');
    doc.setTextColor.apply(doc, titleCol); doc.setFont('helvetica', 'bold'); doc.setFontSize(11.5);
    doc.text(titleTx, M + 7, y + 8.5);
    if (body) {
      doc.setTextColor.apply(doc, bodyCol); doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
      doc.text(body, M + 7, y + 15);
    }
    return y + h + 8;
  }

  function clientBlock(doc, y, d) {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor.apply(doc, C.inkSoft);
    doc.text('CLIENT', M, y + 4);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10.5); doc.setTextColor.apply(doc, C.ink);
    const line = `${d.nom}${d.entreprise ? ' (' + d.entreprise + ')' : ''}   \u00b7   ${d.tel}   \u00b7   ${d.email}`;
    doc.text(line, M, y + 10.5);
    return y + 18;
  }

  /* ===== DEVIS SITE INTERNET ===== */
  function buildDevisPDF(d) {
    const { jsPDF } = window.jspdf, doc = new jsPDF({ unit: 'mm', format: 'a4' });
    header(doc, 'DEVIS', d);
    let y = title(doc, 48, 'Demande de devis \u2014 site Internet');
    y = row(doc, y, 'Formule souhait\u00e9e', d.formule);
    y = row(doc, y, "Type d'activit\u00e9", d.activite);
    y = row(doc, y, 'Nombre de pages', d.pages);
    if (d.siteActuel) y = row(doc, y, 'Site actuel', d.siteActuel);
    y = row(doc, y, 'Logo / charte graphique', d.logo);
    y = row(doc, y, 'D\u00e9lai souhait\u00e9', d.urg);
    y = row(doc, y, 'Description du projet', d.desc);
    y += 4;
    y = clientBlock(doc, y, d);
    y = callout(doc, y, C.okBg, C.ok, 'Ce devis est 100 % gratuit et sans engagement.', [20,110,72],
      "Aucune obligation d'achat. Estimation communiqu\u00e9e apr\u00e8s \u00e9tude du projet.", [30,120,85], 20);
    doc.setFontSize(7.8); doc.setTextColor.apply(doc, C.inkSoft);
    doc.text('Validit\u00e9 de ce devis : 30 jours \u00e0 compter de sa date d\u2019\u00e9mission.', M, y);
    doc.text('Prix net, TVA non applicable (art. 293 B du CGI). Nom de domaine et h\u00e9bergement factur\u00e9s au co\u00fbt r\u00e9el.', M, y + 4.2);
    doc.text('Le client particulier dispose d\u2019un d\u00e9lai de r\u00e9tractation de 14 jours (art. L221-18 du Code de la consommation).', M, y + 8.4);
    footer(doc);
    return doc;
  }

  /* ===== RENDEZ-VOUS (appel découverte) ===== */
  function buildRdvPDF(d) {
    const { jsPDF } = window.jspdf, doc = new jsPDF({ unit: 'mm', format: 'a4' });
    header(doc, 'RENDEZ-VOUS', d);
    let y = title(doc, 48, 'Confirmation d\u2019appel d\u00e9couverte');
    y = callout(doc, y, C.sky, C.skyLine,
      `${d.dateLabel}  \u2014  ${d.time}`, C.azur,
      `Cr\u00e9neau r\u00e9serv\u00e9 \u00b7 ${d.mode} \u00b7 dur\u00e9e ~30 min`, C.inkSoft, 20);
    y = row(doc, y, 'Formule discut\u00e9e', d.formule);
    y = row(doc, y, "Mode d'\u00e9change", d.mode);
    if (d.msg) y = row(doc, y, 'Pr\u00e9cisions', d.msg);
    y += 4;
    y = clientBlock(doc, y, d);
    y = callout(doc, y, C.okBg, C.ok, 'Appel 100 % gratuit et sans engagement.', [20,110,72],
      'Confirmation d\u00e9finitive sous 48 h ouvr\u00e9es.', [30,120,85], 20);
    footer(doc);
    return doc;
  }

  window.EP = { buildDevisPDF, buildRdvPDF };
})();
