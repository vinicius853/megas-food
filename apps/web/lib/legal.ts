export const PRIVACY_POLICY_VERSION = "2026-06-12";
export const LEGAL_LAST_UPDATED_LABEL = "12 de junho de 2026";
export const LEGAL_CONTACT_WHATSAPP = "+55 24 99852-2102";
export const LEGAL_CONTACT_URL = "https://wa.me/5524998522102";
export const COOKIE_CONSENT_STORAGE_KEY = `megas-food-cookie-consent:${PRIVACY_POLICY_VERSION}`;

export type LegalSection = {
  title: string;
  paragraphs?: string[];
  items?: string[];
};

export const privacySections: LegalSection[] = [
  {
    title: "1. Quem participa do tratamento",
    paragraphs: [
      "O estabelecimento responsável pelo cardápio recebe e utiliza os dados necessários para preparar, entregar e acompanhar o pedido. A Megas Food fornece a plataforma tecnológica e trata dados conforme suas responsabilidades contratuais e legais.",
    ],
  },
  {
    title: "2. Dados que podem ser coletados",
    items: [
      "Nome, telefone e informações do pedido.",
      "Endereço e referências de entrega quando essa modalidade for escolhida.",
      "CPF ou CNPJ quando informado em cadastros administrativos, fiscais ou comerciais.",
      "Registros técnicos como data, versão da política, endereço IP disponível e identificação do navegador no aceite.",
      "Dados de sessão e preferências armazenados em cookies ou localStorage.",
    ],
  },
  {
    title: "3. Para que usamos os dados",
    items: [
      "Processar, confirmar, preparar e entregar pedidos.",
      "Permitir contato entre cliente e estabelecimento.",
      "Prevenir fraude, manter segurança, auditoria e disponibilidade da plataforma.",
      "Cumprir obrigações legais, regulatórias, fiscais e contratuais.",
      "Prestar suporte e melhorar a operação do serviço.",
    ],
  },
  {
    title: "4. Cookies e armazenamento local",
    paragraphs: [
      "A plataforma pode usar cookies e localStorage para funções essenciais, como sessão autenticada, preferências, carrinho e registro do aviso de privacidade. Recursos não essenciais deverão ser avaliados antes de serem adicionados.",
    ],
  },
  {
    title: "5. Provedores e compartilhamentos",
    paragraphs: [
      "Dados podem ser tratados por fornecedores necessários à operação, sempre conforme a finalidade do serviço.",
    ],
    items: [
      "Cloudinary, para armazenamento e entrega de imagens.",
      "Mercado Pago, quando houver processamento de cobranças e assinaturas.",
      "WhatsApp e eventual integração Evolution API, para comunicação sobre pedidos.",
      "Provedores de hospedagem, VPS, banco de dados, monitoramento e segurança.",
      "Autoridades públicas, quando houver obrigação legal ou ordem válida.",
    ],
  },
  {
    title: "6. Retenção e segurança",
    paragraphs: [
      "Os dados são mantidos pelo período necessário às finalidades informadas, ao cumprimento de obrigações e à defesa de direitos. Aplicamos controles técnicos e administrativos proporcionais ao estágio do serviço, sem prometer segurança absoluta.",
    ],
  },
  {
    title: "7. Direitos do titular",
    paragraphs: [
      "Você pode solicitar confirmação do tratamento, acesso, correção, informação sobre compartilhamentos e demais direitos previstos na legislação aplicável. Alguns dados podem ser conservados quando houver obrigação legal ou outra base autorizada.",
    ],
  },
  {
    title: "8. Contato",
    paragraphs: [
      `Para assuntos de privacidade, fale com a Megas Food pelo WhatsApp ${LEGAL_CONTACT_WHATSAPP}. Para dados de um pedido específico, o estabelecimento também poderá precisar participar do atendimento.`,
    ],
  },
];

export const termsSections: LegalSection[] = [
  {
    title: "1. Objeto",
    paragraphs: [
      "A Megas Food oferece tecnologia para cardápio digital, gestão e pedidos online. O estabelecimento é responsável por seus produtos, preços, disponibilidade, preparo, entrega, informações comerciais e atendimento ao consumidor.",
    ],
  },
  {
    title: "2. Uso do cardápio e pedidos",
    items: [
      "Revise itens, endereço, forma de pagamento e total antes de enviar.",
      "O envio do pedido depende da confirmação e disponibilidade do estabelecimento.",
      "Prazos exibidos são estimativas e podem variar conforme operação, trânsito e demanda.",
      "O usuário deve fornecer dados corretos e suficientes para contato e entrega.",
    ],
  },
  {
    title: "3. Pagamentos e terceiros",
    paragraphs: [
      "Pagamentos e comunicações podem utilizar serviços de terceiros, como Mercado Pago e WhatsApp, sujeitos também aos termos e políticas desses fornecedores.",
    ],
  },
  {
    title: "4. Conta administrativa",
    paragraphs: [
      "Usuários administrativos devem proteger suas credenciais, usar o acesso somente para fins autorizados e comunicar suspeitas de uso indevido.",
    ],
  },
  {
    title: "5. Disponibilidade e alterações",
    paragraphs: [
      "Podemos realizar manutenções, correções e atualizações. Mudanças relevantes nestes termos ou na Política de Privacidade serão identificadas por nova data ou versão.",
    ],
  },
  {
    title: "6. Responsabilidades",
    paragraphs: [
      "A plataforma não substitui as responsabilidades legais do estabelecimento perante seus clientes. Cada parte responde por suas ações, dados e obrigações conforme a legislação e os contratos aplicáveis.",
    ],
  },
  {
    title: "7. Contato",
    paragraphs: [
      `Dúvidas sobre a plataforma podem ser enviadas pelo WhatsApp ${LEGAL_CONTACT_WHATSAPP}.`,
    ],
  },
];
