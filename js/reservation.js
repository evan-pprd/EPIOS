  const btn=document.getElementById('menuBtn'),menu=document.getElementById('menu');
  btn.addEventListener('click',()=>menu.classList.toggle('open'));

  /* ===== CONFIG partagée ===== */
  const DEST_EMAIL=window.EP_DEST_EMAIL, EMAILJS=window.EP_EMAILJS, emailjsReady=window.EP_EMAILJS_READY;

  const $=id=>document.getElementById(id);
  const DOW=['dim','lun','mar','mer','jeu','ven','sam'];
  const MON=['janv','févr','mars','avr','mai','juin','juil','août','sept','oct','nov','déc'];

  /* ===== STOCKAGE (localStorage, propre à CE navigateur) ===== */
  const STORE_KEY='epios_rdv';
  let mem={};
  function loadStore(){try{const s=localStorage.getItem(STORE_KEY);return s?JSON.parse(s):{}}catch(e){return mem}}
  function saveStore(o){mem=o;try{localStorage.setItem(STORE_KEY,JSON.stringify(o))}catch(e){}}
  let store=loadStore();
  const iso=dt=>`${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
  const toMin=v=>{const[a,b]=v.split(':').map(Number);return a*60+b};
  const fromMin=m=>`${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;
  const bookedFor=k=>store[k]||[];

  /* Plage d'ouverture selon le jour */
  function hoursForDay(dow){
    if(dow>=1&&dow<=3) return {min:'18:00',max:'20:30',txt:'18h00 – 20h30'};   // Lun-Mer
    if(dow===4||dow===5) return {min:'17:30',max:'20:30',txt:'17h30 – 20h30'}; // Jeu-Ven
    return {min:'08:00',max:'20:00',txt:'08h00 – 20h00'};                       // Sam-Dim
  }
  const STEP=30; // pas des créneaux proposés (minutes)
  /* Liste des créneaux VALIDES du jour : dans les horaires + hors conflit ±1h */
  function validSlots(k,dow){
    const h=hoursForDay(dow),a=toMin(h.min),b=toMin(h.max),bk=bookedFor(k).map(toMin),out=[];
    for(let t=a;t<=b;t+=STEP){ if(bk.every(x=>Math.abs(x-t)>=60)) out.push(fromMin(t)); }
    return out;
  }
  function dayCapacity(dow){const h=hoursForDay(dow);return Math.floor((toMin(h.max)-toMin(h.min))/60)+1;}
  function avLevel(k,dow){
    const cnt=bookedFor(k).length;
    if(cnt===0) return 'green';
    if(validSlots(k,dow).length===0||cnt>=dayCapacity(dow)) return 'red';
    return 'orange';
  }
  function timeConflict(k,val){const t=toMin(val);return bookedFor(k).some(x=>Math.abs(toMin(x)-t)<60);}

  const SHORT={
    'Configuration de PC & Migration Windows 11':'Configuration & Windows 11',
    'Réinitialisation & Nettoyage PC':'Réinitialisation PC',
    'Remplacement RAM / Disque dur / Batterie':'RAM / Disque dur / Batterie',
    'Installation & Configuration Imprimante':'Imprimante',
    'Diagnostic Informatique':'Diagnostic',
    'Configuration équipement réseaux':'Équipement réseaux'
  };

  const CFG={
    's1':{remote:true, mats:['PC fixe','PC portable']},
    's2':{remote:true, mats:['PC fixe','PC portable']},
    's3':{remote:false,mats:['PC fixe','PC portable']},
    's4':{remote:true, mats:['HP','Canon','Epson','Brother','Xerox','Lexmark','Samsung','Ricoh','Kyocera','Pantum','OKI','Dell','Sharp','Konica Minolta','Toshiba','Autre marque']},
    's5':{remote:true, mats:['PC fixe','PC portable','Imprimante','Équipement réseau','Autre']},
    's6':{remote:true, mats:['Switch / Routeur','Serveur / Hyper-V','Box / Réseau domestique','Autre équipement']}
  };

  const form=$('rdvForm'), materiel=$('materiel'), m1=$('m1'), m2=$('m2'),
        modeNote=$('modeNote'), villeField=$('villeField'), adrField=$('adrField'), heure=$('heure');
  const slotNote=$('slotNote');
  const state={svc:'Configuration de PC & Migration Windows 11',svcShort:'Configuration & Windows 11',mode:'À distance',date:null,time:null,dateLabel:null,curHours:null};

  function currentSvc(){const r=form.querySelector('input[name=svc]:checked');return r?r.id:'s1';}
  function svcValue(){const r=form.querySelector('input[name=svc]:checked');return r?r.value:'';}

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
    state.mode=m2.checked?'À domicile':'À distance';
    syncVille();
  }

  function syncVille(){
    const dom=m2.checked;
    villeField.style.display=dom?'block':'none';
    adrField.style.display=dom?'block':'none';
    if(!dom){$('ville').value='';$('ville').classList.remove('err');$('villeErr').classList.remove('show');$('adr').value='';}
    state.mode=dom?'À domicile':'À distance';
    sync();
  }

  form.querySelectorAll('input[name=svc]').forEach(r=>r.addEventListener('change',()=>{
    state.svc=svcValue();state.svcShort=SHORT[state.svc]||state.svc;
    fillMats();applyMode();sync();
  }));
  m1.addEventListener('change',syncVille);
  m2.addEventListener('change',syncVille);
  materiel.addEventListener('change',()=>{materiel.classList.remove('err');$('materielErr').classList.remove('show');sync();});

  /* Remplit le menu déroulant avec UNIQUEMENT les horaires valides du jour */
  function fillSlots(k,dow){
    const slots=validSlots(k,dow);
    heure.innerHTML='';
    const ph=document.createElement('option');
    ph.value='';ph.disabled=true;ph.selected=true;
    ph.textContent=slots.length?'Choisissez un horaire…':'Aucun créneau ce jour';
    heure.appendChild(ph);
    slots.forEach(t=>{const o=document.createElement('option');o.value=t;o.textContent=t.replace(':','h');heure.appendChild(o);});
    heure.disabled=slots.length===0;
    return slots.length;
  }

  /* Dates : 10 prochains jours */
  const datesEl=$('dates');
  const pills=[];
  let d=new Date(),added=0;d.setDate(d.getDate()+1);
  while(added<10){
    const cur=new Date(d),dow=cur.getDay(),k=iso(cur);
    const pill=document.createElement('div');
    pill.className='date-pill';pill.tabIndex=0;pill.setAttribute('role','button');
    pill.innerHTML=`<div class="dow">${DOW[dow]}</div><div class="num">${cur.getDate()}</div><div class="mon">${MON[cur.getMonth()]}</div><span class="av-cnt"></span><span class="av-dot"></span>`;
    const label=`${DOW[dow]}. ${cur.getDate()} ${MON[cur.getMonth()]}`;
    const ref={el:pill,dow,k,label};
    pills.push(ref);
    const pick=()=>{
      if(avLevel(k,dow)==='red') return;
      pills.forEach(p=>p.el.classList.remove('sel'));pill.classList.add('sel');
      state.date=cur;state.dateLabel=label;state.time=null;state.iso=k;
      const h=hoursForDay(dow);state.curHours=h;
      const n=fillSlots(k,dow);
      $('conflictNote').classList.remove('show');
      slotNote.textContent=n
        ? `Horaires d'ouverture ce jour : ${h.txt}. Seuls les créneaux disponibles sont proposés.`
        : `Journée complète : plus aucun créneau disponible ce jour. Choisissez une autre date.`;
      sync();
    };
    pill.addEventListener('click',pick);
    pill.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();pick()}});
    datesEl.appendChild(pill);added++;
    d.setDate(d.getDate()+1);
  }
  function recolorPills(){
    pills.forEach(p=>{
      p.el.classList.remove('av-green','av-orange','av-red');
      const lv=avLevel(p.k,p.dow);
      p.el.classList.add('av-'+lv);
      const cnt=bookedFor(p.k).length;
      p.el.querySelector('.av-cnt').textContent=lv==='red'?'complet':(cnt?cnt+' pris':'libre');
    });
  }
  recolorPills();

  heure.addEventListener('change',()=>{
    const cn=$('conflictNote');
    if(!heure.value){state.time=null;sync();return;}
    // sécurité : le créneau doit exister dans la liste valide au moment du choix
    if(state.iso&&timeConflict(state.iso,heure.value)){
      state.time=null;fillSlots(state.iso,pills.find(p=>p.k===state.iso).dow);
      cn.textContent='Cet horaire vient d\u2019être pris. La liste a été mise à jour, choisissez un autre créneau.';
      cn.classList.add('show');sync();return;
    }
    state.time=heure.value;cn.classList.remove('show');sync();
  });

  function setV(id,val){const el=$(id);if(val){el.textContent=val;el.classList.remove('empty');}else{el.textContent='À choisir';el.classList.add('empty');}}
  function sync(){
    $('sumSvc').textContent=state.svcShort;
    $('sumMode').textContent=state.mode;
    setV('sumMat',materiel.value);
    setV('sumDate',state.dateLabel);
    setV('sumTime',state.time?state.time.replace(':','h'):null);
  }

  function setErr(id,errId,cond){const el=$(id),msg=$(errId);if(cond){el.classList.add('err');msg.classList.add('show');return false}el.classList.remove('err');msg.classList.remove('show');return true}
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const clean=(s,max=500)=>String(s).replace(/[<>]/g,'').trim().slice(0,max);

  function rdvMailtoFallback(d,fname,prefix){
    const s=encodeURIComponent(`[RDV] ${d.ref} — ${d.dateLabel} ${d.time}`);
    const b=encodeURIComponent(`DEMANDE DE RENDEZ-VOUS\nRéférence : ${d.ref}\n\nDate : ${d.dateLabel}\nHoraire : ${d.time}\nPrestation : ${d.svc}\nMatériel : ${d.matFull}\nMode : ${d.mode}${d.ville?'\nVille : '+d.ville:''}${d.adr?'\nAdresse : '+d.adr:''}${d.msg?'\n\nPrécisions :\n'+d.msg:''}\n\nClient : ${d.nom}\nTéléphone : ${d.tel}\nE-mail : ${d.email}\n\n(Pensez à joindre le PDF « ${fname} ».)`);
    return `${prefix} <a href="mailto:${DEST_EMAIL}?subject=${s}&body=${b}"><b>Envoyez le rendez-vous en un clic</b></a>.`;
  }

  form.addEventListener('submit',async e=>{
    e.preventDefault();
    const hp=$('hp');if(hp&&hp.value.trim()!==''){return;}
    let ok=true;
    ok=setErr('materiel','materielErr',materiel.value==='')&&ok;
    if(currentSvc()==='s4') ok=setErr('modele','modeleErr',$('modele').value.trim()==='')&&ok;
    if(!state.date){alert('Merci de choisir une date.');$('dates').scrollIntoView({behavior:'smooth',block:'center'});return}
    // horaire : doit être un créneau valide choisi dans la liste
    if(!heure.value){heure.classList.add('err');slotNote.textContent=`Choisissez un horaire dans la liste (horaires d'ouverture : ${state.curHours?state.curHours.txt:''}).`;heure.scrollIntoView({behavior:'smooth',block:'center'});return}
    heure.classList.remove('err');
    if(state.iso&&timeConflict(state.iso,heure.value)){
      const cn=$('conflictNote');fillSlots(state.iso,pills.find(p=>p.k===state.iso).dow);
      cn.textContent='Cet horaire vient d\u2019être pris. Choisissez un autre créneau.';
      cn.classList.add('show');cn.scrollIntoView({behavior:'smooth',block:'center'});return;
    }
    state.time=heure.value;
    ok=setErr('nom','nomErr',$('nom').value.trim()==='')&&ok;
    ok=setErr('tel','telErr',$('tel').value.trim().length<8)&&ok;
    const em=$('email').value.trim();
    ok=setErr('email','emailErr',!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em))&&ok;
    if(m2.checked) ok=setErr('ville','villeErr',$('ville').value.trim()==='')&&ok;

    /* Consentement RGPD + acceptation des CGPS : obligatoires */
    const rgpd=$('rgpd');
    if(rgpd&&!rgpd.checked){$('rgpdErr').classList.add('show');ok=false;}else if(rgpd){$('rgpdErr').classList.remove('show');}
    const cgv=$('cgv');
    if(cgv&&!cgv.checked){$('cgvErr').classList.add('show');ok=false;}else if(cgv){$('cgvErr').classList.remove('show');}

    /* Droit de rétractation (art. L221-25 du Code de la consommation) :
       si l'intervention est demandée avant la fin du délai de 14 jours,
       le client doit en faire la demande expresse et reconnaître qu'il
       perdra son droit une fois la prestation pleinement exécutée. */
    const retract=$('retract');
    if(retract){
      const joursAvant=state.date?Math.ceil((state.date-new Date())/86400000):0;
      if(joursAvant<14&&!retract.checked){
        $('retractErr').classList.add('show');ok=false;
      }else{
        $('retractErr').classList.remove('show');
      }
    }

    if(!ok){const f=form.querySelector('.err,.errmsg.show');if(f)f.scrollIntoView({behavior:'smooth',block:'center'});return}

    const ref='EP-'+Math.floor(100000+Math.random()*900000);
    const modele=currentSvc()==='s4'?clean($('modele').value,120):'';
    const matFull=modele?`${clean(materiel.value,120)} — ${modele}`:clean(materiel.value,120);
    const d={ref,date:new Date().toLocaleDateString('fr-FR',{day:'2-digit',month:'long',year:'numeric'}),
      svc:state.svcShort,matFull,mode:state.mode,
      ville:m2.checked?clean($('ville').value,120):'',adr:m2.checked?clean($('adr').value,160):'',
      dateLabel:state.dateLabel,time:state.time,msg:clean($('msg').value,2000),
      nom:clean($('nom').value,120),tel:clean($('tel').value,30),email:clean(em,150)};

    // récap à l'écran
    let rows=
      `<div class="l"><span class="k">Référence</span><span class="v mono">${esc(d.ref)}</span></div>`+
      `<div class="l"><span class="k">Prestation</span><span class="v">${esc(d.svc)}</span></div>`+
      `<div class="l"><span class="k">Matériel</span><span class="v">${esc(d.matFull)}</span></div>`+
      `<div class="l"><span class="k">Mode</span><span class="v">${esc(d.mode)}</span></div>`;
    if(m2.checked) rows+=`<div class="l"><span class="k">Ville</span><span class="v">${esc(d.ville)}</span></div>`;
    rows+=
      `<div class="l"><span class="k">Date</span><span class="v">${esc(d.dateLabel)}</span></div>`+
      `<div class="l"><span class="k">Horaire</span><span class="v">${esc(d.time)}</span></div>`;
    $('recap').innerHTML=rows;

    // enregistre le créneau (bloque ±1h) + recolore
    store[state.iso]=bookedFor(state.iso).concat(state.time);
    saveStore(store);recolorPills();

    // PDF de marque (récapitulatif RDV)
    const doc=window.EP.buildRdvPDF(d), blob=doc.output('blob'),
          url=URL.createObjectURL(blob), fname=`RDV_EPIOS_${d.ref}.pdf`;
    const dl=$('rdvDl'); if(dl){dl.href=url;dl.setAttribute('download',fname);}

    form.style.display='none';const s=$('success');s.classList.add('show');s.scrollIntoView({behavior:'smooth',block:'center'});

    // e-mail automatique -> RENDEZ-VOUS
    const st=$('mailStatus');
    if(emailjsReady){
      try{
        emailjs.init({publicKey:EMAILJS.publicKey});
        const b64=doc.output('datauristring').split(',')[1];
        await emailjs.send(EMAILJS.serviceId,EMAILJS.templateRdv,{
          type:'RENDEZ-VOUS',
          subject:`[RDV] ${d.ref} — ${d.dateLabel} ${d.time}`,
          to_email:DEST_EMAIL,reference:d.ref,date:d.date,
          prestation:d.svc,materiel:d.matFull,intervention:d.mode,ville:d.ville||'—',adresse:d.adr||'—',
          rdv_date:d.dateLabel,rdv_heure:d.time,precisions:d.msg||'—',
          client_nom:d.nom,client_tel:d.tel,client_email:d.email,content:b64,filename:fname});
        if(st){st.className='mail-status ok';st.innerHTML=`Rendez-vous envoyé automatiquement à <b>${DEST_EMAIL}</b>.`;}
      }catch(err){if(st){st.className='mail-status warn';st.innerHTML=rdvMailtoFallback(d,fname,"L'envoi automatique a échoué.");}}
    }else if(st){
      st.className='mail-status warn';st.innerHTML=rdvMailtoFallback(d,fname,'Envoi automatique non configuré.');
    }
  });

  fillMats();applyMode();sync();
