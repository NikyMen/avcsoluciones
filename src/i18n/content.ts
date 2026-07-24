export type Lang = 'es' | 'en' | 'pt';

export const languages: { code: Lang; label: string; flag: string }[] = [
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'pt', label: 'Português', flag: '🇧🇷' },
];

/** Build a locale-aware path. ES is the default locale (no prefix). */
export function localizedPath(lang: Lang, path = ''): string {
  const clean = path.replace(/^\//, '');
  const base = lang === 'es' ? '/' : `/${lang}/`;
  return (base + clean).replace(/\/+$/, '/').replace(/\/$/, clean ? '' : '/');
}

export interface Content {
  lang: Lang;
  htmlLang: string;
  nav: { inicio: string; nosotros: string; equipo: string; servicios: string; sectores: string; inversionistas: string; acuerdos: string; contacto: string };
  cta: { services: string; contact: string };
  hero: {
    badge: string;
    title: string;
    titleAccent: string;
    subtitle: string;
    primary: string;
    secondary: string;
    stats: { value: string; label: string }[];
  };
  about: {
    eyebrow: string;
    title: string;
    lead: string;
    description: string;
    mission: { title: string; text: string };
    vision: { title: string; text: string };
    valuesTitle: string;
    values: string[];
    differentialsTitle: string;
    differentials: { title: string; text: string }[];
  };
  services: {
    eyebrow: string;
    title: string;
    lead: string;
    items: { icon: string; name: string; desc: string; target: string }[];
    targetLabel: string;
  };
  sectors: {
    eyebrow: string;
    title: string;
    lead: string;
    items: { icon: string; name: string; desc: string }[];
  };
  investors: {
    eyebrow: string;
    title: string;
    lead: string;
    heroCaption: string;
    summaryTitle: string;
    summary: { title: string; text: string }[];
    highlights: string[];
    downloadTitle: string;
    downloadText: string;
    download: string;
    downloadNote: string;
  };
  team: {
    eyebrow: string;
    title: string;
    lead: string;
    note: string;
    members: { name: string; role: string; bio: string }[];
  };
  allies: {
    eyebrow: string;
    title: string;
    lead: string;
    note: string;
    items: string[];
  };
  contact: {
    eyebrow: string;
    title: string;
    lead: string;
    whatsapp: string;
    email: string;
    address: string;
    hours: string;
    whatsappValue: string;
    emailValue: string;
    addressValue: string;
    hoursValue: string;
    formTitle: string;
    name: string;
    emailField: string;
    message: string;
    send: string;
  };
  finalCta: { title: string; text: string; button: string };
  footer: {
    tagline: string;
    explore: string;
    contactTitle: string;
    followTitle: string;
    rights: string;
    poweredBy: string;
    legal: string[];
  };
}

const contact = {
  whatsappValue: '+595 991 437 021',
  emailValue: 'info@avcsoluciones.com.py',
  addressValue: 'Tres Centurias Esquina Bandera de la Patria',
  whatsappHref: 'https://wa.me/595991437021',
};

const es: Content = {
  lang: 'es',
  htmlLang: 'es',
  nav: { inicio: 'Inicio', nosotros: 'Nosotros', equipo: 'Equipo', servicios: 'Servicios', sectores: 'Sectores', inversionistas: 'Inversionistas', acuerdos: 'Acuerdos', contacto: 'Contacto' },
  cta: { services: 'Servicios', contact: 'Contacto' },
  hero: {
    badge: 'Consultoría empresarial integral · Paraguay',
    title: 'Impulsamos tu crecimiento con soluciones integrales y',
    titleAccent: 'asesoría experta',
    subtitle: 'AVC Soluciones Empresariales acompaña a empresas y emprendedores con asesoramiento integral y personalizado: contabilidad, finanzas, auditoría, recursos humanos, asesoría jurídica, marketing y tecnología.',
    primary: 'Conversemos',
    secondary: 'Ver servicios',
    stats: [
      { value: '6+', label: 'Áreas de especialización' },
      { value: '100%', label: 'Asesoramiento personalizado' },
      { value: 'PY', label: 'Alcance nacional' },
    ],
  },
  about: {
    eyebrow: 'Nosotros',
    title: 'Tu socio estratégico, no solo un proveedor',
    lead: 'Somos una consultora empresarial que ordena la gestión, asegura el cumplimiento normativo y habilita el crecimiento sostenible.',
    description: 'AVC Soluciones Empresariales E.A.S. brinda asesoramiento integral y personalizado en contabilidad, finanzas, auditoría, recursos humanos, asesoría jurídica y marketing, ayudando a empresas y emprendedores a optimizar su gestión, cumplir normativas y crecer de forma sostenible.',
    mission: {
      title: 'Misión',
      text: 'Brindar soluciones empresariales integrales y asesoría personalizada que permitan a las empresas optimizar sus procesos administrativos, financieros y operativos, fomentando la innovación, el crecimiento sostenible y la competitividad.',
    },
    vision: {
      title: 'Visión',
      text: 'Consolidarnos como una consultora referente en soluciones empresariales integrales en Paraguay, reconocida por su profesionalismo, innovación y acompañamiento estratégico.',
    },
    valuesTitle: 'Nuestros valores',
    values: ['Integridad y ética profesional', 'Compromiso con la excelencia', 'Innovación constante', 'Atención personalizada', 'Desarrollo sostenible de los clientes'],
    differentialsTitle: '¿Qué nos hace diferentes?',
    differentials: [
      { title: 'Oferta integral', text: 'Centralizamos múltiples áreas clave del negocio en un solo proveedor.' },
      { title: 'Asesoramiento a medida', text: 'Adaptado al tamaño, sector y etapa de cada empresa.' },
      { title: 'Tecnología y acompañamiento', text: 'Tecnología adaptada con capacitación continua y acompañamiento real.' },
    ],
  },
  services: {
    eyebrow: 'Servicios',
    title: 'Soluciones para cada área de tu negocio',
    lead: 'Un equipo multidisciplinario que cubre lo administrativo, financiero, legal, humano y tecnológico.',
    targetLabel: 'Dirigido a',
    items: [
      { icon: 'calculator', name: 'Asesoría contable y fiscal', desc: 'Gestión contable integral y cumplimiento tributario conforme a la normativa paraguaya.', target: 'Emprendedores, PYMES y empresas consolidadas.' },
      { icon: 'shield', name: 'Auditorías internas y externas', desc: 'Evaluación de procesos, control interno y estados financieros para transparencia y mejora continua.', target: 'Empresas medianas y grandes.' },
      { icon: 'users', name: 'Gestión de recursos humanos', desc: 'Administración del talento humano, cumplimiento laboral y desarrollo organizacional.', target: 'Empresas en crecimiento.' },
      { icon: 'scale', name: 'Asesoría jurídica notarial empresarial', desc: 'Apoyo legal en contratos, cumplimiento normativo y prevención de riesgos legales.', target: 'Empresas y emprendedores.' },
      { icon: 'megaphone', name: 'Marketing y publicidad', desc: 'Estrategias de marketing digital y posicionamiento de marca orientadas a resultados.', target: 'Empresas que buscan visibilidad y crecimiento comercial.' },
      { icon: 'graduation', name: 'Capacitaciones y acompañamiento', desc: 'Talleres y formación práctica en gestión empresarial para emprendedores y equipos.', target: 'Emprendedores y equipos administrativos.' },
      { icon: 'cpu', name: 'Tecnología y Sistemas', desc: 'Transformación digital, sistemas de gestión e implementación tecnológica adaptada a tu operación.', target: 'Empresas que buscan digitalizar y escalar.' },
    ],
  },
  sectors: {
    eyebrow: 'Sectores',
    title: 'Experiencia en los sectores que mueven la economía',
    lead: 'Acompañamos a organizaciones de distintos rubros con soluciones a la medida de cada industria.',
    items: [
      { icon: 'briefcase', name: 'Servicios profesionales', desc: 'Estudios, firmas y profesionales que necesitan orden administrativo y cumplimiento.' },
      { icon: 'shopping', name: 'Comercio', desc: 'Negocios de compra-venta que buscan eficiencia, control y crecimiento sostenido.' },
      { icon: 'factory', name: 'Industria', desc: 'Plantas y manufactura con operarios y maquinaria que requieren gestión robusta.' },
      { icon: 'wheat', name: 'Agricultura y Ganadería', desc: 'Sector agropecuario con necesidades contables, fiscales y de financiamiento específicas.' },
    ],
  },
  investors: {
    eyebrow: 'Información para inversionistas extranjeros',
    title: 'Invertí en Paraguay con respaldo local',
    lead: 'Acompañamos a inversores del exterior en cada paso: constitución de empresas, régimen tributario, incentivos y cumplimiento normativo.',
    heroCaption: 'Asunción, Paraguay',
    summaryTitle: 'Guía del Inversionista — Resumen ejecutivo',
    summary: [
      { title: 'Estabilidad macroeconómica', text: 'Paraguay ofrece una de las economías más estables de la región, con crecimiento sostenido, baja inflación y disciplina fiscal.' },
      { title: 'Régimen tributario competitivo', text: 'Esquema 10-10-10: Impuesto a la Renta Empresarial, IVA e Impuesto a la Renta Personal entre los más bajos de Latinoamérica.' },
      { title: 'Incentivos a la inversión', text: 'Ley 60/90 de incentivos fiscales, régimen de maquila y zonas francas para proyectos de capital nacional y extranjero.' },
      { title: 'Ubicación estratégica', text: 'Corazón del Mercosur, con acceso a un mercado regional de más de 290 millones de personas y energía limpia y abundante.' },
    ],
    highlights: ['Constitución de sociedades', 'Asesoría fiscal y legal', 'Acompañamiento integral'],
    downloadTitle: 'Descargá la Guía completa',
    downloadText: 'Accedé al documento completo con el marco legal, incentivos y pasos para invertir en Paraguay.',
    download: 'Descargar Guía del Inversionista (PDF)',
    downloadNote: 'PDF · Disponible próximamente',
  },
  team: {
    eyebrow: 'Equipo profesional',
    title: 'Profesionales detrás de cada servicio',
    lead: 'Un equipo con experiencia que acompaña tu empresa con cercanía y rigor técnico.',
    note: 'Perfiles en actualización — las fichas con fotografía, trayectoria y áreas de especialización se completan con la información definitiva del equipo.',
    members: [
      { name: 'Dirección & Estrategia', role: 'Consultoría empresarial', bio: 'Liderazgo en la definición de soluciones integrales y acompañamiento estratégico a clientes.' },
      { name: 'Contabilidad & Tributación', role: 'Asesoría contable y fiscal', bio: 'Gestión contable integral y cumplimiento tributario conforme a la normativa paraguaya.' },
      { name: 'Auditoría & Control', role: 'Auditorías internas y externas', bio: 'Evaluación de procesos, control interno y estados financieros con foco en transparencia.' },
    ],
  },
  allies: {
    eyebrow: 'Acuerdos comerciales',
    title: 'Aliados estratégicos que potencian tu crecimiento',
    lead: 'Construimos una red de alianzas con organizaciones de sólida trayectoria y relevancia en el mercado.',
    note: 'Espacio reservado para los logotipos y reseñas de nuestras empresas aliadas.',
    items: ['Aliado 01', 'Aliado 02', 'Aliado 03', 'Aliado 04', 'Aliado 05', 'Aliado 06'],
  },
  contact: {
    eyebrow: 'Contacto',
    title: 'Conversemos sobre el crecimiento de tu empresa',
    lead: 'Estamos para ayudarte a ordenar, cumplir y crecer. Escribinos y coordinamos una reunión.',
    whatsapp: 'WhatsApp',
    email: 'Email',
    address: 'Dirección',
    hours: 'Horario',
    whatsappValue: contact.whatsappValue,
    emailValue: contact.emailValue,
    addressValue: contact.addressValue,
    hoursValue: 'Lunes a viernes · 8:00 a 18:00 hs',
    formTitle: 'Envianos tu consulta',
    name: 'Nombre',
    emailField: 'Correo electrónico',
    message: 'Mensaje',
    send: 'Enviar consulta',
  },
  finalCta: {
    title: 'Agenda una sesión estratégica hoy',
    text: 'Ofrecemos un diagnóstico gratuito y un presupuesto adaptado a tus necesidades reales.',
    button: 'Contactanos por WhatsApp',
  },
  footer: {
    tagline: 'Impulsando tu crecimiento con soluciones integrales y asesoría experta.',
    explore: 'Explorar',
    contactTitle: 'Contacto',
    followTitle: 'Seguinos',
    rights: 'Todos los derechos reservados.',
    poweredBy: 'Sitio desarrollado con dedicación para AVC Soluciones Empresariales E.A.S.',
    legal: ['Política de privacidad', 'Términos y condiciones', 'Aviso legal'],
  },
};

const en: Content = {
  lang: 'en',
  htmlLang: 'en',
  nav: { inicio: 'Home', nosotros: 'About', equipo: 'Team', servicios: 'Services', sectores: 'Sectors', inversionistas: 'Investors', acuerdos: 'Partners', contacto: 'Contact' },
  cta: { services: 'Services', contact: 'Contact' },
  hero: {
    badge: 'Integral business consulting · Paraguay',
    title: 'We drive your growth with integral solutions and',
    titleAccent: 'expert advisory',
    subtitle: 'AVC Soluciones Empresariales supports companies and entrepreneurs with comprehensive, personalized advisory: accounting, finance, audit, human resources, legal, marketing and technology.',
    primary: 'Let’s talk',
    secondary: 'View services',
    stats: [
      { value: '6+', label: 'Areas of expertise' },
      { value: '100%', label: 'Personalized advisory' },
      { value: 'PY', label: 'Nationwide reach' },
    ],
  },
  about: {
    eyebrow: 'About us',
    title: 'A strategic partner, not just a vendor',
    lead: 'We are a business consulting firm that organizes management, ensures regulatory compliance and enables sustainable growth.',
    description: 'AVC Soluciones Empresariales E.A.S. provides comprehensive, personalized advisory in accounting, finance, audit, human resources, legal and marketing, helping companies and entrepreneurs optimize management, meet regulations and grow sustainably.',
    mission: {
      title: 'Mission',
      text: 'To deliver integral business solutions and personalized advisory that allow companies to optimize their administrative, financial and operational processes, fostering innovation, sustainable growth and competitiveness.',
    },
    vision: {
      title: 'Vision',
      text: 'To establish ourselves as a leading firm in integral business solutions in Paraguay, recognized for professionalism, innovation and strategic support.',
    },
    valuesTitle: 'Our values',
    values: ['Integrity and professional ethics', 'Commitment to excellence', 'Constant innovation', 'Personalized attention', 'Sustainable client development'],
    differentialsTitle: 'What makes us different?',
    differentials: [
      { title: 'Integral offering', text: 'We centralize multiple key business areas with a single provider.' },
      { title: 'Tailored advisory', text: 'Adapted to the size, sector and stage of every company.' },
      { title: 'Technology & support', text: 'Adapted technology with continuous training and real support.' },
    ],
  },
  services: {
    eyebrow: 'Services',
    title: 'Solutions for every area of your business',
    lead: 'A multidisciplinary team covering the administrative, financial, legal, human and technological dimensions.',
    targetLabel: 'For',
    items: [
      { icon: 'calculator', name: 'Accounting & tax advisory', desc: 'Comprehensive accounting management and tax compliance under Paraguayan regulations.', target: 'Entrepreneurs, SMEs and established companies.' },
      { icon: 'shield', name: 'Internal & external audits', desc: 'Assessment of processes, internal control and financial statements for transparency and continuous improvement.', target: 'Medium and large companies.' },
      { icon: 'users', name: 'Human resources management', desc: 'Talent administration, labor compliance and organizational development.', target: 'Growing companies.' },
      { icon: 'scale', name: 'Corporate legal and notarial advisory', desc: 'Legal support for contracts, regulatory compliance and legal risk prevention.', target: 'Companies and entrepreneurs.' },
      { icon: 'megaphone', name: 'Marketing & advertising', desc: 'Digital marketing strategies and brand positioning focused on results.', target: 'Companies seeking visibility and commercial growth.' },
      { icon: 'graduation', name: 'Training & coaching', desc: 'Workshops and practical training in business management for entrepreneurs and teams.', target: 'Entrepreneurs and administrative teams.' },
      { icon: 'cpu', name: 'Technology & Systems', desc: 'Digital transformation, management systems and technology implementation tailored to your operation.', target: 'Companies looking to digitalize and scale.' },
    ],
  },
  sectors: {
    eyebrow: 'Sectors',
    title: 'Experience in the sectors that move the economy',
    lead: 'We support organizations across industries with solutions tailored to each one.',
    items: [
      { icon: 'briefcase', name: 'Professional services', desc: 'Firms and professionals that need administrative order and compliance.' },
      { icon: 'shopping', name: 'Commerce', desc: 'Buy-and-sell businesses seeking efficiency, control and sustained growth.' },
      { icon: 'factory', name: 'Industry', desc: 'Plants and manufacturing with workers and machinery requiring robust management.' },
      { icon: 'wheat', name: 'Agriculture & Livestock', desc: 'Agribusiness with specific accounting, tax and financing needs.' },
    ],
  },
  investors: {
    eyebrow: 'Information for foreign investors',
    title: 'Invest in Paraguay with local support',
    lead: 'We guide foreign investors at every step: company formation, tax regime, incentives and regulatory compliance.',
    heroCaption: 'Asunción, Paraguay',
    summaryTitle: 'Investor Guide — Executive summary',
    summary: [
      { title: 'Macroeconomic stability', text: 'Paraguay offers one of the most stable economies in the region, with sustained growth, low inflation and fiscal discipline.' },
      { title: 'Competitive tax regime', text: '10-10-10 scheme: corporate income tax, VAT and personal income tax among the lowest in Latin America.' },
      { title: 'Investment incentives', text: 'Law 60/90 of tax incentives, maquila regime and free trade zones for domestic and foreign capital projects.' },
      { title: 'Strategic location', text: 'Heart of Mercosur, with access to a regional market of over 290 million people and clean, abundant energy.' },
    ],
    highlights: ['Company formation', 'Tax & legal advisory', 'End-to-end support'],
    downloadTitle: 'Download the full Guide',
    downloadText: 'Access the complete document with the legal framework, incentives and steps to invest in Paraguay.',
    download: 'Download Investor Guide (PDF)',
    downloadNote: 'PDF · Available soon',
  },
  team: {
    eyebrow: 'Professional team',
    title: 'The professionals behind every service',
    lead: 'An experienced team that supports your company with closeness and technical rigor.',
    note: 'Profiles being updated — cards with photo, background and areas of expertise will be completed with the team’s final information.',
    members: [
      { name: 'Management & Strategy', role: 'Business consulting', bio: 'Leadership in defining integral solutions and strategic client support.' },
      { name: 'Accounting & Tax', role: 'Accounting & tax advisory', bio: 'Comprehensive accounting management and tax compliance under Paraguayan regulations.' },
      { name: 'Audit & Control', role: 'Internal & external audits', bio: 'Assessment of processes, internal control and financial statements focused on transparency.' },
    ],
  },
  allies: {
    eyebrow: 'Commercial partners',
    title: 'Strategic allies that boost your growth',
    lead: 'We build a network of alliances with organizations of solid track record and market relevance.',
    note: 'Space reserved for the logos and reviews of our partner companies.',
    items: ['Partner 01', 'Partner 02', 'Partner 03', 'Partner 04', 'Partner 05', 'Partner 06'],
  },
  contact: {
    eyebrow: 'Contact',
    title: 'Let’s talk about your company’s growth',
    lead: 'We’re here to help you organize, comply and grow. Write to us and we’ll set up a meeting.',
    whatsapp: 'WhatsApp',
    email: 'Email',
    address: 'Address',
    hours: 'Hours',
    whatsappValue: contact.whatsappValue,
    emailValue: contact.emailValue,
    addressValue: contact.addressValue,
    hoursValue: 'Monday to Friday · 8:00 to 18:00',
    formTitle: 'Send us your inquiry',
    name: 'Name',
    emailField: 'Email',
    message: 'Message',
    send: 'Send inquiry',
  },
  finalCta: {
    title: 'Schedule a strategic session today',
    text: 'We offer a free diagnosis and a proposal adapted to your real needs.',
    button: 'Contact us on WhatsApp',
  },
  footer: {
    tagline: 'Driving your growth with integral solutions and expert advisory.',
    explore: 'Explore',
    contactTitle: 'Contact',
    followTitle: 'Follow us',
    rights: 'All rights reserved.',
    poweredBy: 'Website crafted for AVC Soluciones Empresariales E.A.S.',
    legal: ['Privacy policy', 'Terms and conditions', 'Legal notice'],
  },
};

const pt: Content = {
  lang: 'pt',
  htmlLang: 'pt-BR',
  nav: { inicio: 'Início', nosotros: 'Sobre', equipo: 'Equipe', servicios: 'Serviços', sectores: 'Setores', inversionistas: 'Investidores', acuerdos: 'Parcerias', contacto: 'Contato' },
  cta: { services: 'Serviços', contact: 'Contato' },
  hero: {
    badge: 'Consultoria empresarial integral · Paraguai',
    title: 'Impulsionamos seu crescimento com soluções integrais e',
    titleAccent: 'assessoria especializada',
    subtitle: 'A AVC Soluciones Empresariales acompanha empresas e empreendedores com assessoria integral e personalizada: contabilidade, finanças, auditoria, recursos humanos, jurídico, marketing e tecnologia.',
    primary: 'Vamos conversar',
    secondary: 'Ver serviços',
    stats: [
      { value: '6+', label: 'Áreas de especialização' },
      { value: '100%', label: 'Assessoria personalizada' },
      { value: 'PY', label: 'Alcance nacional' },
    ],
  },
  about: {
    eyebrow: 'Sobre nós',
    title: 'Um parceiro estratégico, não apenas um fornecedor',
    lead: 'Somos uma consultoria empresarial que organiza a gestão, garante a conformidade normativa e viabiliza o crescimento sustentável.',
    description: 'A AVC Soluciones Empresariales E.A.S. oferece assessoria integral e personalizada em contabilidade, finanças, auditoria, recursos humanos, jurídico e marketing, ajudando empresas e empreendedores a otimizar a gestão, cumprir normas e crescer de forma sustentável.',
    mission: {
      title: 'Missão',
      text: 'Oferecer soluções empresariais integrais e assessoria personalizada que permitam às empresas otimizar seus processos administrativos, financeiros e operacionais, fomentando a inovação, o crescimento sustentável e a competitividade.',
    },
    vision: {
      title: 'Visão',
      text: 'Consolidar-nos como uma consultoria de referência em soluções empresariais integrais no Paraguai, reconhecida por seu profissionalismo, inovação e acompanhamento estratégico.',
    },
    valuesTitle: 'Nossos valores',
    values: ['Integridade e ética profissional', 'Compromisso com a excelência', 'Inovação constante', 'Atendimento personalizado', 'Desenvolvimento sustentável dos clientes'],
    differentialsTitle: 'O que nos torna diferentes?',
    differentials: [
      { title: 'Oferta integral', text: 'Centralizamos múltiplas áreas-chave do negócio em um único fornecedor.' },
      { title: 'Assessoria sob medida', text: 'Adaptada ao porte, setor e estágio de cada empresa.' },
      { title: 'Tecnologia e acompanhamento', text: 'Tecnologia adaptada com capacitação contínua e acompanhamento real.' },
    ],
  },
  services: {
    eyebrow: 'Serviços',
    title: 'Soluções para cada área do seu negócio',
    lead: 'Uma equipe multidisciplinar que cobre o administrativo, financeiro, jurídico, humano e tecnológico.',
    targetLabel: 'Indicado para',
    items: [
      { icon: 'calculator', name: 'Assessoria contábil e fiscal', desc: 'Gestão contábil integral e conformidade tributária conforme a legislação paraguaia.', target: 'Empreendedores, PMEs e empresas consolidadas.' },
      { icon: 'shield', name: 'Auditorias internas e externas', desc: 'Avaliação de processos, controle interno e demonstrações financeiras para transparência e melhoria contínua.', target: 'Empresas médias e grandes.' },
      { icon: 'users', name: 'Gestão de recursos humanos', desc: 'Administração de talentos, conformidade trabalhista e desenvolvimento organizacional.', target: 'Empresas em crescimento.' },
      { icon: 'scale', name: 'Assessoria jurídica notarial empresarial', desc: 'Apoio jurídico em contratos, conformidade normativa e prevenção de riscos legais.', target: 'Empresas e empreendedores.' },
      { icon: 'megaphone', name: 'Marketing e publicidade', desc: 'Estratégias de marketing digital e posicionamento de marca orientadas a resultados.', target: 'Empresas que buscam visibilidade e crescimento comercial.' },
      { icon: 'graduation', name: 'Capacitações e acompanhamento', desc: 'Workshops e formação prática em gestão empresarial para empreendedores e equipes.', target: 'Empreendedores e equipes administrativas.' },
      { icon: 'cpu', name: 'Tecnologia e Sistemas', desc: 'Transformação digital, sistemas de gestão e implementação tecnológica adaptada à sua operação.', target: 'Empresas que buscam digitalizar e escalar.' },
    ],
  },
  sectors: {
    eyebrow: 'Setores',
    title: 'Experiência nos setores que movem a economia',
    lead: 'Acompanhamos organizações de diferentes segmentos com soluções sob medida para cada indústria.',
    items: [
      { icon: 'briefcase', name: 'Serviços profissionais', desc: 'Escritórios e profissionais que precisam de ordem administrativa e conformidade.' },
      { icon: 'shopping', name: 'Comércio', desc: 'Negócios de compra e venda que buscam eficiência, controle e crescimento sustentado.' },
      { icon: 'factory', name: 'Indústria', desc: 'Plantas e manufatura com operários e maquinário que exigem gestão robusta.' },
      { icon: 'wheat', name: 'Agricultura e Pecuária', desc: 'Agronegócio com necessidades contábeis, fiscais e de financiamento específicas.' },
    ],
  },
  investors: {
    eyebrow: 'Informações para investidores estrangeiros',
    title: 'Invista no Paraguai com respaldo local',
    lead: 'Acompanhamos investidores do exterior em cada etapa: constituição de empresas, regime tributário, incentivos e conformidade normativa.',
    heroCaption: 'Assunção, Paraguai',
    summaryTitle: 'Guia do Investidor — Resumo executivo',
    summary: [
      { title: 'Estabilidade macroeconômica', text: 'O Paraguai oferece uma das economias mais estáveis da região, com crescimento sustentado, baixa inflação e disciplina fiscal.' },
      { title: 'Regime tributário competitivo', text: 'Esquema 10-10-10: imposto de renda empresarial, IVA e imposto de renda pessoal entre os mais baixos da América Latina.' },
      { title: 'Incentivos ao investimento', text: 'Lei 60/90 de incentivos fiscais, regime de maquila e zonas francas para projetos de capital nacional e estrangeiro.' },
      { title: 'Localização estratégica', text: 'Coração do Mercosul, com acesso a um mercado regional de mais de 290 milhões de pessoas e energia limpa e abundante.' },
    ],
    highlights: ['Constituição de sociedades', 'Assessoria fiscal e jurídica', 'Acompanhamento integral'],
    downloadTitle: 'Baixe o Guia completo',
    downloadText: 'Acesse o documento completo com o marco legal, incentivos e passos para investir no Paraguai.',
    download: 'Baixar Guia do Investidor (PDF)',
    downloadNote: 'PDF · Disponível em breve',
  },
  team: {
    eyebrow: 'Equipe profissional',
    title: 'Os profissionais por trás de cada serviço',
    lead: 'Uma equipe experiente que acompanha sua empresa com proximidade e rigor técnico.',
    note: 'Perfis em atualização — as fichas com fotografia, trajetória e áreas de especialização serão preenchidas com as informações definitivas da equipe.',
    members: [
      { name: 'Direção & Estratégia', role: 'Consultoria empresarial', bio: 'Liderança na definição de soluções integrais e acompanhamento estratégico aos clientes.' },
      { name: 'Contabilidade & Tributos', role: 'Assessoria contábil e fiscal', bio: 'Gestão contábil integral e conformidade tributária conforme a legislação paraguaia.' },
      { name: 'Auditoria & Controle', role: 'Auditorias internas e externas', bio: 'Avaliação de processos, controle interno e demonstrações financeiras com foco em transparência.' },
    ],
  },
  allies: {
    eyebrow: 'Acordos comerciais',
    title: 'Aliados estratégicos que potencializam seu crescimento',
    lead: 'Construímos uma rede de alianças com organizações de sólida trajetória e relevância no mercado.',
    note: 'Espaço reservado para os logotipos e resenhas das nossas empresas parceiras.',
    items: ['Parceiro 01', 'Parceiro 02', 'Parceiro 03', 'Parceiro 04', 'Parceiro 05', 'Parceiro 06'],
  },
  contact: {
    eyebrow: 'Contato',
    title: 'Vamos conversar sobre o crescimento da sua empresa',
    lead: 'Estamos aqui para ajudar você a organizar, cumprir e crescer. Escreva para nós e marcamos uma reunião.',
    whatsapp: 'WhatsApp',
    email: 'Email',
    address: 'Endereço',
    hours: 'Horário',
    whatsappValue: contact.whatsappValue,
    emailValue: contact.emailValue,
    addressValue: contact.addressValue,
    hoursValue: 'Segunda a sexta · 8:00 às 18:00',
    formTitle: 'Envie sua consulta',
    name: 'Nome',
    emailField: 'E-mail',
    message: 'Mensagem',
    send: 'Enviar consulta',
  },
  finalCta: {
    title: 'Agende uma sessão estratégica hoje',
    text: 'Oferecemos um diagnóstico gratuito e um orçamento adaptado às suas necessidades reais.',
    button: 'Fale conosco no WhatsApp',
  },
  footer: {
    tagline: 'Impulsionando seu crescimento com soluções integrais e assessoria especializada.',
    explore: 'Explorar',
    contactTitle: 'Contato',
    followTitle: 'Siga-nos',
    rights: 'Todos os direitos reservados.',
    poweredBy: 'Site desenvolvido para a AVC Soluciones Empresariales E.A.S.',
    legal: ['Política de privacidade', 'Termos e condições', 'Aviso legal'],
  },
};

export const content: Record<Lang, Content> = { es, en, pt };

export const social = {
  instagram: 'https://www.instagram.com/avc.soluciones_empresariales/',
  facebook: 'https://web.facebook.com/profile.php?id=61577989658195',
  linkedin: 'https://www.linkedin.com/company/108613748/',
  whatsapp: contact.whatsappHref,
  maps: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contact.addressValue)}`,
};

export function getContent(lang: Lang): Content {
  return content[lang] ?? content.es;
}
