import { CalendarEvent, Story } from "@/types/calendar";

export const defaultEvents: Record<number, Omit<CalendarEvent, 'id' | 'created_at' | 'updated_at' | 'month'>[]> = {
  2: [{
    day: 2,
    event_index: 0,
    platform: 'Instagram',
    title: 'A Psicologia que você não aprendeu na faculdade',
    status: null,
    roteiro: `Você sabia que a Psicologia que vai destacar sua carreira provavelmente não foi ensinada na faculdade?

Depois de 5 anos de graduação, muitos formandos ainda saem sem saber lidar com os desafios reais da clínica.

E aí vem a pergunta:
Se você precisasse atender agora, teria segurança?

A verdade é que o que transforma um psicólogo em um profissional de autoridade não está nos livros. Está na prática supervisionada, na troca com outros profissionais, na atualização constante.

Se você quer descobrir o que está faltando na sua formação, acompanhe a gente. Vamos mostrar uma nova forma de atender.

Nos siga para não perder esse movimento!`
  }],
  3: [{
    day: 3,
    event_index: 0,
    platform: 'LinkedIn',
    title: 'Revisando conteúdo',
    status: null
  }],
  4: [{
    day: 4,
    event_index: 0,
    platform: 'Instagram',
    title: 'Você precisa de uma comunidade',
    status: null,
    roteiro: `Se você está começando na Psicologia clínica, provavelmente já sentiu: o isolamento que vem junto com a prática.

E olha, não é frescura, é real.

A verdade é que atender sozinho, sem supervisão, sem apoio, sem troca, é um caminho rápido pro esgotamento. E pior: pode afetar até a qualidade do seu atendimento.

Por isso, comunidade importa.

Ter um espaço pra trocar, perguntar, errar com apoio e crescer junto com outros psicólogos é o que separa profissionais inseguros de profissionais confiantes.

A era dos lobos solitários da Psicologia acabou. A era da comunidade começou.

Nós vamos te mostrar uma nova forma de atender.
Nos siga para não perder esse movimento!`
  }],
  5: [{
    day: 5,
    event_index: 0,
    platform: 'Tarefa',
    title: 'Envio dos conteúdos para aprovação de roteiros e pautas',
    status: null
  }],
  6: [{
    day: 6,
    event_index: 0,
    platform: 'Instagram',
    title: 'A diferença entre um bom e um ótimo psicólogo',
    status: null,
    roteiro: `Todo psicólogo acha que precisa saber mais pra ser melhor. Mas sabe qual é o segredo?

Não é o quanto você estuda. É com quem você caminha.

O que separa um bom psicólogo de um ótimo não é diploma nem especialização.

É prática guiada. É supervisão. É saber que você não está sozinho.

O profissional que cresce rápido é o que se cerca de outros profissionais que também querem crescer.

A diferença não está no talento. Está no ambiente.
E você pode escolher o seu a partir de agora.

Nós vamos te mostrar uma nova forma de atender.
Nos siga para não perder esse movimento!`
  }],
  7: [{
    day: 7,
    event_index: 0,
    platform: 'Tarefa',
    title: 'Envio dos conteúdos no grupo para gravação',
    status: null
  }],
  9: [{
    day: 9,
    event_index: 0,
    platform: 'Instagram',
    title: 'Por que tantos psicólogos desistem antes de crescer',
    status: null,
    roteiro: `No Brasil, mais de 500 mil psicólogos estão registrados. Mas quantos realmente se sentem preparados pra atender?

A maioria desiste antes de crescer. E sabe por quê?

Porque tentam fazer tudo sozinhos.

A falta de supervisão contínua, de troca real, de orientação prática, faz com que muitos abandonem a clínica antes de encontrar o ritmo certo.

A Psicologia não foi feita pra ser solitária. Foi feita pra ser construída em conjunto.

O suporte certo no momento certo muda tudo!

Nós vamos te mostrar uma nova forma de atender.
Nos siga para não perder esse movimento!`
  }, {
    day: 9,
    event_index: 1,
    platform: 'Tarefa',
    title: 'Edição dos conteúdos',
    status: null
  }],
  10: [{
    day: 10,
    event_index: 0,
    platform: 'LinkedIn',
    title: 'A Psicologia na era da tecnologia emocional',
    status: null,
    roteiro: `A Psicologia na era da tecnologia emocional

A rotina dos profissionais de Psicologia está passando por uma transformação que ninguém mais consegue ignorar. A chegada de IA, aplicativos especializados, comunidades digitais e plataformas de supervisão estão mudando tanto o dia a dia quanto a maneira como os psicólogos se preparam para atuar e essa mudança não é opcional para quem quer sobreviver no mercado.

A chamada "tecnologia emocional" descreve ferramentas criadas para apoiar a prática clínica, melhorar o raciocínio profissional e facilitar o acesso ao conhecimento. Esse termo ganhou força justamente porque o volume de demandas em saúde mental cresceu em velocidade muito maior do que a capacidade humana de acompanhá-las criando um cenário de sobrecarga invisível para muitos profissionais.

Hoje, com mais de 553 mil psicólogos no Brasil e uma geração inteira entrando no mercado todos os anos, a busca por formas mais eficientes de organizar atendimentos, estudar casos e se manter atualizado se tornou inevitável. A tecnologia surgiu como essa ponte, mas ainda existe um receio generalizado entre profissionais sobre como integrá-la ao cotidiano clínico.

A verdade é que a IA não veio para substituir o psicólogo, mas veio para ampliar sua capacidade de análise, apoiar decisões e permitir que o profissional chegue ao consultório mais preparado.`
  }],
  11: [{
    day: 11,
    event_index: 0,
    platform: 'Instagram',
    title: 'A evolução do aprendizado na Psicologia',
    status: null,
    roteiro: `Como psicólogo clínico, talvez você já tenha sentido isso: só aulas… já não são suficientes.

A Psicologia pede mais. Pede interação, troca real, supervisão contínua, material de apoio e autocuidado.

Estamos na era de experiências em tempo real, juntando conhecimento técnico e prático com a velocidade da tecnologia a nosso favor.

O aprendizado vivo, aquele que conversa com você, responde, acompanha é o que realmente transforma a forma de atender.

Nós vamos te mostrar uma nova forma de atender.
Nos siga para saber mais!`
  }],
  12: [{
    day: 12,
    event_index: 0,
    platform: 'Tarefa',
    title: 'Envio dos conteúdos para aprovação de roteiros e pautas',
    status: null
  }],
  13: [{
    day: 13,
    event_index: 0,
    platform: 'Instagram',
    title: 'A nova geração de psicólogos que cresce mais rápido',
    status: null,
    roteiro: `Alguns profissionais evoluem dez vezes mais rápido que a média.

Mas por que isso acontece na Psicologia?
Sabe o que diferencia quem dispara? Acesso.

Acesso rápido a supervisores, feedback contínuo, um espaço onde é possível tirar dúvidas rápidas.

Nós vamos te mostrar uma nova forma de atender.
Nos siga para não perder esse movimento!`
  }, {
    day: 13,
    event_index: 1,
    platform: 'Tarefa',
    title: 'Otimizar campanha de distribuição de conteúdo',
    status: null
  }],
  14: [{
    day: 14,
    event_index: 0,
    platform: 'Tarefa',
    title: 'Envio dos conteúdos no grupo para gravação',
    status: null
  }],
  16: [{
    day: 16,
    event_index: 0,
    platform: 'Instagram',
    title: 'A verdade sobre insegurança profissional',
    status: null,
    roteiro: `Como psicólogo, você já deve ter se perguntado por que a insegurança aparece justamente quando você mais precisa de firmeza.

A insegurança não vem da falta de talento. Vem da falta de suporte.

Segurança profissional se constrói.
Suporte, você merece!

Nós vamos te mostrar uma nova forma de atender.
Nos siga para não perder esse movimento!`
  }],
  17: [{
    day: 17,
    event_index: 0,
    platform: 'LinkedIn',
    title: 'Revisando conteúdo',
    status: null
  }, {
    day: 17,
    event_index: 1,
    platform: 'Tarefa',
    title: 'Otimizar campanha de distribuição de conteúdo',
    status: null
  }],
  18: [{
    day: 18,
    event_index: 0,
    platform: 'Tarefa',
    title: 'Edição dos conteúdos',
    status: null
  }, {
    day: 18,
    event_index: 1,
    platform: 'Instagram',
    title: 'As oportunidades invisíveis da Psicologia moderna',
    status: null,
    roteiro: `Talvez você ainda esteja enxergando só metade do que a Psicologia oferece hoje.

O mercado mudou. Tem app conectando você a supervisores em minutos.

Nós vamos te mostrar uma nova forma de atender.
Nos siga para não perder esse movimento!`
  }],
  20: [{
    day: 20,
    event_index: 0,
    platform: 'Tarefa',
    title: 'Entrega dos conteúdos editados',
    status: null
  }, {
    day: 20,
    event_index: 1,
    platform: 'Instagram',
    title: 'A pergunta que todo paciente se faz',
    status: null,
    roteiro: `Tem uma pergunta que acompanha todo paciente: "Será que ele sabe o que está fazendo??"

Profissionais atualizados inspiram confiança.

Nós vamos te mostrar uma nova forma de atender.
Nos siga para não perder esse movimento!`
  }],
  21: [{
    day: 21,
    event_index: 0,
    platform: 'Tarefa',
    title: 'Otimizar campanha de distribuição de conteúdo',
    status: null
  }],
  23: [{
    day: 23,
    event_index: 0,
    platform: 'Instagram',
    title: 'Como a IA está virando aliada da Psicologia, não ameaça',
    status: null,
    roteiro: `Durante os seus estudos você já deve ter sentido esse burburinho: "A IA vai substituir todos os Psicólogos."

Na prática, não é bem assim.
IA não substitui psicólogo. Mas aumenta a sua autoridade e agenda!

Nós vamos te mostrar uma nova forma de atender.
Nos siga para não perder esse movimento!`
  }],
  24: [{
    day: 24,
    event_index: 0,
    platform: 'LinkedIn',
    title: 'Revisando conteúdo',
    status: null
  }],
  25: [{
    day: 25,
    event_index: 0,
    platform: 'Instagram',
    title: 'A história que estamos construindo agora',
    status: null,
    roteiro: `Psicólogo, isso que vou te contar vai mudar tudo!

A Nova era da Psicologia está prestes a começar!

Nós vamos te mostrar uma nova forma de atender.
Nos siga para não perder esse movimento!`
  }, {
    day: 25,
    event_index: 1,
    platform: 'Tarefa',
    title: 'Otimizar campanha de distribuição de conteúdo',
    status: null
  }],
  26: [{
    day: 26,
    event_index: 0,
    platform: 'Tarefa',
    title: 'Agendamento de publicações do mês',
    status: null
  }],
  27: [{
    day: 27,
    event_index: 0,
    platform: 'Instagram',
    title: 'Conteúdo a definir',
    status: null
  }, {
    day: 27,
    event_index: 1,
    platform: 'Tarefa',
    title: 'Relatório de campanhas e conteúdo',
    status: null
  }]
};

export const defaultStories: Story[] = [
  { id: 1, title: 'Bastidores emocionais da rotina clínica', desc: 'Fale como foi um dia real de trabalho e como você se sentiu.', done: false },
  { id: 2, title: 'Quando o psicólogo cuida de todos, menos de si', desc: 'Conte algo que mudou em você ao longo do tempo na profissão.', done: false },
  { id: 3, title: 'Sinais sutis de esgotamento que ninguém comenta', desc: 'Diga um sinal simples de cansaço que quase ninguém percebe.', done: false },
  { id: 4, title: 'A diferença entre estudar muito e evoluir de verdade', desc: 'Explique a diferença entre estudar e realmente se sentir seguro atendendo.', done: false },
  { id: 5, title: 'O peso invisível da responsabilidade terapêutica', desc: 'Comente uma responsabilidade que pesa, mas não aparece.', done: false },
  { id: 6, title: 'Por que tantos psicólogos se sentem "para trás"', desc: 'Fale de um pensamento comum de comparação com outros profissionais.', done: false },
  { id: 7, title: 'A solidão que começa depois do diploma', desc: 'Conte como é estar sozinho mesmo atendendo pessoas o dia todo.', done: false },
  { id: 8, title: 'O medo silencioso de não ser bom o suficiente', desc: 'Diga um medo profissional que quase todo psicólogo já teve.', done: false },
  { id: 9, title: 'O choque entre teoria perfeita e prática real', desc: 'Fale de um choque entre o que aprendeu e o que viveu na prática.', done: false },
  { id: 10, title: 'Como nasce a insegurança profissional', desc: 'Explique de onde nasce a insegurança no começo da carreira.', done: false },
  { id: 11, title: 'O erro comum de tentar ser generalista para sempre', desc: 'Conte por que tentar fazer tudo pode travar o crescimento.', done: false },
  { id: 12, title: 'O momento em que o psicólogo percebe que precisa mudar', desc: 'Fale de um momento em que percebeu que precisava mudar.', done: false },
  { id: 13, title: 'Crescimento profissional sem romantização', desc: 'Mostre que crescer também cansa e confunde.', done: false },
  { id: 14, title: 'O que ninguém explicou sobre carreira em Psicologia', desc: 'Diga algo importante que ninguém te explicou na faculdade.', done: false },
  { id: 15, title: 'A virada de chave entre atender e evoluir', desc: 'Conte quando você sentiu que parou de só atender e começou a evoluir.', done: false },
  { id: 16, title: 'O papel da supervisão na maturidade clínica', desc: 'Explique para que serve a supervisão de forma simples.', done: false },
  { id: 17, title: 'O custo emocional de caminhar sozinho', desc: 'Fale do peso de tentar resolver tudo sozinho.', done: false },
  { id: 18, title: 'A nova Psicologia que não aparece na faculdade', desc: 'Mostre uma mudança na Psicologia que já está acontecendo.', done: false },
  { id: 19, title: 'Tecnologia como extensão do raciocínio clínico', desc: 'Explique como a tecnologia pode ajudar, não substituir.', done: false },
  { id: 20, title: 'O medo oculto da substituição pela IA', desc: 'Fale do medo de ser trocado por tecnologia.', done: false },
];
