import React from 'react';

const Rotina = () => {
  return (
    <div className="bg-card rounded-xl p-6 shadow-lg border border-border space-y-6 animate-fade-in">
      <h2 className="text-2xl font-display font-bold text-primary uppercase tracking-wider">
        Rotina de Gestão
      </h2>

      <div>
        <h3 className="text-xl font-display text-primary mb-4">
          📊 Frequência de Publicações
        </h3>
        <ul className="space-y-2">
          <li className="p-3 bg-muted rounded-lg border border-border hover:bg-muted/80 hover:translate-x-1 transition-all">
            <strong className="text-primary">Instagram:</strong> 3 postagens por semana
          </li>
          <li className="p-3 bg-muted rounded-lg border border-border hover:bg-muted/80 hover:translate-x-1 transition-all">
            <strong className="text-primary">LinkedIn:</strong> 1 postagem por semana
          </li>
        </ul>
      </div>

      <div>
        <h3 className="text-xl font-display text-primary mb-4">
          📱 Rotina de Redes Sociais
        </h3>
        <ul className="space-y-2">
          {[
            'Verificação de alcance das postagens',
            'Resposta aos comentários das publicações',
            'Resposta às mensagens enviadas pelos seguidores no direct',
            'Resposta aos comentários na publicação do artigo no LinkedIn',
            'Compartilhamento de stories dos parceiros no perfil da Psiviver no Instagram',
          ].map((item, index) => (
            <li
              key={index}
              className="p-3 bg-muted rounded-lg border border-border hover:bg-muted/80 hover:translate-x-1 transition-all"
            >
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="text-xl font-display text-primary mb-4">
          📈 Rotina de Gestão de Tráfego
        </h3>
        <ul className="space-y-2">
          {[
            'Análise de métricas diária',
            'Alimentação da planilha de métricas',
            'Atualização do relatório semanal de tráfego no link',
            'Insights sobre os anúncios semanal',
            'Call de apresentação de métricas',
          ].map((item, index) => (
            <li
              key={index}
              className="p-3 bg-muted rounded-lg border border-border hover:bg-muted/80 hover:translate-x-1 transition-all"
            >
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Rotina;
