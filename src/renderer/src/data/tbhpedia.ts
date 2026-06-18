// Conteudo da aba TBHPedia, derivado de docs/TBHPEDIA.md (datamine de lancamento;
// valores podem mudar com patches).

export interface PediaTable {
  caption?: string
  headers: string[]
  rows: string[][]
}

export interface PediaSection {
  id: string
  title: string
  icon: string
  intro?: string[]
  tables?: PediaTable[]
  notes?: string[]
}

export const TBHPEDIA: PediaSection[] = [
  {
    id: 'visao-geral',
    title: 'Visão geral',
    icon: '🎮',
    intro: [
      'RPG idle hack-and-slash que "ancora" um grupo pixel-art na barra de tarefas do Windows.',
      'Devs: Nugem Studio / Tesseract Studio. Free-to-play na Steam (App ID 3678970), lançado em 27 mai 2026.',
      'Grupo de até 3 heróis lutando automaticamente; loot estilo Diablo + economia real via Steam Market.'
    ],
    notes: [
      'Loop central: a renda escala com clears por hora, não com o nível do estágio.',
      'Melhor farm = estágio mais alto que o time limpa rápido e com segurança (sem morrer). Se o clear demora ou arrisca morte, desce um estágio.',
      'Offline não dropa baús — o jogo precisa estar rodando.'
    ]
  },
  {
    id: 'herois',
    title: 'Heróis',
    icon: '⚔️',
    intro: ['São 6 heróis; grupo de até 3 lutando automaticamente.'],
    tables: [
      {
        headers: ['Herói', 'Arma', 'Papel', 'HP', 'ATK', 'Crit', 'Armor', 'Atk Spd', 'Tier', 'Disponibilidade'],
        rows: [
          ['Knight', 'Espada/Escudo', 'Tank', '130', '2', '2.5%', '45', '0.90', 'S', 'Base'],
          ['Ranger', 'Arco', 'DPS físico', '60', '1', '4%', '8', '1.00', 'B', 'Base'],
          ['Sorcerer', 'Cajado', 'DPS AoE', '50', '2', '5%', '5', '0.55', 'A', 'Base'],
          ['Priest', 'Cetro', 'Suporte/Cura', '95', '1', '2%', '30', '0.90', 'S', 'DLC grátis'],
          ['Hunter', 'Besta', 'DPS tático', '70', '2', '4.5%', '15', '0.70', 'S', 'DLC pago'],
          ['Slayer', 'Machado', 'Bruiser melee', '115', '2', '2.5%', '40', '0.70', 'A', 'DLC pago']
        ]
      }
    ],
    notes: [
      'Começa com 1 slot; abrir 2º/3º (Runa de Comando) é a prioridade nº 1.',
      'Redeploy tem cooldown de 60s. Classes DLC desbloqueáveis na Formação por 500 moedas.',
      'Composição grátis: Knight + Priest + Sorcerer. Farm popular: Knight + Ranger + Priest.',
      'heroKey no save: 101 Knight · 201 Ranger · 301 Sorcerer · 401 Priest · 501 Hunter · 601 Slayer.'
    ]
  },
  {
    id: 'estagios',
    title: 'Estágios, Atos & Dificuldades',
    icon: '🗺️',
    intro: [
      '3 Atos × 10 estágios × 4 dificuldades = 120 estágios.',
      'X-10 = boss de Ato; exige Soul Stone (consumida só ao vencer; falhas são grátis).',
      'Alcançar um estágio destrava o nível de item que dropa ali, mas raridade não escala por área.',
      'Código do estágio (CurrentStageKey) = DAPP: Dificuldade (1 Normal · 2 Nightmare · 3 Hell · 4 Torment) + Ato (1–3) + fase (01–10). Ex.: 1101 = Normal/Ato1/Fase1; 2110 = Nightmare/Ato1/boss.'
    ],
    tables: [
      {
        caption: 'Dificuldades',
        headers: ['Dificuldade', 'Faixa de nível'],
        rows: [
          ['Normal', '1–32'],
          ['Nightmare (Pesadelo)', '33–52'],
          ['Hell (Inferno)', '53–77'],
          ['Torment (Tormento)', '78–95']
        ]
      },
      {
        caption: 'Atos',
        headers: ['Ato', 'Tema', 'Boss', 'Local (X-10)'],
        rows: [
          ['1', 'Campos Verdes & Terras Amaldiçoadas', 'Skeleton King', 'Throne of Darkness'],
          ['2', 'Deserto & Tumbas', 'Desert Overlord', "Pharaoh's Underchannel"],
          ['3', 'Ermos Gelados & Inferno', 'Archon Morkar', 'Hell Command Chamber']
        ]
      }
    ],
    notes: [
      'Amostra (Normal · Ato 1): 1101 Pasture (Lv1, 10 ondas, 140 ouro, 155 exp, Goblin Thief) · 1102 Shadow Meadow · 1103 Wasteland · 1108 Cemetery (Lv10) · 1110 Throne of Darkness (boss).'
    ]
  },
  {
    id: 'cubo',
    title: 'Hero-dric Cube',
    icon: '🧊',
    intro: [
      'Hub de crafting; desbloqueia no nível 4. Trade Ship (envio para inventário Steam) exige Cubo nível 10.'
    ],
    tables: [
      {
        headers: ['Função', 'Desbloqueio', 'O que faz'],
        rows: [
          ['Synthesis', 'Nível 4', '9 itens de mesma raridade → 1 de raridade superior (pode pular tiers)'],
          ['Alchemy', 'Nível 4', 'Derrete gear em ouro + XP de Cubo (renda principal)'],
          ['Crafting', 'Nível 5', 'Cria gear/acessórios aleatórios a partir de materiais'],
          ['Decoration', 'Nível 8', 'Gemas de 1 atributo em gear Rare+'],
          ['Removal', 'Nível 10', 'Remove sockets (destrói material, taxa em ouro)'],
          ['Engraving', 'Immortal+', 'Gravações de material de monstro (2 atributos)'],
          ['Inscription', 'Arcana+', '+1 atributo aleatório em gear Arcana+'],
          ['Offering', 'Endgame', 'Lootbox por moedas comemorativas']
        ]
      }
    ]
  },
  {
    id: 'runas',
    title: 'Árvore de Runas',
    icon: '🌳',
    intro: [
      '197 nós, abre ~nível 3.',
      'A aba Runas tem o mapa interativo (zoom/pan) com seus níveis atuais, efeitos e custos.'
    ],
    tables: [
      {
        headers: ['Direção / nó', 'Foco'],
        rows: [
          ['Sul', 'Runa de Comando → slots 2 e 3 (3º = 150.000 ouro). 2º slot de skill à direita (50.000)'],
          ['Noroeste', 'Ganho de ouro (por kill, de boss, da Alquimia)'],
          ['Extremo Norte', 'Inventário, stash, auto-abrir baús (comum 300s / boss 600s)'],
          ['Nordeste', 'Chance de drop e capacidade de baús'],
          ['Sudeste', 'Ataque/Armadura/Velocidade de todos os heróis'],
          ['Repose', 'Recompensas offline (XP/ouro; sem baús)'],
          ['Runa de Despertar', 'Slot extra de skill por herói']
        ]
      }
    ],
    notes: [
      'Prioridade comum: slots de herói → offline → automação Extremo Norte → ouro/XP → Despertar.',
      'Nós finais 1–3M; zona de ouro começa ~20M; última stash 50M.',
      'Catálogo (nomes/efeitos pt-BR, posições, custos) e ícones: taskbarhero.wiki. RuneKey do save = key do catálogo.'
    ]
  },
  {
    id: 'pets',
    title: 'Pets',
    icon: '🐾',
    intro: ['8 pets — sempre ativos e empilháveis; equipar é apenas cosmético.'],
    tables: [
      {
        headers: ['Pet', 'Bônus', 'Como obter', 'Origem'],
        rows: [
          ['Bat', '+100% baú comum · +150 EXP', '5.000 Bats (City Outskirts)', 'Grátis'],
          ['Watcher', '+150 ouro', '5.000 Giant Fly (Scorching Dunes)', 'Grátis'],
          ['Burning Skeleton', '+100% baú de boss', '5.000 Fire Elemental (Sacred Tomb)', 'Grátis'],
          ['Blue Golem', '+150% baú comum', '5.000 Hell Golem (Burning Ravine)', 'Grátis'],
          ['Dark Spirit', '+150% baú de boss', '5.000 Ghost (Frozen Glacier Cavern)', 'Grátis'],
          ['Sword', '+150 EXP', 'Supporter Pack', 'DLC'],
          ['Butterfly', '+100 ouro', 'Supporter Pack', 'DLC'],
          ['Dragon', '+200% baú comum · +150 ouro · +200 EXP', 'Supporter Pack', 'DLC']
        ]
      }
    ],
    notes: [
      'Apenas kills online contam para desbloquear pets.',
      'Melhor pago: Dragon. Melhor grátis para ouro: Watcher.'
    ]
  },
  {
    id: 'raridades',
    title: 'Itens & Raridades',
    icon: '💎',
    intro: ['10 raridades. Só Legendary+ é vendável no Market; materiais são vendáveis em qualquer raridade.'],
    tables: [
      {
        headers: ['Raridade', 'Valor rel.', 'Vendável no Market', 'Sockets'],
        rows: [
          ['Common', '1×', 'Não', '—'],
          ['Uncommon', '3×', 'Não', '—'],
          ['Rare', '9×', 'Não', 'Decoration'],
          ['Legendary', '27×', 'Sim', 'Decoration'],
          ['Immortal', '81×', 'Sim', '+ Engraving'],
          ['Arcana', '259×', 'Sim', '+ Inscription'],
          ['Beyond', '829×', 'Sim', 'Todos'],
          ['Celestial', '2.986×', 'Sim', 'Todos'],
          ['Divine', '10.750×', 'Sim', 'Todos'],
          ['Cosmic', '45.150×', 'Sim', 'Todos']
        ]
      }
    ],
    notes: ['Remover sockets antes de listar no Market.']
  },
  {
    id: 'baus',
    title: 'Baús & Soul Stones',
    icon: '📦',
    tables: [
      {
        headers: ['Baú', 'Origem', 'Auto-abrir'],
        rows: [
          ['Comum (branco)', 'Drop em combate, qualquer hora', '300s'],
          ['Stage Boss (azul)', 'Bosses de estágio (chance, +runas)', '600s'],
          ['Act Boss (vermelho)', 'Bosses de Ato (garantido; consome Soul Stone)', '—']
        ]
      }
    ],
    notes: [
      'Soul Stones gateiam bosses de Ato (consumidas só ao vencer); dropam de baús (mais no Ato 2+); vendáveis no Market.',
      'Red soulstone alquimiza ~9.720 ouro.'
    ]
  },
  {
    id: 'seguranca',
    title: 'Anti-cheat & segurança',
    icon: '🛡️',
    intro: [
      'O jogo usa ACTk (Anti-Cheat Toolkit): detecta modificação de memória, protege o save e escaneia processos em segundo plano (speedhacks/editores de memória).'
    ],
    notes: [
      'Punição = ban permanente do Steam Market (o jogo continua jogável). Política de duas detecções; ~350 contas banidas no início.',
      'Falsos-positivos: autoclickers/macros, Cheat Engine/trainers de outros jogos, overlays/otimizadores, anti-cheat de outros jogos.',
      'Postura do TBH-Tracker: somente leitura do save, relendo quando muda; nunca ler/escrever memória, anexar a processos, injetar ou automatizar input; nunca modificar o save. Operação 100% passiva e externa. O risco residual existe — a decisão de uso é do jogador.'
    ]
  }
]
