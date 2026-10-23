# Redenção

Jogo de investigação narrativo, jogado no navegador, com estética noir — sem preto e branco, mas em preto, cinza, branco e tonalidades de azul.

A história é uma adaptação do código em Portugol disponível em `codigo.txt`. O jogo está jogável do prólogo ao combate final, com exploração, pistas, carta aleatória e dois finais.

## Estado atual

- Menu principal com **Jogar**, **Opções**, **Loja**, **Conquistas** e **Sair**.
- **Jogar** abre o prólogo e inicia a história na Mansão Albrecht.
- Prólogo em estilo visual novel, com botão **Continuar**, Enter, Espaço ou W.
- Exploração de cinco cômodos com 24 pontos de investigação.
- Carta de Helena que muda de cômodo a cada nova partida ou reinício.
- Cofre com senha, chave enferrujada e galpão trancado.
- Combate final por turnos com **Atirar** e **Esquivar**.
- Finais de vitória e derrota adaptados do código original.
- Menu e painéis atuais preservados nesta etapa; a remoção definitiva do menu fica para uma próxima alteração.

## Como executar

```bash
npm start
```

Abra `http://localhost:3000`.

O servidor é HTTP nativo, sem dependências npm.

## Controles

| Contexto | Ação |
|---|---|
| Menu | Mouse ou teclado |
| Prólogo | Enter, Espaço, W ou botão **Continuar** |
| Exploração | Botões de cômodos e de investigação |
| Cofre | Digitar a senha e confirmar |
| Combate | **Atirar**, **Esquivar** e **Continuar** |
| Fim de jogo | **Jogar novamente** ou **Voltar ao menu** |

## Estrutura da história

### Prólogo
Douglas Silva, 60 anos, prestes a se aposentar, aceita uma última missão do delegado local: investigar a antiga Mansão Albrecht. A casa é famosa por boatos de assombrações e desaparecimentos. No caminho, uma enxaqueca forte parece anunciar que algo ali o rejeita. Ele chega, acende um charuto e abre a porta com cautela.

### Exploração
O jogador investiga cinco locais:

- **Sala de estar:** papéis da escrivaninha, cofre atrás do quadro, lareira, estante e relógio.
- **Cozinha:** geladeira, gavetas com a chave, mesa posta, pia e despensa.
- **Banheiros:** espelho quebrado, marcas nas paredes, armário de remédios, banheira e pia.
- **Quartos:** quarto do casal, guarda-roupa, criado-mudo, quarto de hóspedes e janela.
- **Jardim de folhas secas:** galpão, roseiras, banco, árvore antiga e o poço.

Cada cômodo mostra o progresso de investigação, como `3 / 5 pistas`. É possível voltar e examinar o que faltou.

### Carta de Helena
A carta está sempre em um dos cinco cômodos, mas o local muda a cada nova partida:

- entre as páginas do livro de poesias, na sala;
- no fundo de uma lata na despensa;
- atrás do espelho quebrado;
- sob o colchão do quarto de hóspedes;
- dentro do galpão do jardim.

O cômodo anterior fica salvo em `localStorage` para garantir que a carta mude no próximo reinício. O galpão exige a chave enferrujada da cozinha.

A carta não é obrigatória para chegar ao combate, mas, se encontrada, acrescenta uma passagem ao epílogo.

### Combate final
Ao se aproximar do poço, Douglas enfrenta Helena. O combate mantém a regra original de cinco acertos para cada lado, mas foi reimplementado como uma máquina de estados:

- cada ação resolve exatamente um turno;
- os contadores são atualizados na hora;
- após cada ação, o botão **Continuar** libera o próximo turno;
- não há leitura de texto acumulado nem espera por Enter, eliminando o travamento após o primeiro golpe ou esquiva;
- **Atirar** acerta com resultado maior que 10 em um d20;
- **Esquivar** funciona com resultado maior que 8 em um d20.

### Finais
- **Vitória:** Douglas derrota Helena; os desaparecimentos param e o caso da “Esposa do Poço” permanece famoso. O paradeiro do marido continua desconhecido e omitido.
- **Derrota:** Helena vence Douglas, que não consegue se salvar.

## Essência preservada de `codigo.txt`

- Douglas Silva, 60 anos, e a missão do delegado.
- A Mansão Albrecht, os boatos e os desaparecimentos.
- A enxaqueca no caminho e a sensação de rejeição da casa.
- O charuto e a entrada cautelosa.
- A confissão do marido e os documentos no poço.
- O cofre com a senha `helena`.
- A chave enferrujada e o quarto esvaziado.
- O poço, Helena e o combate de cinco acertos.
- Os textos de vitória e derrota, com o destino do marido omitido.

## Adaptações e adições

- O marido continua sem nome próprio, tratado como “o marido” ou “o dono da casa”, para preservar o mistério do final.
- Foram adicionados pontos de investigação em todos os cômodos para explicar melhor a história do casal.
- A carta de Helena foi incluída como pista emocional e opcional.
- O galpão do jardim dá utilidade à chave encontrada na cozinha.
- O combate foi rebalanceado para permitir progressão justa sem perder a ideia de decisão e sorte.

## Estrutura de arquivos

```text
index.js                  servidor HTTP nativo na porta 3000
package.json              script "start"
codigo.txt                história original em Portugol
README.md                 este documento
public/
  index.html              menu, jogo e painéis
  styles.css              identidade visual noir e interface do jogo
  app.js                  menu, painéis, volumes e integração com o jogo
  audio.js                chuva procedural e volumes
  story.js                textos, cômodos, carta, combate e finais
  game.js                 estado do jogo, exploração, sorteio da carta e combate
  assets/fonts/           Press Start 2P e Nunito em woff2
```

## Áudio e acessibilidade

- Chuva gerada proceduralmente com Web Audio API, sem arquivo de áudio externo.
- Volume principal controla a saída geral; volume ambiente controla a chuva.
- Preferências de volume persistidas em `localStorage`.
- O áudio inicia após a primeira interação do usuário.
- Navegação por teclado, foco gerenciado nas cenas e `aria-live` para a narrativa.
- Efeitos discretos, respeitando `prefers-reduced-motion`.
- Layout responsivo para desktop e mobile.

## Fora de escopo

- Loja com itens e compras.
- Conquistas desbloqueáveis.
- Persistência de progresso da partida.
- Backend, contas ou autenticação.
- Adaptação do `codigo.txt` de volta para Portugol.

## Critérios de conclusão

- Menu carrega em `http://localhost:3000`.
- **Jogar** inicia o prólogo e permite chegar ao fim da história.
- Os cinco cômodos têm pontos de investigação suficientes para explicar o casal.
- A carta muda de cômodo a cada novo jogo/reinício.
- O cofre aceita `helena` e a chave abre o galpão.
- O combate avança após cada ação e permite vitória ou derrota.
- Os finais preservam a essência do código original.
- Menu, opções, volumes e áudio continuam funcionando.
