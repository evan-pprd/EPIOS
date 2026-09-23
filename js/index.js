  const btn=document.getElementById('menuBtn'),menu=document.getElementById('menu');
  btn.addEventListener('click',()=>menu.classList.toggle('open'));
  menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>menu.classList.remove('open')));

  // ===== Avis clients =====
  const STAR_PATH="M11.48 3.5a.56.56 0 0 1 1.04 0l2.12 5.11a.56.56 0 0 0 .48.35l5.52.44c.5.04.7.66.32.99l-4.2 3.6a.56.56 0 0 0-.19.56l1.29 5.38a.56.56 0 0 1-.84.61l-4.73-2.88a.56.56 0 0 0-.58 0l-4.73 2.88a.56.56 0 0 1-.84-.61l1.29-5.38a.56.56 0 0 0-.19-.56l-4.2-3.6a.56.56 0 0 1 .32-.99l5.52-.44a.56.56 0 0 0 .48-.35Z";

  /* ATTENTION — Publier de faux avis constitue une pratique commerciale
     trompeuse (art. L121-2 et L132-2 du Code de la consommation).
     N'ajoutez ici QUE des avis réellement reçus de clients réels, après
     avoir vérifié que l'intervention a bien eu lieu.
     Format : {name:'Prénom N.', city:'Ville', rating:5, text:'…', verified:true} */
  const PUBLISHED_REVIEWS=[];

  let reviews=PUBLISHED_REVIEWS.slice();
  let expanded=false;
  const SHOWN_LIMIT=4;
  const AV_COLORS=['#0B6FB8','#0FA69C','#FF6B4A','#F7A81B','#08517F','#0B857D'];
  function starSVG(f){return f
    ?'<svg class="star-full" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width=".5"><path d="'+STAR_PATH+'"/></svg>'
    :'<svg class="star-empty" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="'+STAR_PATH+'"/></svg>';}
  function starsRow(n){let s='';for(let i=1;i<=5;i++)s+=starSVG(i<=n);return s;}
  function initials(name){const p=name.trim().split(/\s+/);return ((p[0]&&p[0][0]||'')+(p[1]&&p[1][0]||'')).toUpperCase()||'?';}
  function esc(t){const d=document.createElement('div');d.textContent=t;return d.innerHTML;}
  function renderReviews(){
    const grid=document.getElementById('reviewGrid');
    const summary=document.querySelector('.reviews-summary');
    const moreBtnEl=document.getElementById('moreBtn');

    // Aucun avis publié : on masque la moyenne (afficher une note sans avis
    // réels serait trompeur) et on affiche un état vide honnête.
    if(!reviews.length){
      if(summary) summary.style.display='none';
      if(moreBtnEl) moreBtnEl.classList.add('hide');
      grid.innerHTML='<div class="review-empty">'+
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H8l-4 4V5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2Z"/></svg>'+
        '<h4>Aucun avis publié pour le moment</h4>'+
        '<p>EPIOS est une activité récente. Les premiers avis apparaîtront ici dès que des clients auront partagé leur expérience — et seront tous vérifiés avant publication.</p>'+
        '</div>';
      return;
    }
    if(summary) summary.style.display='';

    const sorted=reviews.slice().sort((a,b)=>b.rating-a.rating);
    const shown=expanded?sorted:sorted.slice(0,SHOWN_LIMIT);
    grid.innerHTML=shown.map((r,i)=>{
      const col=AV_COLORS[i%AV_COLORS.length];
      return '<div class="review-card">'+
        '<div class="rc-top">'+
          '<span class="rc-avatar" style="background:'+col+'">'+esc(initials(r.name))+'</span>'+
          '<span class="rc-id"><span class="nm">'+esc(r.name)+'</span><span class="mt">'+(r.city?esc(r.city)+' · ':'')+(r.verified?'Client vérifié':'Nouvel avis')+'</span></span>'+
        '</div>'+
        '<div class="rc-stars stars">'+starsRow(r.rating)+'</div>'+
        '<p>'+esc(r.text)+'</p>'+
        (r.verified?'<span class="rc-badge">✓ Intervention réalisée</span>':'')+
      '</div>';
    }).join('');
    const avg=reviews.reduce((a,r)=>a+r.rating,0)/reviews.length;
    document.getElementById('avgScore').textContent=avg.toFixed(1).replace('.',',');
    document.getElementById('avgStars').innerHTML=starsRow(Math.round(avg));
    document.getElementById('rsCount').textContent='sur '+reviews.length+' avis';
    const moreBtn=document.getElementById('moreBtn');
    const chev=' <svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>';
    if(reviews.length<=SHOWN_LIMIT){moreBtn.classList.add('hide')}
    else{
      moreBtn.classList.remove('hide');
      moreBtn.classList.toggle('open',expanded);
      moreBtn.innerHTML=(expanded?'Voir moins':"Voir plus d'avis ("+(reviews.length-SHOWN_LIMIT)+')')+chev;
    }
  }
  let currentRating=0;
  const starInput=document.getElementById('starInput');
  function paintStars(n){[].forEach.call(starInput.children,(b,idx)=>b.classList.toggle('on',idx<n));}
  for(let i=1;i<=5;i++){
    const b=document.createElement('button');b.type='button';b.setAttribute('role','radio');b.setAttribute('aria-label',i+(i>1?' étoiles':' étoile'));
    b.innerHTML='<svg viewBox="0 0 24 24" fill="currentColor"><path d="'+STAR_PATH+'"/></svg>';
    b.addEventListener('click',()=>{currentRating=i;paintStars(i)});
    b.addEventListener('mouseenter',()=>paintStars(i));
    starInput.appendChild(b);
  }
  starInput.addEventListener('mouseleave',()=>paintStars(currentRating));
  document.getElementById('rvSubmit').addEventListener('click',()=>{
    const name=document.getElementById('rvName').value.trim();
    const city=document.getElementById('rvCity').value.trim();
    const text=document.getElementById('rvText').value.trim();
    const err=document.getElementById('rvErr');
    const consent=document.getElementById('rvConsent');
    if(!currentRating||name===''||text.length<4||(consent&&!consent.checked)){err.classList.add('show');return}
    err.classList.remove('show');

    /* L'avis n'est PAS publié automatiquement : il est transmis à EPIOS qui
       vérifie qu'une intervention a bien eu lieu avant de le mettre en ligne.
       C'est ce que prévoit l'art. L111-7-2 du Code de la consommation. */
    const DEST='contact@epios.fr';
    const subject=encodeURIComponent('[AVIS] '+currentRating+'/5 — '+name+(city?' ('+city+')':''));
    const body=encodeURIComponent(
      'NOUVEL AVIS CLIENT\n\n'+
      'Note : '+currentRating+'/5\n'+
      'Prénom : '+name+'\n'+
      'Ville : '+(city||'—')+'\n\n'+
      'Message :\n'+text+'\n\n'+
      '— Envoyé depuis le formulaire d\u2019avis du site EPIOS.'
    );
    window.location.href='mailto:'+DEST+'?subject='+subject+'&body='+body;

    document.getElementById('rfForm').style.display='none';
    const s=document.getElementById('rfSuccess');s.classList.add('show');
    setTimeout(()=>{
      s.classList.remove('show');document.getElementById('rfForm').style.display='';
      document.getElementById('rvName').value='';document.getElementById('rvCity').value='';document.getElementById('rvText').value='';
      if(consent) consent.checked=false;
      currentRating=0;paintStars(0);
    },6000);
  });
  document.getElementById('moreBtn').addEventListener('click',()=>{expanded=!expanded;renderReviews();if(!expanded)document.getElementById('avis').scrollIntoView({behavior:'smooth',block:'start'})});
  renderReviews();

  // scroll reveal
  const rv=document.querySelectorAll('.reveal');
  if('IntersectionObserver'in window){
    const io=new IntersectionObserver((es)=>{es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{threshold:.12});
    rv.forEach(el=>io.observe(el));
  }else{rv.forEach(el=>el.classList.add('in'))}
