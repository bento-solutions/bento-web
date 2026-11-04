import { builders } from './lexical'

const { p, h2, ul, ol, quote, table, block, doc } = builders()

/**
 * Sample articles, written to show the design with real text and to give the team a model to follow.
 * They are not checked by an accountant or a lawyer. Review or replace them before going public.
 */
export const samplePosts = [
  {
    key: 'whatsapp',
    category: 'marketing',
    cover: 'contacts',
    publishedAt: '2026-09-22T09:00:00.000Z',
    title: 'WhatsApp Business : garder le contact sans fâcher vos clients',
    excerpt:
      'Vos clients lisent WhatsApp avant leurs e-mails. Voici comment en profiter sans passer pour un spammeur ni perdre leur confiance.',
    metaDescription:
      'Comment utiliser WhatsApp Business avec vos clients au Maroc : consentement, fréquence, messages utiles et erreurs à éviter.',
    targetKeyword: 'whatsapp business maroc',
    body: doc(
      p('Au Maroc, WhatsApp est souvent le premier réflexe : on y demande un devis, un horaire, une adresse. Pour une petite entreprise, c’est le canal le plus direct qui existe. C’est aussi celui où une mauvaise habitude se paie le plus vite, car un client agacé bloque le numéro en deux secondes.'),
      h2('Demandez la permission avant le premier message'),
      p('Un client qui vous a donné son numéro pour une livraison n’a pas accepté de recevoir vos promotions. Demandez-lui, simplement, et gardez une trace de sa réponse.'),
      quote('« Souhaitez-vous recevoir nos offres sur WhatsApp, une à deux fois par mois ? Vous pourrez arrêter à tout moment. »'),
      block('callout', {
        kind: 'note',
        text: 'Au Maroc, la loi 09-08 encadre l’usage des données personnelles et la CNDP veille à son application. Faites vérifier votre pratique par votre conseil si vous envoyez des messages à grande échelle.',
      }),
      h2('Envoyez moins, mais envoyez utile'),
      p('Un bon message aide le client à faire quelque chose. Il ne cherche pas seulement à exister dans sa liste de conversations.'),
      ul([
        '**Utile :** « Votre commande est prête, nous fermons à 19 h. »',
        '**Utile :** « Votre rendez-vous est demain à 10 h. Répondez 1 pour confirmer. »',
        '**Inutile :** « Bonjour ! Découvrez toutes nos offres incroyables !!! »',
      ]),
      h2('Organisez les réponses avant d’avoir un problème'),
      p('Tant qu’une seule personne répond depuis son téléphone, tout va bien. Dès que deux collègues partagent le numéro, les messages se perdent. Trois habitudes règlent l’essentiel :'),
      ol([
        'Des réponses enregistrées pour les questions qui reviennent : horaires, adresse, tarifs.',
        'Une personne responsable de chaque conversation, pour que le client n’ait pas à se répéter.',
        'Un message d’absence honnête, avec l’heure à laquelle vous répondrez.',
      ]),
      block('cta', {
        product: 'crm',
        title: 'Vos conversations WhatsApp, reliées à vos clients',
        text: 'Retrouvez l’historique de chaque client au même endroit, avec ses devis et ses factures.',
        buttonLabel: 'Découvrir CRM Bento',
      }),
    ),
  },
  {
    key: 'cabinet',
    category: 'sante',
    cover: 'cabinet',
    publishedAt: '2026-10-06T09:00:00.000Z',
    title: 'Cabinet dentaire : comment réduire les rendez-vous manqués',
    excerpt:
      'Un fauteuil vide coûte cher et se voit rarement sur un tableur. Quatre habitudes simples pour que les patients viennent vraiment.',
    metaDescription:
      'Quatre habitudes simples pour réduire les rendez-vous manqués dans un cabinet dentaire ou d’orthodontie : rappels, confirmation et liste d’attente.',
    targetKeyword: 'rendez-vous manqués cabinet dentaire',
    body: doc(
      p('Un patient qui ne vient pas, c’est un créneau payé deux fois : le temps de l’équipe est perdu, et un autre patient aurait pu en profiter. La plupart des absences ne viennent pas d’un manque de sérieux, mais d’un oubli ou d’un empêchement que personne n’a eu le temps de signaler.'),
      h2('Rappelez au bon moment, sur le bon canal'),
      p('Un rappel la veille, sur WhatsApp, fonctionne mieux qu’un appel que personne ne décroche. Pour un long traitement, ajoutez un rappel quelques jours avant.'),
      h2('Rendez l’annulation facile'),
      p('Cela semble contre-intuitif. Pourtant, un patient qui peut annuler d’un simple message le fait à temps, et le créneau peut encore servir.'),
      block('callout', {
        kind: 'tip',
        text: 'Terminez le rappel par une consigne claire : « Répondez 1 pour confirmer, 2 pour déplacer. » Votre accueil voit immédiatement où en est la journée.',
      }),
      h2('Gardez une liste d’attente'),
      p('Notez les patients qui préféreraient venir plus tôt. Quand un créneau se libère, votre accueil sait tout de suite qui appeler, sans chercher.'),
      h2('Regardez les chiffres une fois par mois'),
      p('Comptez les absences par jour et par type de soin. Les causes sautent souvent aux yeux : un créneau trop matinal, un traitement long où la motivation baisse, un rappel qui n’est pas parti.'),
      block('cta', {
        product: 'orthoflow',
        title: 'Un CRM conçu pour les cabinets',
        text: 'OrthoFlow a été pensé pour le fonctionnement réel des cabinets d’orthodontie et dentaires.',
        buttonLabel: 'Découvrir OrthoFlow',
      }),
    ),
  },
  {
    key: 'relance',
    category: 'tresorerie',
    cover: 'relance',
    publishedAt: '2026-10-14T09:00:00.000Z',
    title: 'Relancer un impayé sans fâcher le client : la méthode en trois messages',
    excerpt:
      'La plupart des retards ne sont pas de la mauvaise foi. Trois messages, envoyés au bon moment, suffisent souvent à se faire payer et à garder le client.',
    metaDescription:
      'Une méthode simple en trois messages pour relancer une facture impayée au Maroc sans abîmer la relation avec votre client. Modèles inclus.',
    targetKeyword: 'relancer facture impayée',
    body: doc(
      p('Personne n’aime réclamer son argent. Alors on attend, on se dit que le client va bien finir par payer, et la trésorerie en souffre. Pourtant, une relance bien écrite n’a rien d’agressif : c’est un service rendu à quelqu’un qui a simplement oublié.'),
      h2('Premier message : le rappel amical'),
      p('À envoyer un ou deux jours après l’échéance. Partez du principe qu’il s’agit d’un oubli, parce que c’est le plus souvent le cas.'),
      quote('« Bonjour Karim, petit rappel pour la facture F-0142 de 12 480 MAD, arrivée à échéance lundi. Dites-moi si vous avez besoin d’un nouvel exemplaire. Bonne journée ! »'),
      h2('Deuxième message : la question directe'),
      p('Une semaine plus tard, sans réponse. Demandez une date, pas une explication.'),
      quote('« Bonjour Karim, la facture F-0142 reste ouverte de notre côté. Pouvez-vous me donner une date de règlement pour que je l’indique à notre comptabilité ? »'),
      h2('Troisième message : le cadre'),
      p('Après deux semaines ou plus. Restez courtois, mais précisez ce qui se passera ensuite. Proposez aussi une sortie, comme un paiement en deux fois.'),
      quote('« Bonjour Karim, sans règlement au 30, nous devrons suspendre les prochaines livraisons. Si un paiement en deux fois vous aide, je peux vous le proposer dès aujourd’hui. »'),
      block('callout', {
        kind: 'tip',
        text: 'Notez chaque relance à côté de la facture. Le jour où un dossier devient difficile, vous saurez exactement ce qui a été dit et quand.',
      }),
      h2('Évitez les retards dès le départ'),
      ul([
        'Indiquez la date d’échéance et le RIB sur chaque facture, bien en évidence.',
        'Envoyez la facture le jour même de la livraison, pas à la fin du mois.',
        'Pour une grosse commande, demandez un acompte.',
      ]),
      block('faq', {
        items: [
          {
            id: 'a1b2c3d4e5f60718293a4b5c',
            question: 'Quand envoyer la première relance ?',
            answer: 'Un ou deux jours après la date d’échéance. Plus vous attendez, plus le sujet devient gênant pour les deux côtés.',
          },
          {
            id: 'b2c3d4e5f60718293a4b5c6d',
            question: 'Faut-il relancer par écrit ou par téléphone ?',
            answer: 'Commencez par écrit, pour garder une trace, puis appelez si le deuxième message reste sans réponse.',
          },
        ],
      }),
      block('cta', {
        product: 'crm',
        title: 'Ne laissez plus une facture sortir de votre radar',
        text: 'Suivez vos échéances et vos relances au même endroit que vos clients.',
        buttonLabel: 'Découvrir CRM Bento',
      }),
    ),
  },
  {
    key: 'facture',
    category: 'facturation',
    cover: 'facture',
    publishedAt: '2026-10-22T09:00:00.000Z',
    title: 'Facture au Maroc : les mentions à ne pas oublier',
    excerpt:
      'ICE, identifiant fiscal, TVA, mode de paiement : la liste des informations à vérifier sur vos factures, et les erreurs que l’on voit le plus souvent.',
    metaDescription:
      'Les mentions à faire figurer sur une facture au Maroc : ICE, identifiant fiscal, numérotation, TVA et mode de paiement. La liste à vérifier.',
    targetKeyword: 'mentions obligatoires facture maroc',
    body: doc(
      p('Une facture incomplète, c’est un client qui la renvoie, un paiement qui prend du retard et parfois un problème lors d’un contrôle. La bonne nouvelle : une fois votre modèle correct, vous n’y pensez plus jamais.'),
      block('callout', {
        kind: 'warning',
        text: 'Cette liste est un aide-mémoire, pas un avis juridique ou fiscal. Les règles évoluent : faites valider votre modèle par votre comptable.',
      }),
      h2('Ce qui identifie votre entreprise'),
      ul([
        'Raison sociale et adresse',
        'Identifiant commun de l’entreprise (**ICE**)',
        'Identifiant fiscal (IF), registre de commerce (RC), patente et numéro CNSS',
      ]),
      h2('Ce qui identifie la vente'),
      table([
        ['Mention', 'Exemple', 'Erreur fréquente'],
        ['Numéro de facture', 'F-2026-0142', 'Des trous dans la numérotation'],
        ['Date', '22/10/2026', 'Date de saisie au lieu de la date de vente'],
        ['Client', 'Raison sociale et ICE', 'ICE du client absent'],
        ['Désignation', '6 pièces de rechange', '« Divers » ou « prestation »'],
        ['Montants', 'HT, taux de TVA, TTC', 'TVA calculée sur le mauvais taux'],
        ['Paiement', 'Virement, 30 jours', 'Mode ou échéance oubliés'],
      ]),
      h2('Numérotez sans jamais revenir en arrière'),
      p('Les factures doivent se suivre, sans trou. Si une facture est erronée, ne la supprimez pas : établissez un avoir. C’est l’erreur classique des fichiers Excel copiés d’un mois sur l’autre.'),
      h2('Le plus simple : ne plus la refaire à la main'),
      p('Un logiciel remplit les mentions, calcule la TVA et numérote à votre place. Vous gagnez du temps, mais surtout, vous n’avez plus à vérifier chaque ligne. Si vous hésitez encore, lisez aussi [à quel moment quitter le tableur](/blog/tableur-ou-crm-a-quel-moment-faut-il-changer).'),
      block('cta', {
        product: 'core',
        title: 'Factures et devis, sans ressaisie',
        text: 'BentoCore ERP relie votre stock, votre caisse et votre facturation.',
        buttonLabel: 'Découvrir BentoCore ERP',
      }),
    ),
  },
  {
    key: 'chiffres',
    category: 'pilotage',
    cover: 'pilotage',
    publishedAt: '2026-10-29T09:00:00.000Z',
    title: 'Les cinq chiffres à regarder chaque lundi matin',
    excerpt:
      'Pas besoin d’un tableau de bord compliqué pour piloter une petite entreprise. Cinq chiffres et dix minutes suffisent pour voir venir les problèmes.',
    metaDescription:
      'Cinq indicateurs simples à suivre chaque semaine pour piloter une PME : encaissements, devis, impayés, taux de conversion et trésorerie.',
    targetKeyword: 'indicateurs pme',
    body: doc(
      p('Beaucoup de dirigeants découvrent un problème de trésorerie quand il est déjà là. Pourtant, les signes étaient visibles plusieurs semaines plus tôt. Il suffit de regarder les mêmes chiffres, au même moment, chaque semaine.'),
      h2('Les cinq chiffres'),
      ol([
        '**Les encaissements de la semaine.** Pas le chiffre d’affaires facturé : l’argent réellement arrivé.',
        '**Les devis envoyés.** Ils annoncent vos ventes des prochaines semaines.',
        '**Les impayés.** Le montant total, et surtout celui qui dépasse 30 jours.',
        '**Le taux de conversion.** Sur dix devis, combien deviennent une vente ?',
        '**La trésorerie disponible.** Combien de semaines de charges pouvez-vous couvrir ?',
      ]),
      h2('Lisez la tendance, pas le chiffre'),
      p('Un chiffre isolé ne dit presque rien. Ce qui compte, c’est le sens : trois semaines de baisse des devis annoncent un mois difficile, bien avant que le compte en banque ne le montre.'),
      block('callout', {
        kind: 'tip',
        text: 'Bloquez dix minutes le lundi à la même heure, et notez les cinq chiffres sur la même feuille. Au bout d’un mois, vous verrez déjà des choses que vous ne voyiez pas.',
      }),
      h2('Que faire quand un chiffre décroche ?'),
      ul([
        'Moins de devis : relancez vos anciens clients avant de chercher de nouveaux prospects.',
        'Plus d’impayés : appliquez une [méthode de relance simple](/blog/relancer-un-impaye-sans-facher-le-client-la-methode-en-trois-messages).',
        'Moins de trésorerie : décalez une dépense et demandez des acomptes sur les grosses commandes.',
      ]),
      block('cta', {
        product: 'bento212',
        title: 'Vos chiffres, sans les chercher',
        text: 'Bento212 réunit ventes, factures et équipes dans un seul espace de travail.',
        buttonLabel: 'Découvrir Bento212',
      }),
    ),
  },
  {
    key: 'tableur',
    category: 'clients',
    cover: 'clients',
    featured: true,
    publishedAt: '2026-11-03T09:00:00.000Z',
    title: 'Tableur ou CRM : à quel moment faut-il changer ?',
    excerpt:
      'Excel suffit largement au début. Voici les cinq signes concrets qui montrent que votre fichier clients commence à vous coûter des ventes.',
    metaDescription:
      'Tableur ou CRM ? Cinq signes concrets qui montrent qu’il est temps de quitter Excel, et comment changer sans tout casser dans votre PME.',
    targetKeyword: 'tableur ou crm',
    body: doc(
      p('Le tableur a tout pour lui : il est déjà installé, tout le monde sait s’en servir et il ne coûte rien. Pour une entreprise qui démarre, c’est souvent le bon choix. La vraie question n’est donc pas de savoir si Excel est un mauvais outil, mais à quel moment il commence à vous freiner.'),
      h2('Le tableur n’est pas le problème'),
      p('Tant qu’une seule personne suit quelques dizaines de clients, un fichier bien tenu fait très bien le travail. Les ennuis commencent quand l’entreprise grandit et que le fichier, lui, ne change pas.'),
      h2('Cinq signes qu’il est temps de changer'),
      ol([
        '**Il existe plusieurs versions du fichier.** « Clients_final_v3 » circule sur WhatsApp, et personne ne sait laquelle est la bonne.',
        '**Vous oubliez des relances.** Un devis envoyé il y a dix jours n’a jamais été suivi, et vous l’apprenez trop tard.',
        '**Un départ fait peur.** Si un commercial s’en va, ses clients et son historique partent avec lui.',
        '**Vous ne savez pas répondre vite.** « Combien de devis ce mois-ci ? » demande une heure de travail.',
        '**Vous ressaisissez.** Le même client est tapé dans le devis, dans la facture et dans le fichier de suivi.',
      ]),
      block('callout', {
        kind: 'tip',
        text: 'Deux de ces signes suffisent pour commencer à regarder ailleurs. À partir de trois, le tableur vous coûte probablement plus cher qu’un logiciel.',
      }),
      h2('Ce qui change vraiment avec un CRM'),
      table([
        ['Situation', 'Avec un tableur', 'Avec un CRM'],
        ['Un client appelle', 'Vous cherchez dans plusieurs fichiers', 'Sa fiche et son historique s’affichent'],
        ['Un devis attend', 'Il faut y penser', 'Un rappel arrive au bon moment'],
        ['Un collègue s’absente', 'Il faut retrouver son fichier', 'Toute l’équipe voit le dossier'],
        ['Le point du lundi', 'Une heure de calculs', 'Les chiffres sont déjà là'],
      ]),
      h2('Comment changer sans tout casser'),
      ul([
        '**Commencez petit.** Une seule équipe, un seul processus : par exemple, le suivi des devis.',
        '**Nettoyez d’abord.** Supprimez les doublons avant d’importer votre fichier, pas après.',
        '**Gardez Excel un mois.** Les deux outils peuvent cohabiter le temps que l’équipe prenne ses habitudes.',
        '**Montrez le gain tout de suite.** Une relance automatique qui aboutit convainc mieux qu’une formation.',
      ]),
      block('cta', {
        product: 'crm',
        title: 'Essayez avec vos vrais clients',
        text: 'CRM Bento réunit prospects, devis et factures, et s’adapte aux entreprises marocaines.',
        buttonLabel: 'Découvrir CRM Bento',
      }),
      block('faq', {
        items: [
          {
            id: 'c3d4e5f60718293a4b5c6d7e',
            question: 'À partir de combien de clients faut-il un CRM ?',
            answer: 'Il n’y a pas de seuil précis. Dès que plusieurs personnes suivent les mêmes clients, ou que vous oubliez des relances, un CRM devient utile.',
          },
          {
            id: 'd4e5f60718293a4b5c6d7e8f',
            question: 'Peut-on importer un fichier Excel dans un CRM ?',
            answer: 'Oui, la plupart des CRM importent un fichier Excel ou CSV. Prenez le temps de le nettoyer avant, c’est ce qui fait la qualité du résultat.',
          },
        ],
      }),
    ),
  },
]

const en = builders('ltr')
const ar = builders('rtl')

/** Shows the language links and hreflang working. Only loaded with SEED_TRANSLATIONS=1. */
export const sampleTranslations = {
  tableur: {
    en: {
      title: 'Spreadsheet or CRM: when is it time to switch?',
      excerpt:
        'Excel is plenty when you start out. Here are five concrete signs that your customer file has started costing you sales.',
      metaDescription:
        'Spreadsheet or CRM? Five concrete signs it is time to leave Excel behind, and how to switch without breaking anything in your business.',
      body: en.doc(
        en.p('Spreadsheets have a lot going for them: they are already installed, everyone can use them and they cost nothing. The real question is when they start holding you back.'),
        en.h2('Five signs it is time to switch'),
        en.ol([
          '**Several versions of the file exist.** Nobody knows which one is right.',
          '**You forget to follow up.** A quote sent ten days ago was never chased.',
          '**A resignation scares you.** When a salesperson leaves, their customers leave with them.',
          '**You cannot answer quickly.** “How many quotes this month?” takes an hour.',
          '**You retype everything.** The same customer goes into the quote, the invoice and the tracker.',
        ]),
        en.h2('How to switch without breaking anything'),
        en.ul(['Start small, with one team and one process.', 'Clean your file before importing it.', 'Keep Excel for a month while habits form.']),
      ),
    },
    ar: {
      title: 'جدول بيانات أم CRM: متى يحين وقت التغيير؟',
      excerpt: 'يكفي Excel تمامًا في البداية. إليك خمس علامات ملموسة تدل على أن ملف زبنائك بدأ يكلفك مبيعات.',
      metaDescription:
        'جدول بيانات أم CRM؟ خمس علامات ملموسة تدل على أن وقت مغادرة Excel قد حان، وكيف تنتقل دون أن تعطل عمل مقاولتك الصغيرة.',
      body: ar.doc(
        ar.p('لجداول البيانات مزايا كثيرة: فهي مثبتة مسبقًا، ويعرف الجميع استخدامها، ولا تكلف شيئًا. لكن السؤال الحقيقي هو: متى تبدأ في إعاقتك؟'),
        ar.h2('خمس علامات تدل على أن وقت التغيير قد حان'),
        ar.ol([
          '**توجد عدة نسخ من الملف.** ولا أحد يعرف أيها الصحيحة.',
          '**تنسى المتابعة.** عرض سعر أُرسل قبل عشرة أيام ولم يتابعه أحد.',
          '**تخشى رحيل موظف.** حين يغادر مندوب المبيعات، يغادر زبناؤه معه.',
          '**لا تستطيع الإجابة بسرعة.** «كم عرض سعر هذا الشهر؟» يتطلب ساعة من العمل.',
          '**تعيد إدخال البيانات.** الزبون نفسه يُكتب في العرض والفاتورة وملف المتابعة.',
        ]),
        ar.h2('كيف تنتقل دون تعطيل عملك'),
        ar.ul(['ابدأ صغيرًا، بفريق واحد وعملية واحدة.', 'نظّف ملفك قبل استيراده.', 'احتفظ بـ Excel لمدة شهر حتى تترسخ العادات الجديدة.']),
      ),
    },
  },
}

export const sampleCategories = [
  { key: 'clients', tone: 'clay', order: 10, fr: 'Clients', en: 'Customers', ar: 'الزبناء', description: 'Trouver, suivre et garder vos clients, avec ou sans CRM.' },
  { key: 'facturation', tone: 'copper', order: 20, fr: 'Facturation', en: 'Invoicing', ar: 'الفوترة', description: 'Des factures justes et envoyées à temps, sans ressaisie.' },
  { key: 'tresorerie', tone: 'green', order: 30, fr: 'Trésorerie', en: 'Cash flow', ar: 'الخزينة', description: 'Se faire payer à l’heure et voir venir les mois difficiles.' },
  { key: 'pilotage', tone: 'violet', order: 40, fr: 'Pilotage', en: 'Running the business', ar: 'التسيير', description: 'Les chiffres et les habitudes qui aident à décider.' },
  { key: 'marketing', tone: 'ochre', order: 50, fr: 'WhatsApp et marketing', en: 'WhatsApp and marketing', ar: 'واتساب والتسويق', description: 'Parler à vos clients là où ils vous lisent vraiment.' },
  { key: 'sante', tone: 'teal', order: 60, fr: 'Santé', en: 'Healthcare', ar: 'الصحة', description: 'Pour les cabinets dentaires et d’orthodontie.' },
]

export const sampleCovers = [
  { key: 'clients', file: 'clients.mp4', poster: 'clients-poster.png', alt: 'Une fiche client claire posée sur un long tableur qui défile.', altEn: 'A clean customer record resting on a long scrolling spreadsheet.', altAr: 'بطاقة زبون واضحة فوق جدول بيانات طويل يتحرك.' },
  { key: 'facture', file: 'facture.mp4', poster: 'facture-poster.png', alt: 'Une facture sur laquelle un tampon vient marquer « Payée ».', altEn: 'An invoice being stamped as paid.', altAr: 'فاتورة يُختم عليها بعبارة «مؤداة».' },
  { key: 'relance', file: 'relance.mp4', poster: 'relance-poster.png', alt: 'Une conversation courtoise au sujet d’une facture, qui se termine par un règlement.', altEn: 'A polite conversation about an invoice that ends with a payment.', altAr: 'محادثة مهذبة حول فاتورة تنتهي بالأداء.' },
  { key: 'pilotage', file: 'pilotage.mp4', poster: 'pilotage-poster.png', alt: 'Cinq indicateurs de gestion présentés comme les lignes d’un registre.', altEn: 'Five business figures shown like the rows of a ledger.', altAr: 'خمسة مؤشرات تسيير معروضة كأسطر في سجل.' },
  { key: 'cabinet', file: 'cabinet.png', alt: 'Un planning hebdomadaire de cabinet, avec des créneaux pleins, libres et annulés.', altEn: 'A weekly clinic schedule with full, free and cancelled slots.', altAr: 'جدول أسبوعي لعيادة، فيه مواعيد ممتلئة وفارغة وملغاة.' },
  { key: 'contacts', file: 'contacts.png', alt: 'Une liste de conversations clients bien rangée.', altEn: 'A tidy list of customer conversations.', altAr: 'قائمة مرتبة لمحادثات الزبناء.' },
] as const
