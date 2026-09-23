  /* ===== CONFIG (partagée : js/config.js) ===== */
  const DEST_EMAIL = window.EP_DEST_EMAIL;
  const EMAILJS = window.EP_EMAILJS;
  const emailjsReady = window.EP_EMAILJS_READY;

  /* Prestation -> matériel cohérent + distanciel autorisé ? */
  const CFG={
    's1':{remote:true, mats:['PC fixe','PC portable']},
    's2':{remote:true, mats:['PC fixe','PC portable']},
    's3':{remote:false,mats:['PC fixe','PC portable']},
    's4':{remote:true, mats:['HP','Canon','Epson','Brother','Xerox','Lexmark','Samsung','Ricoh','Kyocera','Pantum','OKI','Dell','Sharp','Konica Minolta','Toshiba','Autre marque']},
    's5':{remote:true, mats:['PC fixe','PC portable','Imprimante','Équipement réseau','Autre']},
    's6':{remote:true, mats:['Switch / Routeur','Serveur / Hyper-V','Box / Réseau domestique','Autre équipement']}
  };

  const $=id=>document.getElementById(id);
  const menuBtn=$('menuBtn'),menu=$('menu');
  menuBtn.addEventListener('click',()=>menu.classList.toggle('open'));

  const form=$('devisForm'), materiel=$('materiel'),
        m1=$('m1'), m2=$('m2'), modeNote=$('modeNote'),
        villeField=$('villeField');
  const REF='EP-'+Math.floor(100000+Math.random()*900000);

  function currentSvc(){const r=form.querySelector('input[name=service]:checked');return r?r.id:'s1';}
  function svcLabel(){const r=form.querySelector('input[name=service]:checked');return r?r.value:'';}

  function fillMats(){
    const svc=currentSvc(), c=CFG[svc], isPrinter=(svc==='s4');
    materiel.innerHTML='';
    const ph=document.createElement('option');
    ph.value='';ph.textContent=isPrinter?'Choisissez la marque…':'Sélectionnez…';ph.disabled=true;ph.selected=true;
    materiel.appendChild(ph);
    c.mats.forEach(m=>{const o=document.createElement('option');o.value=m;o.textContent=m;materiel.appendChild(o);});
    materiel.classList.remove('err');$('materielErr').classList.remove('show');
    $('materielLbl').textContent=isPrinter?"Marque de l'imprimante":'Matériel concerné';
    $('materielErr').textContent=isPrinter?"Sélectionnez la marque de l'imprimante.":'Sélectionnez le matériel concerné.';
    const mf=$('modeleField');
    mf.style.display=isPrinter?'block':'none';
    if(!isPrinter){$('modele').value='';$('modele').classList.remove('err');$('modeleErr').classList.remove('show');}
  }

  function applyMode(){
    const c=CFG[currentSvc()];
    if(!c.remote){m1.disabled=true;m1.checked=false;m2.checked=true;modeNote.classList.add('show');}
    else{m1.disabled=false;modeNote.classList.remove('show');}
    syncVille();
  }

  function syncVille(){
    const dom=m2.checked;
    villeField.style.display=dom?'block':'none';
    if(!dom){$('ville').value='';$('ville').classList.remove('err');$('villeErr').classList.remove('show');}
  }

  form.querySelectorAll('input[name=service]').forEach(r=>r.addEventListener('change',()=>{fillMats();applyMode();}));
  m1.addEventListener('change',syncVille);
  m2.addEventListener('change',syncVille);
  fillMats(); applyMode();

  function setErr(id,errId,cond){const el=$(id),msg=$(errId);if(cond){el.classList.add('err');if(msg)msg.classList.add('show');return false}el.classList.remove('err');if(msg)msg.classList.remove('show');return true}

  function mailtoFallback(d,fname,prefix){
    const s=encodeURIComponent(`[DEVIS] ${d.ref} — ${d.svc}`);
    const b=encodeURIComponent(`DEMANDE DE DEVIS\nRéférence : ${d.ref}\nDate : ${d.date}\n\nPrestation : ${d.svc}\nMatériel : ${d.matFull||d.mat}\nIntervention : ${d.mode}${d.ville?'\nVille : '+d.ville:''}\nUrgence : ${d.urg}\n\nProblème :\n${d.desc}\n\nClient : ${d.nom}\nTéléphone : ${d.tel}\nE-mail : ${d.email}\n\n(Pensez à joindre le PDF « ${fname} ».)`);
    return `${prefix} Le devis PDF s'est ouvert dans un nouvel onglet. <a href="mailto:${DEST_EMAIL}?subject=${s}&body=${b}"><b>Envoyez-le en un clic</b></a>.`;
  }

  form.addEventListener('submit',async e=>{
    e.preventDefault();
    const hp=$('hp');if(hp&&hp.value.trim()!==''){return;}
    let ok=true;
    ok=setErr('materiel','materielErr',materiel.value==='')&&ok;
    if(currentSvc()==='s4'){ok=setErr('modele','modeleErr',$('modele').value.trim()==='')&&ok;}
    ok=setErr('desc','descErr',$('desc').value.trim().length<10)&&ok;
    ok=setErr('nom','nomErr',$('nom').value.trim()==='')&&ok;
    ok=setErr('tel','telErr',$('tel').value.replace(/[^\d+]/g,'').length<10)&&ok;
    const em=$('email').value.trim();
    ok=setErr('email','emailErr',!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em))&&ok;
    if(m2.checked){ok=setErr('ville','villeErr',$('ville').value.trim()==='')&&ok;}
    const rgpd=$('rgpd');
    if(!rgpd.checked){$('rgpdErr').classList.add('show');ok=false;}else{$('rgpdErr').classList.remove('show');}
    if(!ok){const f=form.querySelector('.err,.errmsg.show');if(f)f.scrollIntoView({behavior:'smooth',block:'center'});return;}

    const btn=$('submitBtn');btn.style.pointerEvents='none';btn.style.opacity='.65';

    const clean=(s,max=500)=>String(s).replace(/[<>]/g,'').trim().slice(0,max);
    const d={ref:REF,date:new Date().toLocaleDateString('fr-FR',{day:'2-digit',month:'long',year:'numeric'}),
      svc:svcLabel(),mat:clean(materiel.value,120),mode:m2.checked?'À domicile':'À distance',
      ville:m2.checked?clean($('ville').value,120):'',urg:clean($('urgence').value,60),
      desc:clean($('desc').value,2000),nom:clean($('nom').value,120),tel:clean($('tel').value,30),email:clean(em,150)};
    d.modele=(currentSvc()==='s4')?clean($('modele').value,120):'';
    d.matFull=d.modele?`${d.mat} — ${d.modele}`:d.mat;

    // 1) PDF de marque
    const doc=window.EP.buildDevisPDF(d), blob=doc.output('blob'),
          url=URL.createObjectURL(blob), fname=`Devis_EPIOS_${d.ref}.pdf`;

    // Ouverture DIRECTE dans un nouvel onglet (pas d'aperçu réduit sur le site)
    window.open(url,'_blank','noopener');

    // liens de secours dans l'écran de confirmation
    $('btnOpen').href=url;$('btnDl').href=url;$('btnDl').setAttribute('download',fname);
    $('refNo').textContent='Réf. '+d.ref;$('doneRef').textContent=d.ref;
    form.style.display='none';const s=$('success');s.classList.add('show');s.scrollIntoView({behavior:'smooth',block:'start'});

    // 2) e-mail automatique -> DEVIS
    const st=$('mailStatus');
    if(emailjsReady){
      try{
        emailjs.init({publicKey:EMAILJS.publicKey});
        const b64=doc.output('datauristring').split(',')[1];
        await emailjs.send(EMAILJS.serviceId,EMAILJS.templateDevis,{
          type:'DEVIS',
          subject:`[DEVIS] ${d.ref} — ${d.svc}`,
          to_email:DEST_EMAIL,reference:d.ref,date:d.date,
          prestation:d.svc,materiel:d.matFull||d.mat,intervention:d.mode,ville:d.ville||'—',urgence:d.urg,description:d.desc,
          client_nom:d.nom,client_tel:d.tel,client_email:d.email,content:b64,filename:fname});
        st.className='mail-status ok';st.innerHTML=`Devis envoyé automatiquement à <b>${DEST_EMAIL}</b>. Il s'est aussi ouvert dans un nouvel onglet.`;
      }catch(err){st.className='mail-status warn';st.innerHTML=mailtoFallback(d,fname,"L'envoi automatique a échoué.");}
    }else{
      st.className='mail-status warn';st.innerHTML=mailtoFallback(d,fname,'Envoi automatique non configuré.');
    }
  });
