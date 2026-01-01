import { Character, NenType } from './types';

export const INITIAL_CHARACTER: Character = {
  id: 'char_default',
  name: "Cristian Martínez",
  nickname: "'Hades'",
  avatarUrl: "https://i.pinimg.com/736x/8e/46/64/8e4664440076a084c7873994c657a827.jpg", 
  age: 18,
  nationality: "Peruano",
  height: "1.72 m",
  weight: "64 kg",
  alignment: "Neutro-Neutro",
  bio: "Hades cresceu nas ruas de Meteor City, aprendendo desde cedo que apenas os fortes sobrevivem. Sua habilidade com a espada é uma extensão de sua vontade de proteger aqueles que considera seus. Após despertar seu Nen durante um incidente traumático, ele busca se tornar um Blacklist Hunter para caçar criminosos perigosos.",
  hunterLevel: 5,
  xp: 250,
  maxXp: 600,
  nenType: NenType.Specialist, 
  
  maxHp: 34,
  currentHp: 34,
  maxNen: 58,
  currentNen: 33,
  ca: 15,

  attributes: {
    strength: -2,
    constitution: -2,
    intelligence: 0,
    charisma: -3,
    determination: 3,
    prestidigitation: 5,
  },

  skills: [
    {
      id: '1',
      name: 'Força de Pulso',
      category: 'Weapon',
      type: 'Active',
      cost: 2,
      damageDice: '1d8',
      attributeScaling: 'determination',
      description: 'Hades golpeia o ar com sua espada, criando uma onda de choque em cone.',
      imageUrl: 'https://i.pinimg.com/564x/4d/2e/77/4d2e77987823e595df5057a151859c2c.jpg'
    },
    {
      id: '2',
      name: 'Passo Sombrio',
      category: 'Combat',
      type: 'Bonus',
      cost: 0,
      damageDice: '2d6', 
      attributeScaling: 'prestidigitation',
      description: 'Técnica de movimentação silenciosa. Próximo ataque tem vantagem e dobra o dano se não detectado.',
    },
    {
      id: '3',
      name: 'Roubo Vital',
      category: 'Hatsu',
      type: 'Passive',
      description: 'Habilidade de Especialista que rouba metade do dano causado como Nen (arredondado para baixo).',
    },
  ],
  inventory: [
    { id: 'i1', name: "Espada Curta (Dano Cortante)", quantity: 1 },
    { id: 'i2', name: "Poção de Cura Menor", quantity: 2 },
    { id: 'i3', name: "Licença Hunter", quantity: 1 }
  ],
  summons: [
    {
      id: 's1',
      name: 'Guardião Sombrio',
      avatarUrl: 'https://i.pinimg.com/564x/0a/65/59/0a6559385b0451df6718d09794025171.jpg',
      type: 'Besta de Nen',
      currentHp: 20,
      maxHp: 20,
      currentNen: 10,
      maxNen: 10,
      attributes: {
        strength: 3,
        constitution: 2,
        intelligence: -2,
        charisma: -3,
        determination: 4,
        prestidigitation: 2,
      },
      description: 'Um lobo feito de sombras que persegue alvos marcados.',
      skills: [
        {
           id: 's1_sk1',
           name: 'Mordida Espectral',
           category: 'Combat',
           type: 'Active',
           cost: 2,
           damageDice: '1d6',
           description: 'O lobo morde o alvo, ignorando armadura física.',
           imageUrl: 'https://i.pinimg.com/564x/58/2f/52/582f5255470d0554f653457224250266.jpg'
        }
      ]
    }
  ],
  conditions: []
};

export const NEN_COLORS = {
  [NenType.Enhancer]: '#2ecc71', // Green
  [NenType.Transmuter]: '#d500f9', // Deep Purple/Pink Neon
  [NenType.Emitter]: '#29b6f6', // Light Blue
  [NenType.Conjurer]: '#ff1744', // Red Neon
  [NenType.Manipulator]: '#00e676', // Teal/Greenish
  [NenType.Specialist]: '#ffea00', // Yellow Neon
};