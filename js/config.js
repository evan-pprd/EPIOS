/* ===== EPIOS — Configuration partagée =====
   Destinataire de tous les envois automatiques. */
window.EP_DEST_EMAIL = 'contact@epios.fr';

/* EmailJS (compte gratuit emailjs.com). Renseignez ces clés pour l'envoi
   automatique. Deux modèles distincts : un pour les DEVIS, un pour les RENDEZ-VOUS.
   Dans chaque modèle EmailJS, mettez comme "Subject" : {{subject}}
   et une pièce jointe utilisant {{content}} (base64) + {{filename}}.
   Tant que les clés ne sont pas renseignées, un envoi manuel pré-rempli prend le relais. */
window.EP_EMAILJS = {
  publicKey:   'REMPLACER_PUBLIC_KEY',
  serviceId:   'REMPLACER_SERVICE_ID',
  templateDevis: 'REMPLACER_TEMPLATE_DEVIS',
  templateRdv:   'REMPLACER_TEMPLATE_RDV'
};
window.EP_EMAILJS_READY = !window.EP_EMAILJS.publicKey.startsWith('REMPLACER');
