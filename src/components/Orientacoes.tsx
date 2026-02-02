import React from 'react';

const Orientacoes = () => {
  const orientacoes = [
    {
      title: 'Tom pessoal',
      desc: 'Grave como se estivesse conversando com uma única pessoa, não com "todo mundo do Instagram".',
    },
    {
      title: 'Simplicidade',
      desc: 'Stories funcionam melhor quando são simples, diretos e humanos: fale olhando para a câmera, em pé ou sentado, com o celular na vertical e áudio limpo.',
    },
    {
      title: 'Foco único',
      desc: 'Cada story deve ter uma ideia só. Comece dizendo algo que puxe a atenção nos primeiros segundos, depois explique em poucas frases e finalize com uma conclusão clara.',
    },
    {
      title: 'Naturalidade',
      desc: 'Não precisa roteiro engessado. Pense assim: "Se alguém me perguntasse isso agora, como eu responderia?" — e responda.',
    },
    {
      title: 'Autenticidade',
      desc: 'Tom de voz natural, sem leitura, sem performance. Erro pequeno, pausa e respiração fazem parte e passam verdade.',
    },
    {
      title: 'Identificação',
      desc: 'O objetivo não é ensinar tudo, é gerar identificação e fazer a pessoa pensar: "Isso é sobre mim."',
    },
    {
      title: 'Conversação',
      desc: 'Stories não são palestra. São conversa curta, diária e contínua.',
    },
    {
      title: 'Compartilhamento',
      desc: 'Poste no seu próprio Instagram e marque o perfil da Psiviver na publicação, compartilharemos os stories feitos em nosso perfil oficial.',
    },
  ];

  return (
    <div className="bg-card rounded-xl p-6 shadow-lg border border-border animate-fade-in">
      <h2 className="text-2xl font-display font-bold text-primary uppercase tracking-wider mb-6">
        Orientações para Gravar Stories
      </h2>

      <ul className="space-y-3">
        {orientacoes.map((item, index) => (
          <li
            key={index}
            className="p-4 bg-muted rounded-lg border border-border hover:bg-muted/80 hover:translate-x-1 transition-all"
          >
            <strong className="text-primary">{item.title}:</strong> {item.desc}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Orientacoes;
