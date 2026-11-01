// Traduções do site (PT · EN · ES).
// - data-i18n="chave"       → troca o texto do elemento
// - data-i18n-html="chave"  → troca o HTML (textos que contêm logos das empresas)

// Selos de empresas reaproveitados dentro dos textos
const FIAP = '<span class="brand brand-logo brand-fiap"><img src="assets/logos/fiap.png" alt="FIAP" /></span>';
const FIAP_LAB = '<span class="brand brand-logo brand-fiap"><img src="assets/logos/fiap.png" alt="FIAP" />Content Lab</span>';
const GOOGLE = '<span class="brand brand-google"><i class="brand-g" aria-hidden="true"></i>Google</span>';
const ITAU = '<span class="brand brand-logo"><img src="assets/logos/itau.png" alt="" />Itaú Unibanco</span>';
const NEXT = '<img class="award-logo" src="assets/logos/fiap-next.png" alt="FIAP NEXT" />';

export const I18N = {
  pt: {
    'nav.about': 'Sobre', 'nav.what': 'O que eu faço', 'nav.projects': 'Projetos', 'nav.contact': 'Contato',
    'hero.greet': 'Olá! Eu sou',

    'about.tag': 'Sobre mim',
    'about.text': `Estudante de Engenharia de Software na ${FIAP}, ${GOOGLE} Student Ambassador e Estagiário de Análise de Dados e Produtos no ${ITAU}. Transformo dados brutos em decisões estratégicas de produto e negócio: construo pipelines em Python, modelo consultas analíticas em SQL, estruturo ambientes na AWS e automatizo fluxos corporativos de ponta a ponta. Meu foco é entender a dor real do negócio antes da primeira linha de código e medir o impacto gerado depois.`,

    'services.t1': 'O', 'services.t2': 'que', 'services.t3': 'eu', 'services.t4': 'faço',
    'label.desc': 'Descrição', 'label.skills': 'Skills & ferramentas', 'label.tech': 'Tecnologias',
    'svc1.title': 'DATA & PRODUCT ANALYTICS',
    'svc1.desc': 'Análise exploratória de dados, definição e acompanhamento de métricas de produto (CX/BUPJ), modelagem analítica e criação de relatórios que respondem a perguntas reais de negócio.',
    'svc1.excel': 'Excel Avançado',
    'svc2.title': 'ENGENHARIA DE DADOS & SOFTWARE',
    'svc2.desc': 'Desenvolvimento de pipelines de extração e tratamento de dados (ETL), integração de APIs, manipulação de bancos de dados relacionais e construção de aplicações escaláveis.',
    'svc3.title': 'CLOUD & AUTOMAÇÃO DE PROCESSOS',
    'svc3.desc': 'Arquitetura e consulta de dados em nuvem combinadas com automação de rotinas operacionais e corporativas, reduzindo trabalho manual e aumentando a confiabilidade dos dados.',

    'career.t1': 'Minha carreira', 'career.t2': 'experiência',
    'years.to': 'a', 'years.until': 'até', 'years.now': 'Atual',
    'job1.role': 'Estagiário de Análise de Dados e Produtos',
    'job1.desc': 'Atuação na área de produtos PJ (BUPJ) com foco em Customer Experience. Construção de análises exploratórias, cruzamento de bases via SQL e Python, estruturação de métricas de produto na AWS e automação de relatórios executivos para apoiar decisões estratégicas.',
    'job2.role': 'Google Student Ambassador & Creator',
    'job2.desc': 'Representante estudantil oficial do Google e criador de conteúdo no ecossistema da FIAP. Liderança de iniciativas acadêmicas em tecnologia, inteligência artificial e engenharia de software, conectando a comunidade estudantil às ferramentas do mercado.',
    'job3.role': 'Fundador & Gestor de Operações e Dados',
    'job3.desc': 'Criação e gestão completa de e-commerce próprio nos marketplaces Shopee e Mercado Livre. Estruturação de precificação orientada a dados, controle analítico de estoque, automação do fluxo de pedidos e gestão logística e financeira.',
    'job4.role': 'Auxiliar de E-commerce & Automação',
    'job4.desc': 'Otimização da operação digital por meio de automações avançadas em Excel e VBA, integração e conciliação de dados no sistema ERP e melhoria contínua no fluxo de processamento de pedidos.',
    'job5.role': 'Jovem Aprendiz Administrativo (CCO)',
    'job5.desc': 'Atuação no Centro de Controle Operacional monitorando rotas e ocorrências em tempo real. Desenvolvimento de planilhas automatizadas com VBA para consolidação de indicadores operacionais e ganho de agilidade na geração de relatórios.',
    'edu.title': 'Formação acadêmica',
    'edu.degree': 'Bacharelado em Engenharia de Software',
    'edu.gs': `<strong class="hl">1º lugar no Global Solution 2026</strong> (Projeto OrbitCore) e membro oficial do ${FIAP_LAB}.`,
    'edu.next': `${NEXT}<span><strong class="hl">2º lugar no Challenge</strong> com o projeto <a href="#projetos">StudyCam AI</a>, hoje publicado na Google Play.</span>`,

    'projects.my': 'Meus', 'projects.title': 'Projetos',
    'projects.award': '2º lugar no Challenge', 'projects.gs': 'Campeão da Global Solution',
    'projects.prototype': 'Protótipo', 'projects.video': 'Vídeo', 'projects.site': 'Site',
    'p1.cat': 'App Android · IA generativa',
    'p1.desc': 'App de estudos que transforma fotos do caderno e documentos em resumos com IA, tira dúvidas com um tutor virtual e gera simulados. Suporta mais de 90 idiomas.',
    'p2.cat': 'IoT · Ciência de dados · Web',
    'p2.desc': 'Sonda autônoma com vela solar para explorar o sistema TRAPPIST-1: Arduino + RFID identifica cada planeta, uma central em Python calcula a habitabilidade (ESI) e as órbitas (3ª Lei de Kepler), e um site interativo apresenta a missão.',

    'duel.kicker': 'Redes sociais', 'duel.sub': 'Meu alcance em cada rede, frente a frente.',
    'duel.liPeriod': 'em 2026', 'duel.ttPeriod': 'últimos 90 dias',
    'duel.liMetric': 'impressões', 'duel.ttMetric': 'visualizações',
    'duel.note': 'LinkedIn: impressões em 2026 · TikTok (@jhotadev): visualizações nos últimos 90 dias.',

    'stack.title': 'Minhas Tecnologias', 'stack.sub': 'Stack & ferramentas',
    'stack.g1': 'Linguagens & Dados', 'stack.g2': 'Bancos & Cloud', 'stack.g3': 'Análise & BI', 'stack.g4': 'Dev & Automação',

    'contact.title': 'Contato', 'contact.location': 'Localização', 'contact.city': 'São Paulo, Brasil',
    'footer.by': 'Desenvolvido por', 'footer.credits': 'Créditos', 'footer.model': 'Modelo 3D', 'footer.byAuthor': 'por', 'footer.modified': 'modificado',
  },

  en: {
    'nav.about': 'About', 'nav.what': 'What I do', 'nav.projects': 'Projects', 'nav.contact': 'Contact',
    'hero.greet': "Hi! I'm",

    'about.tag': 'About me',
    'about.text': `Software Engineering student at ${FIAP}, ${GOOGLE} Student Ambassador and Data & Product Analytics Intern at ${ITAU}. I turn raw data into strategic product and business decisions: I build pipelines in Python, write analytical SQL queries, set up environments on AWS and automate corporate workflows end to end. My focus is understanding the real business pain before the first line of code, and measuring the impact afterwards.`,

    'services.t1': 'What', 'services.t2': 'I', 'services.t3': 'can', 'services.t4': 'do',
    'label.desc': 'Description', 'label.skills': 'Skills & tools', 'label.tech': 'Tech',
    'svc1.title': 'DATA & PRODUCT ANALYTICS',
    'svc1.desc': 'Exploratory data analysis, defining and tracking product metrics (CX/BUPJ), analytical modeling and reports that answer real business questions.',
    'svc1.excel': 'Advanced Excel',
    'svc2.title': 'DATA & SOFTWARE ENGINEERING',
    'svc2.desc': 'Building data extraction and processing pipelines (ETL), API integrations, working with relational databases and developing scalable applications.',
    'svc3.title': 'CLOUD & PROCESS AUTOMATION',
    'svc3.desc': 'Cloud data architecture and querying combined with automation of operational and corporate routines, reducing manual work and making data more reliable.',

    'career.t1': 'My career', 'career.t2': 'experience',
    'years.to': 'to', 'years.until': 'to', 'years.now': 'Present',
    'job1.role': 'Data & Product Analytics Intern',
    'job1.desc': 'Working on the business banking (BUPJ) product area with a focus on Customer Experience. Exploratory analyses, joining datasets with SQL and Python, structuring product metrics on AWS and automating executive reports to support strategic decisions.',
    'job2.role': 'Google Student Ambassador & Creator',
    'job2.desc': "Google's official student representative and content creator in the FIAP ecosystem. Leading academic initiatives in technology, artificial intelligence and software engineering, connecting the student community with industry tools.",
    'job3.role': 'Founder & Operations and Data Manager',
    'job3.desc': 'Built and fully run my own e-commerce business on the Shopee and Mercado Livre marketplaces. Data-driven pricing, analytical inventory control, order-flow automation and logistics and financial management.',
    'job4.role': 'E-commerce & Automation Assistant',
    'job4.desc': 'Optimized the digital operation with advanced Excel and VBA automations, data integration and reconciliation in the ERP system, and continuous improvement of the order processing flow.',
    'job5.role': 'Administrative Young Apprentice (Operations Control Center)',
    'job5.desc': 'Worked at the Operations Control Center monitoring routes and incidents in real time. Built automated VBA spreadsheets to consolidate operational KPIs and speed up report generation.',
    'edu.title': 'Education',
    'edu.degree': "Bachelor's in Software Engineering",
    'edu.gs': `<strong class="hl">1st place at Global Solution 2026</strong> (OrbitCore project) and official member of ${FIAP_LAB}.`,
    'edu.next': `${NEXT}<span><strong class="hl">2nd place in the Challenge</strong> with the <a href="#projetos">StudyCam AI</a> project, now live on Google Play.</span>`,

    'projects.my': 'My', 'projects.title': 'Projects',
    'projects.award': '2nd place in the Challenge', 'projects.gs': 'Global Solution champion',
    'projects.prototype': 'Prototype', 'projects.video': 'Video', 'projects.site': 'Website',
    'p1.cat': 'Android app · Generative AI',
    'p1.desc': 'Study app that turns notebook photos and documents into AI summaries, answers questions with a virtual tutor and creates practice tests. Supports 90+ languages.',
    'p2.cat': 'IoT · Data science · Web',
    'p2.desc': 'Autonomous solar-sail probe to explore the TRAPPIST-1 system: Arduino + RFID identifies each planet, a Python control center computes habitability (ESI) and orbits (Kepler’s 3rd law), and an interactive website presents the mission.',

    'duel.kicker': 'Social media', 'duel.sub': 'My reach on each network, head to head.',
    'duel.liPeriod': 'in 2026', 'duel.ttPeriod': 'last 90 days',
    'duel.liMetric': 'impressions', 'duel.ttMetric': 'views',
    'duel.note': 'LinkedIn: impressions in 2026 · TikTok (@jhotadev): views in the last 90 days.',

    'stack.title': 'My Tech Stack', 'stack.sub': 'Stack & tools',
    'stack.g1': 'Languages & Data', 'stack.g2': 'Databases & Cloud', 'stack.g3': 'Analytics & BI', 'stack.g4': 'Dev & Automation',

    'contact.title': 'Contact', 'contact.location': 'Location', 'contact.city': 'São Paulo, Brazil',
    'footer.by': 'Developed by', 'footer.credits': 'Credits', 'footer.model': '3D model', 'footer.byAuthor': 'by', 'footer.modified': 'modified',
  },

  es: {
    'nav.about': 'Sobre mí', 'nav.what': 'Qué hago', 'nav.projects': 'Proyectos', 'nav.contact': 'Contacto',
    'hero.greet': '¡Hola! Soy',

    'about.tag': 'Sobre mí',
    'about.text': `Estudiante de Ingeniería de Software en ${FIAP}, ${GOOGLE} Student Ambassador y Practicante de Análisis de Datos y Productos en ${ITAU}. Transformo datos en bruto en decisiones estratégicas de producto y negocio: construyo pipelines en Python, modelo consultas analíticas en SQL, estructuro entornos en AWS y automatizo flujos corporativos de punta a punta. Mi foco es entender el problema real del negocio antes de la primera línea de código y medir el impacto generado después.`,

    'services.t1': 'Lo', 'services.t2': 'que', 'services.t3': 'yo', 'services.t4': 'hago',
    'label.desc': 'Descripción', 'label.skills': 'Skills y herramientas', 'label.tech': 'Tecnologías',
    'svc1.title': 'DATA & PRODUCT ANALYTICS',
    'svc1.desc': 'Análisis exploratorio de datos, definición y seguimiento de métricas de producto (CX/BUPJ), modelado analítico y creación de reportes que responden preguntas reales del negocio.',
    'svc1.excel': 'Excel Avanzado',
    'svc2.title': 'INGENIERÍA DE DATOS Y SOFTWARE',
    'svc2.desc': 'Desarrollo de pipelines de extracción y tratamiento de datos (ETL), integración de APIs, manejo de bases de datos relacionales y construcción de aplicaciones escalables.',
    'svc3.title': 'CLOUD Y AUTOMATIZACIÓN DE PROCESOS',
    'svc3.desc': 'Arquitectura y consulta de datos en la nube combinadas con la automatización de rutinas operativas y corporativas, reduciendo el trabajo manual y aumentando la confiabilidad de los datos.',

    'career.t1': 'Mi carrera', 'career.t2': 'experiencia',
    'years.to': 'a', 'years.until': 'hasta', 'years.now': 'Actual',
    'job1.role': 'Practicante de Análisis de Datos y Productos',
    'job1.desc': 'Trabajo en el área de productos para empresas (BUPJ) con foco en Customer Experience. Análisis exploratorios, cruce de bases con SQL y Python, estructuración de métricas de producto en AWS y automatización de reportes ejecutivos para apoyar decisiones estratégicas.',
    'job2.role': 'Google Student Ambassador & Creator',
    'job2.desc': 'Representante estudiantil oficial de Google y creador de contenido en el ecosistema de FIAP. Liderazgo de iniciativas académicas en tecnología, inteligencia artificial e ingeniería de software, conectando a la comunidad estudiantil con las herramientas del mercado.',
    'job3.role': 'Fundador y Gestor de Operaciones y Datos',
    'job3.desc': 'Creación y gestión completa de un e-commerce propio en los marketplaces Shopee y Mercado Livre. Precios basados en datos, control analítico de inventario, automatización del flujo de pedidos y gestión logística y financiera.',
    'job4.role': 'Asistente de E-commerce y Automatización',
    'job4.desc': 'Optimización de la operación digital mediante automatizaciones avanzadas en Excel y VBA, integración y conciliación de datos en el sistema ERP y mejora continua del flujo de procesamiento de pedidos.',
    'job5.role': 'Joven Aprendiz Administrativo (Centro de Control Operacional)',
    'job5.desc': 'Trabajo en el Centro de Control Operacional monitoreando rutas e incidencias en tiempo real. Desarrollo de planillas automatizadas con VBA para consolidar indicadores operativos y agilizar la generación de reportes.',
    'edu.title': 'Formación académica',
    'edu.degree': 'Licenciatura en Ingeniería de Software',
    'edu.gs': `<strong class="hl">1er lugar en la Global Solution 2026</strong> (Proyecto OrbitCore) y miembro oficial de ${FIAP_LAB}.`,
    'edu.next': `${NEXT}<span><strong class="hl">2º lugar en el Challenge</strong> con el proyecto <a href="#projetos">StudyCam AI</a>, hoy publicado en Google Play.</span>`,

    'projects.my': 'Mis', 'projects.title': 'Proyectos',
    'projects.award': '2º lugar en el Challenge', 'projects.gs': 'Campeón de la Global Solution',
    'projects.prototype': 'Prototipo', 'projects.video': 'Video', 'projects.site': 'Sitio',
    'p1.cat': 'App Android · IA generativa',
    'p1.desc': 'App de estudio que transforma fotos del cuaderno y documentos en resúmenes con IA, responde dudas con un tutor virtual y genera simulacros. Disponible en más de 90 idiomas.',
    'p2.cat': 'IoT · Ciencia de datos · Web',
    'p2.desc': 'Sonda autónoma con vela solar para explorar el sistema TRAPPIST-1: Arduino + RFID identifica cada planeta, una central en Python calcula la habitabilidad (ESI) y las órbitas (3ª ley de Kepler), y un sitio interactivo presenta la misión.',

    'duel.kicker': 'Redes sociales', 'duel.sub': 'Mi alcance en cada red, frente a frente.',
    'duel.liPeriod': 'en 2026', 'duel.ttPeriod': 'últimos 90 días',
    'duel.liMetric': 'impresiones', 'duel.ttMetric': 'visualizaciones',
    'duel.note': 'LinkedIn: impresiones en 2026 · TikTok (@jhotadev): visualizaciones en los últimos 90 días.',

    'stack.title': 'Mis Tecnologías', 'stack.sub': 'Stack y herramientas',
    'stack.g1': 'Lenguajes y Datos', 'stack.g2': 'Bases de datos y Cloud', 'stack.g3': 'Análisis y BI', 'stack.g4': 'Dev y Automatización',

    'contact.title': 'Contacto', 'contact.location': 'Ubicación', 'contact.city': 'São Paulo, Brasil',
    'footer.by': 'Desarrollado por', 'footer.credits': 'Créditos', 'footer.model': 'Modelo 3D', 'footer.byAuthor': 'por', 'footer.modified': 'modificado',
  },
};
