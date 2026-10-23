# Redenção

Jogo de investigação 2D em pixel art, jogado no navegador, com estética noir — sem preto e branco, mas em preto, cinza, branco e tonalidades de azul.

Esta etapa contempla **apenas o menu principal**. Nenhuma lógica de investigação, loja, conquistas desbloqueáveis ou integração com o código em Portugol será implementada agora.

## Escopo desta etapa

### Tela de menu
- Título **Redenção** no topo, centralizado.
- Logo abaixo, os botões: **Jogar**, **Opções**, **Loja**, **Conquistas** e **Sair**.
- Layout responsivo para desktop e mobile.

### Comportamento dos botões
| Botão | Ação nesta versão |
|---|---|
| **Jogar** | Exibe somente a mensagem "Caso em andamento...". Não abre tela de jogo. |
| **Opções** | Painel com dois controles deslizantes: **Volume principal** e **Volume ambiente**. As preferências são salvas no navegador. |
| **Loja** | Tela vazia, com aviso de que a loja ainda está fechada. Sem itens e sem compras. |
| **Conquistas** | Tela cheia com 12 medalhas, todas escuras/apagadas e contador `0 / 12`. Nenhum desbloqueio nesta versão. |
| **Sair** | Tenta fechar a aba. Como navegadores bloqueiam `window.close()` em abas abertas manualmente, exibe uma tela de despedida com orientação para fechar a aba. |

### Identidade visual
- **Título:** fonte pixel art (**Press Start 2P**).
- **Demais textos:** fonte arredondada, macia e legível (**Nunito**), com fallbacks de sistema.
- Paleta restrita a preto, cinza, branco e azuis.
- Clima noir: vinheta, grão de filme, chuva fina, névoa azulada e brilho sutil.
- Efeitos discretos, respeitando `prefers-reduced-motion`.

### Áudio
- Som de chuva gerado proceduralmente com **Web Audio API**, sem arquivo de áudio externo.
- Volume principal controla a saída geral; volume ambiente controla a chuva.
- O áudio inicia após a primeira interação do usuário, conforme a política de autoplay dos navegadores.
- Preferências de volume persistidas em `localStorage`.

## Planejamento técnico

### Stack
- **Node.js** para servir os arquivos estáticos.
- **HTML, CSS e JavaScript** puro no navegador.
- Sem framework, sem banco de dados e sem dependências npm.

### Estrutura prevista
```
index.js                  servidor HTTP nativo na porta 3000
package.json              script "start"
README.md                 este planejamento
public/
  index.html              menu e painéis
  styles.css              identidade visual noir
  app.js                  navegação, painéis, controles e sair
  audio.js                chuva procedural e volumes
  assets/fonts/           Press Start 2P e Nunito em woff2
```

### Servidor
- Servir a pasta `public/`.
- Resolver `/` para `index.html`.
- Suportar tipos MIME comuns, incluindo `woff2`.
- Bloquear acesso fora da pasta pública.
- Responder 404 para arquivos inexistentes.
- Executar com `npm start` e abrir em `http://localhost:3000`.

### Acessibilidade e usabilidade
- Botões e painéis navegáveis por teclado.
- Fechamento de painéis com `ESC`, botão de fechar ou clique fora.
- Foco preso dentro do painel aberto enquanto ele estiver visível.
- Textos com contraste adequado sobre o fundo escuro.
- `aria-live` para a mensagem de "Caso em andamento...".

## Legado em Portugol

O código original em Portugol **não será descartado**. Nesta etapa ele não será lido, alterado ou recriado. A integração será planejada depois que o código for disponibilizado para análise.

## Fora de escopo

- Lógica do jogo, fases, personagens, diálogos ou investigação.
- Itens, moedas ou compras na loja.
- Desbloqueio real de conquistas.
- Persistência de progresso do jogo.
- Adaptação do código em Portugol.
- Backend com banco de dados, contas ou autenticação.

## Critérios de conclusão

- Menu carrega corretamente em `http://localhost:3000`.
- Título em pixel art e textos na fonte arredondada.
- Paleta e efeitos noir aplicados apenas com preto, cinza, branco e azul.
- Os cinco botões funcionam conforme a tabela.
- Sliders alteram os volumes e mantêm os valores após recarregar.
- Chuva audível após a primeira interação.
- Conquistas exibem 12 medalhas escuras.
- Nenhuma funcionalidade além do menu é implementada.
