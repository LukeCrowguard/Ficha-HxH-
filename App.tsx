import React, { useState, useRef, useEffect } from 'react';
import { 
  Shield, Zap, Heart, Sword, Brain, Activity, Ghost, Feather, Dna, 
  Dice5, Trash2, Droplet, Edit3, Save, Plus, X, Camera, ScrollText, BookOpen, Upload, PawPrint,
  Moon, Sun, Flame, Minus, PlusCircle, Image as ImageIcon, Target, Star, Gift, FlaskConical, Box,
  Users, UserPlus, Check, LayoutGrid
} from 'lucide-react';
import { INITIAL_CHARACTER, NEN_COLORS } from './constants';
import { Character, LogEntry, Skill, NenType, Attributes, MiniCharacter, SkillCategory, InventoryItem } from './types';
import StatBar from './components/StatBar';
import AttributeDisplay from './components/AttributeDisplay';
import NenHexagon from './components/NenHexagon';
import AttributesRadar from './components/AttributesRadar';

// Helper for rolling dice
const rollDice = (diceStr: string): number => {
  try {
    const [count, die] = diceStr.toLowerCase().split('d').map(Number);
    let total = 0;
    for (let i = 0; i < count; i++) {
      total += Math.floor(Math.random() * die) + 1;
    }
    return total;
  } catch (e) {
    return 0;
  }
};

type UploadTarget = 
  | { type: 'charAvatar' }
  | { type: 'summonAvatar', summonId: string }
  | { type: 'skillImage' }
  | null;

type SkillContext = 
  | { type: 'character', defaultCategory?: SkillCategory }
  | { type: 'summon', summonId: string };

type TabType = 'hatsus' | 'combat' | 'weapon' | 'summons' | 'inventory' | 'bio';

const App: React.FC = () => {
  // --- STATE ---
  // Character Management
  const [characters, setCharacters] = useState<Character[]>([INITIAL_CHARACTER]);
  const [activeCharId, setActiveCharId] = useState<string>(INITIAL_CHARACTER.id);
  const [isCharModalOpen, setIsCharModalOpen] = useState(false);

  // Derived Active Character
  const char = characters.find(c => c.id === activeCharId) || characters[0];
  const themeColor = NEN_COLORS[char.nenType] || '#9b59b6';

  // UI State
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('hatsus');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [showDiceMenu, setShowDiceMenu] = useState(false);
  
  // Modal State for Skills
  const [isSkillModalOpen, setSkillModalOpen] = useState(false);
  const [editingSkillId, setEditingSkillId] = useState<string | null>(null);
  const [skillContext, setSkillContext] = useState<SkillContext>({ type: 'character' });
  const [newSkill, setNewSkill] = useState<Partial<Skill>>({ type: 'Active', name: '', description: '', category: 'Hatsu' });

  // Modal State for Summons
  const [isSummonModalOpen, setSummonModalOpen] = useState(false);
  const [editingSummonId, setEditingSummonId] = useState<string | null>(null);
  const [newSummon, setNewSummon] = useState<Partial<MiniCharacter>>({ 
    name: '', 
    type: 'Besta de Nen', 
    maxHp: 10, 
    maxNen: 0, 
    skills: [],
    attributes: { strength: 0, constitution: 0, intelligence: 0, charisma: 0, determination: 0, prestidigitation: 0 }
  });

  // Upload State
  const [uploadTarget, setUploadTarget] = useState<UploadTarget>(null);

  const logsEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // --- ACTIONS ---

  // Character Management Actions
  const handleSwitchChar = (id: string) => {
    setActiveCharId(id);
    setIsCharModalOpen(false);
    addLog(`Trocou para personagem: ${characters.find(c => c.id === id)?.nickname}`, 'info');
  };

  const handleCreateChar = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    const newChar: Character = {
        ...INITIAL_CHARACTER,
        id: newId,
        name: "Novo Caçador",
        nickname: "Novato",
        avatarUrl: "https://i.pinimg.com/564x/e7/1d/18/e71d1877d9c66914565780337c87042a.jpg", // Default placeholder
        nenType: NenType.Enhancer,
        attributes: { strength: 0, constitution: 0, intelligence: 0, charisma: 0, determination: 0, prestidigitation: 0 },
        skills: [],
        inventory: [],
        summons: [],
        conditions: [],
        xp: 0,
        hunterLevel: 1,
        maxHp: 20,
        currentHp: 20,
        maxNen: 10,
        currentNen: 10,
        bio: ""
    };
    setCharacters(prev => [...prev, newChar]);
    setActiveCharId(newId);
    setIsCharModalOpen(false);
    addLog("Novo personagem criado.", 'info');
    setIsEditing(true); // Auto enter edit mode
  };

  const handleDeleteChar = (id: string) => {
    if (characters.length <= 1) {
        alert("Você precisa ter pelo menos um personagem.");
        return;
    }
    if (confirm("Tem certeza que deseja excluir este personagem permanentemente?")) {
        const newChars = characters.filter(c => c.id !== id);
        setCharacters(newChars);
        if (activeCharId === id) {
            setActiveCharId(newChars[0].id);
        }
    }
  };

  // Log Action
  const addLog = (text: string, type: LogEntry['type'] = 'info') => {
    setLogs(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      text,
      type,
      timestamp: new Date()
    }]);
  };

  // State Updates Wrapper (Important: Update the Active Character in the Array)
  const updateChar = (field: keyof Character, value: any) => {
    setCharacters(prev => prev.map(c => c.id === activeCharId ? { ...c, [field]: value } : c));
  };

  const updateAttribute = (attr: keyof Attributes, val: number) => {
    setCharacters(prev => prev.map(c => 
        c.id === activeCharId ? { ...c, attributes: { ...c.attributes, [attr]: val } } : c
    ));
  };

  const updateSummonStat = (id: string, field: keyof MiniCharacter, val: number) => {
     setCharacters(prev => prev.map(c => {
         if (c.id === activeCharId) {
             return {
                 ...c,
                 summons: c.summons.map(s => s.id === id ? { ...s, [field]: val } : s)
             };
         }
         return c;
     }));
  };

  // Game Logic
  const handleAttributeRoll = (attrName: string, value: number) => {
    if (isEditing) return;
    const d20 = Math.floor(Math.random() * 20) + 1;
    const total = d20 + value;
    addLog(`Teste de ${attrName}: [d20: ${d20}] ${value >= 0 ? '+' : ''}${value} = ${total}`, 'info');
  };

  const handleGlobalRoll = (sides: number) => {
      const result = Math.floor(Math.random() * sides) + 1;
      addLog(`Rolou d${sides}: ${result}`, 'info');
      setShowDiceMenu(false);
  };

  const handleSkillClick = (skill: Skill, sourceName: string = char.nickname, sourceNen?: {current: number, set: (v: number) => void}) => {
    if (isEditing) {
      const isCharSkill = char.skills.some(s => s.id === skill.id);
      if (isCharSkill) {
         openEditSkillModal(skill, { type: 'character' });
      } else {
         const summon = char.summons.find(s => s.skills.some(ss => ss.id === skill.id));
         if (summon) {
            openEditSkillModal(skill, { type: 'summon', summonId: summon.id });
         }
      }
      return;
    }

    let currentNen = sourceNen ? sourceNen.current : char.currentNen;
    
    if (skill.cost && currentNen < skill.cost) {
      addLog(`${sourceName}: Nen insuficiente para ${skill.name}! (${skill.cost})`, 'info');
      return;
    }

    if (skill.cost) {
      const newNen = Math.max(0, currentNen - skill.cost);
      if (sourceNen) {
         sourceNen.set(newNen);
      } else {
         updateChar('currentNen', newNen);
      }
      addLog(`${sourceName} usou ${skill.name} (-${skill.cost} Nen)`, 'cost');
    } else {
      addLog(`${sourceName} usou ${skill.name}`, 'info');
    }

    if (skill.damageDice) {
      let dmg = rollDice(skill.damageDice);
      let scalingBonus = 0;
      if (skill.attributeScaling) {
        scalingBonus = char.attributes[skill.attributeScaling];
        dmg += scalingBonus;
      }
      addLog(`Causou ${dmg} dano! (${skill.damageDice} ${scalingBonus >= 0 ? '+' : ''}${scalingBonus})`, 'damage');
    }
  };

  // Update specific sub-entities (Inventory, Skills, Summons) directly on the array
  const setCharInventory = (fn: (inv: InventoryItem[]) => InventoryItem[]) => {
      setCharacters(prev => prev.map(c => c.id === activeCharId ? { ...c, inventory: fn(c.inventory) } : c));
  }
  const setCharConditions = (fn: (cond: string[]) => string[]) => {
    setCharacters(prev => prev.map(c => c.id === activeCharId ? { ...c, conditions: fn(c.conditions) } : c));
  }
  const setCharSkills = (fn: (skills: Skill[]) => Skill[]) => {
    setCharacters(prev => prev.map(c => c.id === activeCharId ? { ...c, skills: fn(c.skills) } : c));
  }
  const setCharSummons = (fn: (summons: MiniCharacter[]) => MiniCharacter[]) => {
    setCharacters(prev => prev.map(c => c.id === activeCharId ? { ...c, summons: fn(c.summons) } : c));
  }


  // Skill Management
  const handleSaveSkill = () => {
    if (!newSkill.name) return;

    const skillToSave: Skill = {
        id: editingSkillId || Math.random().toString(36),
        name: newSkill.name,
        category: newSkill.category || 'Hatsu',
        type: newSkill.type as any || 'Active',
        description: newSkill.description || '',
        cost: newSkill.cost,
        damageDice: newSkill.damageDice,
        attributeScaling: newSkill.attributeScaling as any,
        imageUrl: newSkill.imageUrl
    };

    if (skillContext.type === 'character') {
        if (editingSkillId) {
            setCharSkills(prev => prev.map(s => s.id === editingSkillId ? skillToSave : s));
            addLog(`Atualizou habilidade: ${newSkill.name}`, 'info');
        } else {
            setCharSkills(prev => [...prev, skillToSave]);
            addLog(`Adicionou habilidade: ${newSkill.name}`, 'info');
        }
    } else if (skillContext.type === 'summon') {
        setCharSummons(prev => prev.map(s => {
            if (s.id === skillContext.summonId) {
                const updatedSkills = editingSkillId 
                    ? s.skills.map(sk => sk.id === editingSkillId ? skillToSave : sk)
                    : [...s.skills, skillToSave];
                return { ...s, skills: updatedSkills };
            }
            return s;
        }));
        addLog(`Invocação aprendeu: ${newSkill.name}`, 'info');
    }
    
    setNewSkill({ type: 'Active', name: '', description: '', category: 'Hatsu' });
    setEditingSkillId(null);
    setSkillModalOpen(false);
  };

  const openAddSkillModal = (context: SkillContext) => {
    setNewSkill({ 
        type: 'Active', 
        name: '', 
        description: '', 
        category: context.type === 'character' ? context.defaultCategory || 'Hatsu' : 'Combat' 
    });
    setEditingSkillId(null);
    setSkillContext(context);
    setSkillModalOpen(true);
  };

  const openEditSkillModal = (skill: Skill, context: SkillContext) => {
    setNewSkill(skill);
    setEditingSkillId(skill.id);
    setSkillContext(context);
    setSkillModalOpen(true);
  };

  const removeSkill = (e: React.MouseEvent, id: string, context: SkillContext) => {
    e.stopPropagation();
    if (context.type === 'character') {
        setCharSkills(prev => prev.filter(s => s.id !== id));
    } else {
        setCharSummons(prev => prev.map(s => {
                if (s.id === context.summonId) {
                    return { ...s, skills: s.skills.filter(sk => sk.id !== id) };
                }
                return s;
            })
        );
    }
  };

  // Summon Management
  const handleSaveSummon = () => {
    if (!newSummon.name) return;
    
    const defaultAttrs = { strength: 0, constitution: 0, intelligence: 0, charisma: 0, determination: 0, prestidigitation: 0 };
    const summonToSave = {
        ...newSummon,
        attributes: { ...defaultAttrs, ...newSummon.attributes }
    } as MiniCharacter;

    if (editingSummonId) {
      setCharSummons(prev => prev.map(s => s.id === editingSummonId ? { ...s, ...summonToSave } : s));
      addLog(`Atualizou invocação: ${newSummon.name}`, 'info');
    } else {
      const summonToAdd: MiniCharacter = {
        ...summonToSave,
        id: Math.random().toString(36),
        name: newSummon.name || 'Nova Invocação',
        type: newSummon.type || 'Besta',
        currentHp: newSummon.maxHp || 10,
        maxHp: newSummon.maxHp || 10,
        currentNen: newSummon.maxNen || 0,
        maxNen: newSummon.maxNen || 0,
        description: newSummon.description || '',
        avatarUrl: newSummon.avatarUrl,
        skills: []
      };
      setCharSummons(prev => [...prev, summonToAdd]);
      addLog(`Invocou: ${summonToAdd.name}`, 'info');
    }
    setNewSummon({ 
        name: '', type: 'Besta de Nen', maxHp: 10, maxNen: 0, description: '', skills: [],
        attributes: defaultAttrs 
    });
    setEditingSummonId(null);
    setSummonModalOpen(false);
  };

  const openAddSummonModal = () => {
    setNewSummon({ 
        name: '', type: 'Besta de Nen', maxHp: 10, maxNen: 0, description: '', skills: [],
        attributes: { strength: 0, constitution: 0, intelligence: 0, charisma: 0, determination: 0, prestidigitation: 0 }
    });
    setEditingSummonId(null);
    setSummonModalOpen(true);
  };

  const handleEditSummon = (summon: MiniCharacter) => {
    setNewSummon({
        ...summon,
        attributes: summon.attributes || { strength: 0, constitution: 0, intelligence: 0, charisma: 0, determination: 0, prestidigitation: 0 }
    });
    setEditingSummonId(summon.id);
    setSummonModalOpen(true);
  }

  const removeSummon = (id: string) => {
    setCharSummons(prev => prev.filter(s => s.id !== id));
  };

  // Inventory & Conditions
  const addInventoryItem = () => {
    const item = prompt("Nome do item:");
    if (item) {
      setCharInventory(prev => [...prev, { id: Math.random().toString(36), name: item, quantity: 1 }]);
    }
  };
  
  const updateInventoryQty = (id: string, delta: number) => {
    setCharInventory(prev => prev.map(item => {
        if (item.id === id) {
          const newQty = Math.max(0, item.quantity + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter(item => item.quantity > 0)
    );
  };

  const removeInventoryItem = (id: string) => {
    setCharInventory(prev => prev.filter(i => i.id !== id));
  };

  const addCondition = () => {
    const cond = prompt("Nova Condição (ex: Zetsu, Envenenado):");
    if (cond) {
      setCharConditions(prev => [...prev, cond]);
      addLog(`Adquiriu condição: ${cond}`, 'info');
    }
  };

  const removeCondition = (idx: number) => {
    setCharConditions(prev => prev.filter((_, i) => i !== idx));
  };

  const handleRest = (type: 'short' | 'long') => {
    if (type === 'short') {
      const recovered = Math.floor(char.maxNen * 0.5);
      const newNen = Math.min(char.maxNen, char.currentNen + recovered);
      updateChar('currentNen', newNen);
      addLog(`Descanso Curto: Recuperou ${newNen - char.currentNen} Nen.`, 'heal');
    } else {
      updateChar('currentNen', char.maxNen);
      updateChar('currentHp', char.maxHp);
      addLog(`Descanso Longo: HP e Nen totalmente restaurados.`, 'heal');
    }
  };

  // Image Upload Handling
  const triggerUpload = (target: UploadTarget) => {
    setUploadTarget(target);
    fileInputRef.current?.click();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && uploadTarget) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
           const result = reader.result;
           
           if (uploadTarget.type === 'charAvatar') {
               updateChar('avatarUrl', result);
           } else if (uploadTarget.type === 'summonAvatar') {
               setNewSummon(prev => ({ ...prev, avatarUrl: result }));
           } else if (uploadTarget.type === 'skillImage') {
               setNewSkill(prev => ({ ...prev, imageUrl: result }));
           }
           addLog("Imagem atualizada com sucesso.", 'info');
        }
        setUploadTarget(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      };
      reader.readAsDataURL(file);
    }
  };

  // Helper to determine item icon
  const getItemIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('poção') || lower.includes('potion') || lower.includes('elixir')) return FlaskConical;
    if (lower.includes('espada') || lower.includes('sword') || lower.includes('adaga') || lower.includes('faca') || lower.includes('arco') || lower.includes('arma')) return Sword;
    if (lower.includes('chave') || lower.includes('key')) return Ghost;
    if (lower.includes('livro') || lower.includes('book') || lower.includes('pergaminho')) return ScrollText;
    return Box;
  };

  // Render Skill List Helper
  const renderSkillList = (category: SkillCategory) => {
      const filteredSkills = char.skills.filter(s => s.category === category);
      
      return (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
             {filteredSkills.length === 0 && (
                 <div className="text-center py-10 opacity-50 font-serif italic">Nenhuma habilidade nesta categoria.</div>
             )}
             {filteredSkills.map((skill) => (
               <div key={skill.id} onClick={() => handleSkillClick(skill)} className={`relative bg-[#1c1c21]/80 rounded-xl border border-white/5 hover:border-white/30 transition-all group overflow-hidden cursor-pointer shadow-lg card-clip flex hover:bg-white/5`}>
                  {skill.imageUrl && (
                      <div className="w-24 md:w-32 bg-cover bg-center shrink-0 border-r border-white/10 relative" style={{backgroundImage: `url(${skill.imageUrl})`}}>
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
                      </div>
                  )}
                  <div className="p-5 flex-1 relative">
                    <div className="flex justify-between items-start relative z-10">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-xl font-title text-gray-100 group-hover:text-theme transition-colors">{skill.name}</h3>
                                <span className={`text-[9px] px-2 py-0.5 rounded border uppercase font-bold tracking-wider opacity-70`}>{skill.type}</span>
                            </div>
                            <p className="text-gray-400 text-sm font-serif leading-relaxed opacity-90">{skill.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                        {isEditing ? <button onClick={(e) => removeSkill(e, skill.id, {type: 'character'})} className="text-gray-600 hover:text-red-500 p-2"><Trash2 size={18}/></button> : (!skill.type.includes('Passive') && <div className="ml-4 p-2.5 bg-white/5 hover-bg-theme text-gray-400 group-hover:text-black rounded-full transition-all shadow-md"><Zap size={18} className="fill-current" /></div>)}
                        </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-white/5 flex gap-5 text-xs font-mono text-gray-500">
                        {skill.cost && <span className="flex items-center gap-1.5 font-bold" style={{color: themeColor}}><Droplet size={14}/> {skill.cost} AP</span>}
                        {skill.damageDice && <span className="flex items-center gap-1.5 text-red-400 font-bold"><Dice5 size={14}/> {skill.damageDice}</span>}
                    </div>
                  </div>
                  {isEditing && <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"><span className="text-white font-bold text-sm uppercase tracking-widest flex items-center gap-2"><Edit3 size={16} /> Editar</span></div>}
               </div>
             ))}
             {isEditing && (
               <button onClick={() => openAddSkillModal({type: 'character', defaultCategory: category})} className="w-full py-6 border-2 border-dashed border-gray-700/50 rounded-xl text-gray-500 hover:border-white hover:text-white hover:bg-white/5 transition-all flex items-center justify-center gap-3 font-bold uppercase tracking-wider text-sm group">
                 <div className="p-2 rounded-full bg-gray-800 group-hover:bg-white group-hover:text-black transition-colors"><Plus size={20} /></div> Adicionar Nova Habilidade
               </button>
             )}
          </div>
      );
  };

  return (
    <div 
      className="min-h-screen bg-[#050506] text-gray-200 font-body pb-24 overflow-x-hidden selection:text-black relative transition-colors duration-1000"
      style={{ 
        '--theme-color': themeColor,
        '::selection': { backgroundColor: themeColor }
      } as React.CSSProperties}
    >
      <style>{`
        ::selection {
          background-color: var(--theme-color);
          color: black;
        }
        .text-theme { color: var(--theme-color); }
        .bg-theme { background-color: var(--theme-color); }
        .border-theme { border-color: var(--theme-color); }
        .shadow-theme { box-shadow: 0 0 20px var(--theme-color); }
        .hover-text-theme:hover { color: var(--theme-color); }
        .hover-border-theme:hover { border-color: var(--theme-color); }
        .hover-bg-theme:hover { background-color: var(--theme-color); }
        
        .card-clip {
            clip-path: polygon(0 0, 100% 0, 100% 85%, 90% 100%, 0 100%);
        }
        .avatar-frame {
            clip-path: polygon(10% 0, 100% 0, 100% 90%, 90% 100%, 0 100%, 0 10%);
        }
      `}</style>

      {/* === BACKGROUND LAYERS === */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Base Dark */}
        <div className="absolute inset-0 bg-[#050506]"></div>
        
        {/* Cyber Grid Overlay */}
        <div className="absolute inset-0 bg-grid opacity-10"></div>
        
        {/* Moving Fog/Aura Effect - Dynamic Color */}
        <div 
            className="absolute -inset-[50%] opacity-20 animate-smoke mix-blend-screen transition-colors duration-1000"
            style={{ 
                background: `radial-gradient(circle at center, ${themeColor}, transparent 60%)`,
                filter: 'blur(80px)'
            }}
        ></div>
        
        {/* Secondary Pulsing Gradient */}
        <div 
          className="absolute bottom-[-20%] right-[-10%] w-[80vw] h-[80vw] rounded-full animate-pulse-slow opacity-10 transition-colors duration-1000"
          style={{ background: `radial-gradient(circle, ${themeColor}, transparent 70%)` }}
        ></div>

        {/* Noise Texture */}
        <div className="absolute inset-0 bg-noise opacity-30 mix-blend-overlay"></div>
        
        {/* Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#000000_120%)]"></div>
      </div>

      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />

      {/* Navbar */}
      <div className="sticky top-0 z-50 bg-[#050506]/80 backdrop-blur-xl border-b border-white/5 px-4 md:px-8 py-4 flex justify-between items-center shadow-lg">
        <div className="font-title text-xl md:text-2xl text-white tracking-widest flex items-center gap-2 drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white" style={{ backgroundImage: `linear-gradient(to right, ${themeColor}, #fff)` }}>HUNTER</span> 
          <span className="text-gray-500 font-sans text-lg font-light">×</span> 
          <span className="text-transparent bg-clip-text" style={{ backgroundImage: `linear-gradient(to left, ${themeColor}, #fff)` }}>HUNTER</span>
        </div>
        
        <div className="flex gap-3">
          {/* Character Manager Button */}
          <button 
             onClick={() => setIsCharModalOpen(true)}
             className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 hover:border-white/30 transition-all font-header text-sm tracking-wide mr-2"
          >
             <Users size={16} /> <span className="hidden md:inline">DATABASE</span>
          </button>

          {!isEditing && (
             <div className="flex items-center gap-2 mr-4 border-r border-white/10 pr-4">
               <button onClick={() => handleRest('short')} className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"><Moon size={18} /></button>
               <button onClick={() => handleRest('long')} className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-yellow-300 transition-all"><Sun size={18} /></button>
             </div>
          )}
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className={`flex items-center gap-2 px-5 py-2 rounded-full font-bold text-sm transition-all duration-300 border backdrop-blur-md ${
              isEditing ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.5)]' : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:text-white hover:border-white/30'
            }`}
          >
            {isEditing ? <><Save size={16} /> SALVAR</> : <><Edit3 size={16} /> EDITAR</>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
        
        {/* Profile Column (Left) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Avatar Card */}
          <div className="group relative">
             <div className="absolute -inset-0.5 bg-gradient-to-b from-white/20 to-transparent avatar-frame opacity-50"></div>
             
             <div className="relative bg-[#0a0a0c] avatar-frame overflow-hidden shadow-2xl">
                <div className="h-96 w-full relative bg-gray-900 overflow-hidden">
                   <img src={char.avatarUrl} alt="Avatar" className="w-full h-full object-cover transition-transform duration-[3s] group-hover:scale-110 opacity-90"/>
                   <div className="absolute inset-0 bg-gradient-to-t from-[#050506] via-transparent to-transparent opacity-90"></div>
                   
                   <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
                   <div className="absolute bottom-0 right-0 w-10 h-10 border-b-2 border-r-2 border-white/30 rounded-br-xl"></div>

                   {isEditing && (
                     <button onClick={() => triggerUpload({type: 'charAvatar'})} className="absolute top-4 right-4 z-30 p-3 bg-black/60 rounded-full hover:bg-white text-white hover:text-black transition-colors backdrop-blur-md border border-white/20 shadow-lg">
                        <Upload size={20} />
                     </button>
                   )}
                   
                   <div className="absolute bottom-0 left-0 right-0 p-8 z-20 flex flex-col gap-1">
                     {isEditing ? (
                       <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                         <input className="w-full bg-transparent border-b text-4xl font-title text-white outline-none placeholder-white/30" style={{ borderColor: themeColor }} value={char.nickname} onChange={(e) => updateChar('nickname', e.target.value)} placeholder="Apelido" />
                         <div className="grid grid-cols-2 gap-4">
                            <input className="w-full bg-transparent border-b border-gray-700 text-sm font-header text-gray-300 outline-none focus:border-white/50" value={char.name} onChange={(e) => updateChar('name', e.target.value)} placeholder="Nome Real" />
                            <input className="w-full bg-transparent border-b border-gray-700 text-sm font-header text-gray-300 outline-none focus:border-white/50" value={char.alignment} onChange={(e) => updateChar('alignment', e.target.value)} placeholder="Alinhamento" />
                         </div>
                       </div>
                     ) : (
                       <>
                        <h1 className="text-5xl font-title text-white drop-shadow-[0_4px_4px_rgba(0,0,0,1)] neon-text tracking-wide mb-1 leading-none transition-colors duration-500 group-hover:text-theme">{char.nickname}</h1>
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-header text-gray-300 tracking-[0.2em] uppercase opacity-90 border-r border-gray-600 pr-3">{char.name}</span>
                            <span className="text-xs font-mono text-gray-500 uppercase tracking-widest">{char.alignment}</span>
                        </div>
                       </>
                     )}
                   </div>
                </div>
                
                {/* XP Bar */}
                <div className="bg-[#1a1a1d] px-6 pb-2 border-x border-white/5 relative">
                   <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-widest text-gray-500 mb-1">
                      <span>Nível {char.hunterLevel}</span>
                      <span>{char.xp} / {char.maxXp} XP</span>
                   </div>
                   <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                       <div 
                         className="h-full bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)] transition-all duration-1000"
                         style={{ width: `${Math.min(100, (char.xp / char.maxXp) * 100)}%` }}
                       ></div>
                   </div>
                </div>

                {/* Stats Grid */}
                <div className="p-6 grid grid-cols-2 gap-y-6 gap-x-4 text-sm bg-white/5 border-t border-white/5 relative backdrop-blur-md rounded-b-lg">
                  {[ { label: 'Idade', key: 'age', unit: 'anos' }, { label: 'Hunter Lvl', key: 'hunterLevel', color: 'text-theme' }, { label: 'Altura', key: 'height', unit: '' }, { label: 'Peso', key: 'weight', unit: '' }, { label: 'Nacionalidade', key: 'nationality', unit: '', full: true } ].map((stat) => (
                    <div key={stat.key} className={stat.full ? 'col-span-2' : ''}>
                      <span className="text-gray-500 block text-[10px] uppercase font-bold tracking-[0.15em] mb-1.5">{stat.label}</span>
                      {isEditing ? (
                        <input type={typeof char[stat.key as keyof Character] === 'number' ? 'number' : 'text'} value={char[stat.key as keyof Character] as string | number} onChange={(e) => updateChar(stat.key as keyof Character, e.target.value)} className="w-full bg-white/5 rounded-md px-3 py-1.5 text-white border border-white/10 outline-none focus:border-white/30 transition-all" />
                      ) : (
                        <span className={`font-header font-bold text-lg ${stat.color || 'text-gray-200'}`}>{char[stat.key as keyof Character] as string | number} {stat.unit}</span>
                      )}
                    </div>
                  ))}
                  {isEditing && (
                       <div className="col-span-2 mt-2 pt-4 border-t border-white/10">
                          <span className="text-gray-500 block text-[10px] uppercase font-bold tracking-[0.15em] mb-1.5">Experiência (XP)</span>
                          <div className="flex gap-2">
                             <input type="number" value={char.xp} onChange={(e) => updateChar('xp', parseInt(e.target.value))} className="w-full bg-white/5 rounded px-3 py-1.5 text-white border border-white/10 outline-none" placeholder="Atual"/>
                             <input type="number" value={char.maxXp} onChange={(e) => updateChar('maxXp', parseInt(e.target.value))} className="w-full bg-white/5 rounded px-3 py-1.5 text-white border border-white/10 outline-none" placeholder="Max"/>
                          </div>
                       </div>
                  )}
                </div>

                {/* Conditions */}
                <div className="bg-black/40 border-t border-white/5 p-4 relative min-h-[80px]">
                   <div className="flex justify-between items-center mb-2">
                     <span className="text-[10px] uppercase font-bold text-gray-500 tracking-widest flex items-center gap-2"><Flame size={12} className="text-orange-500"/> Condições</span>
                     {isEditing && <button onClick={addCondition} className="text-[10px] bg-white/10 hover:bg-white/20 text-gray-300 px-2 py-0.5 rounded uppercase">Add</button>}
                   </div>
                   <div className="flex flex-wrap gap-2">
                     {char.conditions.length === 0 && <span className="text-[10px] text-gray-600 italic">Status Normal</span>}
                     {char.conditions.map((cond, idx) => (
                       <span key={idx} className="bg-red-500/10 border border-red-500/30 text-red-300 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-[0_0_10px_rgba(239,68,68,0.1)]">{cond}{isEditing && <button onClick={() => removeCondition(idx)}><X size={10} /></button>}</span>
                     ))}
                   </div>
                </div>
             </div>
          </div>

          <div className="glass-panel rounded-2xl p-6 relative shadow-lg overflow-hidden flex flex-col items-center group transition-colors hover:border-theme/50">
             <div className="w-full flex justify-between items-center mb-2 z-10">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2"><Activity size={12} /> Afinidade</span>
                {isEditing ? (
                  <select value={char.nenType} onChange={(e) => updateChar('nenType', e.target.value as NenType)} className="bg-black text-theme border border-white/20 rounded-md text-xs px-2 py-1 outline-none uppercase font-bold" style={{ color: themeColor, borderColor: themeColor }}>
                    {Object.values(NenType).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                ) : (
                  <span className="font-title text-sm drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]" style={{ color: themeColor }}>{char.nenType}</span>
                )}
             </div>
             <div className="relative z-10 w-full flex justify-center py-4 transform group-hover:scale-105 transition-transform duration-500">
                <NenHexagon activeType={char.nenType} />
             </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-6">
            <div className="glass-panel p-6 rounded-2xl shadow-lg flex flex-col justify-center gap-4 relative overflow-hidden">
               {/* Background shine */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-3xl pointer-events-none"></div>
              <StatBar label="Pontos de Vida (HP)" current={char.currentHp} max={char.maxHp} color="#ef4444" icon={<Heart className="fill-current text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]" size={18} />} isEditing={isEditing} onChange={(v) => updateChar('currentHp', v)} onMaxChange={(v) => updateChar('maxHp', v)} />
              <StatBar label="Pontos de Aura (Nen)" current={char.currentNen} max={char.maxNen} color={themeColor} icon={<Zap className="fill-current drop-shadow-[0_0_10px_currentColor]" style={{ color: themeColor }} size={18} />} isEditing={isEditing} onChange={(v) => updateChar('currentNen', v)} onMaxChange={(v) => updateChar('maxNen', v)} />
            </div>
            
            <div className="glass-panel rounded-2xl shadow-lg relative flex flex-col items-center justify-center p-4 overflow-hidden group">
               <Shield size={160} className="text-white/5 absolute stroke-[0.5] group-hover:scale-105 transition-transform duration-700" />
               <div className="relative z-10 flex flex-col items-center">
                 {isEditing ? (
                   <input type="number" value={char.ca} onChange={(e) => updateChar('ca', parseInt(e.target.value))} className="text-6xl font-black font-title text-white bg-transparent w-32 text-center outline-none border-b-2 border-white/10 focus:border-white transition-colors" />
                 ) : (
                    <span className="text-7xl font-black font-title text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">{char.ca}</span>
                 )}
                 <span className="text-sm font-header text-gray-400 font-bold tracking-[0.4em] uppercase mt-2">Defesa</span>
               </div>
            </div>
          </div>

          {/* Main Character Attributes */}
          <div className="glass-panel rounded-2xl shadow-xl overflow-hidden">
             <div className="p-4 border-b border-white/5 bg-black/20 flex justify-between items-center">
                 <span className="text-sm font-bold uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2"><Dna size={16} className="text-hxh-blue"/> Atributos Principais</span>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2">
                <div className="p-6 flex items-center justify-center border-b md:border-b-0 md:border-r border-white/5 bg-gradient-to-br from-white/5 to-transparent">
                  <div className="relative w-full max-w-[280px] aspect-square">
                     <AttributesRadar attributes={char.attributes} />
                     <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                       <div className="w-full h-full border rounded-full border-white/10 animate-pulse"></div>
                     </div>
                  </div>
                </div>
                <div className="p-6 grid grid-cols-2 sm:grid-cols-2 gap-4 content-center">
                    <AttributeDisplay label="Força" value={char.attributes.strength} icon={Sword} color="#c0392b" isEditing={isEditing} onRoll={() => handleAttributeRoll('Força', char.attributes.strength)} onChange={(v) => updateAttribute('strength', v)} />
                    <AttributeDisplay label="Destreza" value={char.attributes.prestidigitation} icon={Ghost} color="#e67e22" isEditing={isEditing} onRoll={() => handleAttributeRoll('Prestidigitação', char.attributes.prestidigitation)} onChange={(v) => updateAttribute('prestidigitation', v)} />
                    <AttributeDisplay label="Constituição" value={char.attributes.constitution} icon={Activity} color="#2980b9" isEditing={isEditing} onRoll={() => handleAttributeRoll('Constituição', char.attributes.constitution)} onChange={(v) => updateAttribute('constitution', v)} />
                    <AttributeDisplay label="Inteligência" value={char.attributes.intelligence} icon={Brain} color="#8e44ad" isEditing={isEditing} onRoll={() => handleAttributeRoll('Inteligência', char.attributes.intelligence)} onChange={(v) => updateAttribute('intelligence', v)} />
                    <AttributeDisplay label="Determinação" value={char.attributes.determination} icon={Dna} color="#f1c40f" isEditing={isEditing} onRoll={() => handleAttributeRoll('Determinação', char.attributes.determination)} onChange={(v) => updateAttribute('determination', v)} />
                    <AttributeDisplay label="Carisma" value={char.attributes.charisma} icon={Feather} color="#27ae60" isEditing={isEditing} onRoll={() => handleAttributeRoll('Carisma', char.attributes.charisma)} onChange={(v) => updateAttribute('charisma', v)} />
                </div>
             </div>
          </div>

          {/* TABS CONTAINER */}
          <div className="glass-panel rounded-2xl flex flex-col shadow-2xl overflow-hidden min-h-[450px]">
             <div className="flex bg-black/40 border-b border-white/5 overflow-x-auto scrollbar-none">
                {[ 
                    { id: 'hatsus', label: 'Hatsus', icon: Zap }, 
                    { id: 'combat', label: 'Téc. Combate', icon: Target }, 
                    { id: 'weapon', label: 'Hab. Armas', icon: Sword },
                    { id: 'summons', label: 'Invocações', icon: PawPrint }, 
                    { id: 'inventory', label: 'Inventário', icon: BookOpen }, 
                    { id: 'bio', label: 'Biografia', icon: ScrollText } 
                ].map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex-1 py-5 px-4 min-w-[140px] font-header font-bold text-xs md:text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === tab.id ? 'text-white bg-white/5 border-b-2 border-theme shadow-[inset_0_-10px_20px_rgba(255,255,255,0.05)]' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`} style={{ borderColor: activeTab === tab.id ? themeColor : 'transparent' }}>
                    <tab.icon size={16} style={{ color: activeTab === tab.id ? themeColor : undefined }} className={activeTab === tab.id ? '' : 'opacity-50'} /> {tab.label}
                  </button>
                ))}
             </div>

             <div className="p-6 md:p-8 flex-1 bg-gradient-to-b from-white/5 to-transparent relative">
                
                {activeTab === 'hatsus' && renderSkillList('Hatsu')}
                {activeTab === 'combat' && renderSkillList('Combat')}
                {activeTab === 'weapon' && renderSkillList('Weapon')}

                {activeTab === 'summons' && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                     {char.summons?.map((summon) => (
                       <div key={summon.id} className="glass-panel bg-[#1c1c21]/90 rounded-2xl overflow-hidden shadow-2xl relative group border border-white/10 hover:border-white/20 transition-all">
                          {/* Summon Banner / Avatar */}
                          <div className="h-32 bg-gradient-to-r from-black via-[#0d0d10] to-transparent relative">
                              {summon.avatarUrl && (
                                  <div className="absolute top-0 right-0 w-1/2 h-full opacity-50 mask-image-linear-gradient-to-l">
                                      <img src={summon.avatarUrl} alt={summon.name} className="w-full h-full object-cover object-top mask-linear" style={{maskImage: 'linear-gradient(to right, transparent, black)'}} />
                                  </div>
                              )}
                              <div className="absolute inset-0 p-6 flex flex-col justify-center z-10">
                                  <div className="flex justify-between items-start">
                                      <div>
                                        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest border border-white/10 px-1.5 rounded mb-2 inline-block bg-black/50 backdrop-blur">{summon.type}</span>
                                        <h3 className="font-title text-2xl text-white tracking-wide drop-shadow-lg">{summon.name}</h3>
                                      </div>
                                      {isEditing && (
                                        <div className="flex gap-2">
                                            <button onClick={() => handleEditSummon(summon)} className="p-2 bg-black/50 hover:bg-white hover:text-black rounded text-gray-300 transition-colors"><Edit3 size={16}/></button>
                                            <button onClick={() => removeSummon(summon.id)} className="p-2 bg-black/50 hover:bg-red-500 hover:text-white rounded text-gray-300 transition-colors"><Trash2 size={16}/></button>
                                        </div>
                                      )}
                                  </div>
                              </div>
                          </div>

                          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                              {/* Summon Stats */}
                              <div className="md:col-span-1 space-y-4 border-r border-white/5 pr-6">
                                  <p className="text-sm text-gray-400 font-serif italic mb-4">"{summon.description || "Sem descrição."}"</p>
                                  <StatBar label="HP" current={summon.currentHp} max={summon.maxHp} color="#ef4444" icon={<Heart size={14} className="text-red-500 fill-current"/>} onChange={(v) => updateSummonStat(summon.id, 'currentHp', v)} />
                                  <StatBar label="Nen" current={summon.currentNen} max={summon.maxNen} color={themeColor} icon={<Zap size={14} className="fill-current" style={{color: themeColor}}/>} onChange={(v) => updateSummonStat(summon.id, 'currentNen', v)} />
                                  
                                  {/* Mini Attributes Radar */}
                                  <div className="mt-6 pt-4 border-t border-white/5 flex flex-col items-center">
                                      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Atributos</span>
                                      <div className="w-40 h-40">
                                          <AttributesRadar attributes={summon.attributes} size={160} />
                                      </div>
                                  </div>
                              </div>

                              {/* Summon Skills */}
                              <div className="md:col-span-2 flex flex-col gap-3">
                                  <div className="flex justify-between items-center mb-2">
                                      <span className="text-xs font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2"><Zap size={12}/> Habilidades da Invocação</span>
                                      {isEditing && <button onClick={() => openAddSkillModal({type: 'summon', summonId: summon.id})} className="text-[10px] uppercase font-bold text-theme hover:text-white transition-colors">+ Add Skill</button>}
                                  </div>
                                  
                                  {summon.skills.length === 0 && <span className="text-gray-700 text-sm italic">Nenhuma habilidade registrada.</span>}
                                  
                                  {summon.skills.map(skill => (
                                      <div key={skill.id} onClick={() => handleSkillClick(skill, summon.name, {current: summon.currentNen, set: (v) => updateSummonStat(summon.id, 'currentNen', v)})} className="bg-black/20 hover:bg-white/5 border border-white/5 rounded-lg p-3 flex gap-3 cursor-pointer group/skill transition-all hover:border-theme/30 hover:shadow-lg">
                                          {skill.imageUrl && <img src={skill.imageUrl} className="w-12 h-12 object-cover rounded bg-black/50 border border-white/10" />}
                                          <div className="flex-1">
                                              <div className="flex justify-between">
                                                  <span className="font-bold text-gray-200 group-hover/skill:text-theme transition-colors text-sm">{skill.name}</span>
                                                  <div className="flex items-center gap-2">
                                                    {skill.cost && <span className="text-[10px] font-mono text-gray-500 bg-black/30 px-1.5 py-0.5 rounded">{skill.cost} AP</span>}
                                                    {isEditing && <button onClick={(e) => removeSkill(e, skill.id, {type: 'summon', summonId: summon.id})} className="text-gray-600 hover:text-red-500"><Trash2 size={12}/></button>}
                                                  </div>
                                              </div>
                                              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{skill.description}</p>
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          </div>
                       </div>
                     ))}
                     {isEditing && (
                       <button onClick={openAddSummonModal} className="w-full py-6 border-2 border-dashed border-gray-700/50 rounded-xl text-gray-500 hover:border-white hover:text-white hover:bg-white/5 transition-all flex items-center justify-center gap-3 font-bold uppercase tracking-wider text-sm group">
                         <div className="p-2 rounded-full bg-gray-800 group-hover:bg-white group-hover:text-black transition-colors"><Plus size={20} /></div> Nova Invocação
                       </button>
                     )}
                  </div>
                )}
                
                {activeTab === 'inventory' && (
                   <div className="grid grid-cols-1 gap-3 animate-in fade-in slide-in-from-right-4 duration-300">
                     {char.inventory.length === 0 && <div className="text-center py-10 opacity-50 italic">Inventário vazio.</div>}
                     {char.inventory.map((item, idx) => {
                       const Icon = getItemIcon(item.name);
                       return (
                        <div key={item.id} className="glass-panel p-4 rounded-xl flex justify-between items-center group transition-all hover:border-white/30 hover:bg-white/5">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-theme group-hover:bg-theme group-hover:text-black transition-colors">
                                    <Icon size={20} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-header font-bold text-gray-200 text-sm tracking-wide">{item.name}</span>
                                    <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Quantidade: {item.quantity}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1 bg-black/40 rounded-full p-1 border border-white/5">
                                    <button onClick={() => updateInventoryQty(item.id, -1)} className="p-1.5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"><Minus size={12}/></button>
                                    <span className="w-6 text-center font-mono text-xs">{item.quantity}</span>
                                    <button onClick={() => updateInventoryQty(item.id, 1)} className="p-1.5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"><Plus size={12}/></button>
                                </div>
                                {isEditing && <button onClick={() => removeInventoryItem(item.id)} className="text-gray-600 hover:text-red-500 hover:bg-red-900/20 p-2 rounded-full transition-colors"><Trash2 size={16} /></button>}
                            </div>
                        </div>
                       );
                     })}
                     {isEditing && <button onClick={addInventoryItem} className="mt-4 px-4 py-4 bg-white/5 hover:bg-white/10 border-2 border-dashed border-gray-700/50 hover:border-white rounded-xl text-sm text-gray-400 hover:text-white w-full uppercase tracking-wider font-bold transition-all flex items-center justify-center gap-2"><Plus size={18} /> Adicionar Item</button>}
                   </div>
                )}
                
                {activeTab === 'bio' && (
                  <div className="h-full animate-in fade-in slide-in-from-right-4 duration-300">
                    {isEditing ? (
                      <textarea value={char.bio} onChange={(e) => updateChar('bio', e.target.value)} className="w-full h-96 bg-[#1c1c21]/80 rounded-xl border border-white/10 p-6 text-gray-300 font-serif leading-loose outline-none focus:border-white/50 focus:ring-1 focus:ring-white/20 resize-none shadow-inner" placeholder="Escreva a história do seu personagem aqui..." />
                    ) : (
                      <div className="prose prose-invert max-w-none">
                         <div className="p-6 bg-[#1c1c21]/30 rounded-xl border border-white/5 min-h-[300px]">
                           <p className="font-serif text-gray-300 leading-8 whitespace-pre-wrap text-lg">{char.bio || "Nenhuma biografia disponível."}</p>
                         </div>
                      </div>
                    )}
                  </div>
                )}
             </div>
          </div>
        </div>
      </div>

      {/* Global Dice Roller FAB */}
      <div className="fixed bottom-6 right-80 z-50 flex flex-col items-end pointer-events-none md:pointer-events-auto">
         <div className={`transition-all duration-300 transform origin-bottom-right mb-4 flex flex-col gap-2 ${showDiceMenu ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}>
            {[4, 6, 8, 10, 12, 20, 100].map(die => (
                <button 
                  key={die} 
                  onClick={() => handleGlobalRoll(die)}
                  className="bg-black/80 backdrop-blur-md border border-white/20 text-white font-bold py-2 px-4 rounded-full shadow-lg hover:bg-theme hover:text-black hover:border-theme transition-all flex items-center justify-center gap-2 pointer-events-auto"
                >
                   <Dice5 size={16} /> d{die}
                </button>
            ))}
         </div>
         <button 
            onClick={() => setShowDiceMenu(!showDiceMenu)}
            className="w-14 h-14 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(0,0,0,0.5)] hover:bg-white/20 hover:scale-110 transition-all group pointer-events-auto"
         >
            <Dice5 size={28} className={`text-white transition-transform duration-500 ${showDiceMenu ? 'rotate-180' : ''}`} />
         </button>
      </div>

      {/* Logs */}
      <div className="fixed bottom-6 right-6 w-72 max-h-72 flex flex-col z-50 pointer-events-none">
        <div className="pointer-events-auto glass-panel bg-[#0a0a0c]/90 rounded-xl shadow-2xl overflow-hidden flex flex-col transition-all hover:scale-[1.02]">
            <div className="bg-gradient-to-r from-white/5 to-transparent px-4 py-3 flex justify-between items-center border-b border-white/10">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2"><Activity size={12} className="text-hxh-green" /> Log de Sistema</span>
              <button onClick={() => setLogs([])} className="text-gray-500 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs font-mono max-h-56 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
              {logs.map((log) => (
                <div key={log.id} className={`relative pl-3 py-1 animate-slide-in flex flex-col border-l-2 ${log.type === 'damage' ? 'border-red-500 text-red-200 bg-red-900/10' : log.type === 'heal' ? 'border-green-500 text-green-200 bg-green-900/10' : log.type === 'cost' ? 'border-purple-500 text-purple-200 bg-purple-900/10' : 'border-gray-600 text-gray-400'} rounded-r-md px-2`}>
                  <span className="text-[9px] opacity-40 mb-0.5 font-bold uppercase">{log.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}</span>
                  <span>{log.text}</span>
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
        </div>
      </div>

      {/* CHARACTER SELECTION MODAL (NEW) */}
      {isCharModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
              <div className="w-full max-w-5xl h-[80vh] flex flex-col">
                  <div className="flex justify-between items-center mb-6">
                      <h2 className="text-3xl font-title text-white tracking-widest flex items-center gap-3"><Users size={32}/> HUNTER DATABASE</h2>
                      <button onClick={() => setIsCharModalOpen(false)} className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"><X size={24}/></button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-2">
                      {/* Create New Card */}
                      <button onClick={handleCreateChar} className="border-2 border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center gap-4 hover:border-white/50 hover:bg-white/5 transition-all group min-h-[300px]">
                          <div className="p-4 rounded-full bg-white/5 group-hover:bg-white/20 transition-colors">
                              <UserPlus size={40} className="text-gray-400 group-hover:text-white"/>
                          </div>
                          <span className="font-header font-bold text-lg text-gray-400 group-hover:text-white uppercase tracking-widest">Nova Ficha</span>
                      </button>

                      {/* Character Cards */}
                      {characters.map(c => (
                          <div key={c.id} className={`relative bg-[#1c1c21] rounded-xl overflow-hidden border transition-all duration-300 group flex flex-col ${c.id === activeCharId ? 'border-theme shadow-[0_0_20px_rgba(255,255,255,0.1)] ring-1 ring-white/20' : 'border-white/10 hover:border-white/30'}`}>
                              <div className="h-40 relative bg-gray-900">
                                  <img src={c.avatarUrl} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-500" />
                                  <div className="absolute inset-0 bg-gradient-to-t from-[#1c1c21] to-transparent"></div>
                                  <div className="absolute top-3 right-3 flex gap-2">
                                      {c.id === activeCharId && <span className="bg-green-500 text-black text-[10px] font-bold px-2 py-1 rounded uppercase flex items-center gap-1"><Check size={10}/> Ativo</span>}
                                  </div>
                              </div>
                              <div className="p-5 flex flex-col flex-1">
                                  <h3 className="text-2xl font-title text-white mb-1 group-hover:text-theme transition-colors">{c.nickname}</h3>
                                  <p className="text-xs text-gray-500 font-header uppercase tracking-widest mb-4">{c.name} • Lvl {c.hunterLevel}</p>
                                  
                                  <div className="grid grid-cols-2 gap-2 mb-4 text-xs font-mono text-gray-400">
                                      <div className="bg-black/30 rounded px-2 py-1 border border-white/5 flex justify-between">
                                          <span>HP</span> <span className="text-red-400 font-bold">{c.maxHp}</span>
                                      </div>
                                      <div className="bg-black/30 rounded px-2 py-1 border border-white/5 flex justify-between">
                                          <span>NEN</span> <span style={{color: NEN_COLORS[c.nenType]}} className="font-bold">{c.maxNen}</span>
                                      </div>
                                      <div className="bg-black/30 rounded px-2 py-1 border border-white/5 col-span-2 text-center uppercase font-bold text-[10px] tracking-widest">
                                          {c.nenType}
                                      </div>
                                  </div>

                                  <div className="mt-auto flex gap-3 pt-4 border-t border-white/5">
                                      <button onClick={() => handleSwitchChar(c.id)} className="flex-1 bg-white/5 hover:bg-white text-white hover:text-black py-2 rounded text-xs font-bold uppercase tracking-widest transition-all">
                                          {c.id === activeCharId ? 'Jogar' : 'Selecionar'}
                                      </button>
                                      <button onClick={() => handleDeleteChar(c.id)} className="p-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded transition-colors" title="Excluir">
                                          <Trash2 size={16}/>
                                      </button>
                                  </div>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      )}

      {/* Skill Modal (Unified) */}
      {isSkillModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="glass-panel bg-[#131316] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden scale-100 animate-in zoom-in-95 duration-200">
              <div className="bg-gradient-to-r from-white/10 to-transparent p-6 border-b border-white/10 flex justify-between items-center">
                 <h3 className="font-header font-bold text-xl text-white uppercase tracking-wider flex items-center gap-2">
                   {editingSkillId ? <Edit3 size={20} /> : <Plus size={20} />} 
                   {editingSkillId ? 'Editar Habilidade' : 'Nova Habilidade'}
                 </h3>
                 <button onClick={() => setSkillModalOpen(false)} className="text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full transition-colors"><X size={20}/></button>
              </div>
              <div className="p-6 space-y-5">
                 {/* Image Upload for Skill */}
                 <div className="w-full h-32 bg-black/30 rounded-lg border border-white/10 flex items-center justify-center relative group overflow-hidden cursor-pointer" onClick={() => triggerUpload({type: 'skillImage'})}>
                     {newSkill.imageUrl ? (
                        <img src={newSkill.imageUrl} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                     ) : (
                        <div className="flex flex-col items-center text-gray-500 group-hover:text-white transition-colors">
                            <ImageIcon size={24} />
                            <span className="text-[10px] uppercase font-bold mt-2">Adicionar Imagem</span>
                        </div>
                     )}
                     <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                         <Camera size={24} className="text-white"/>
                     </div>
                 </div>

                 <div>
                    <label className="block text-[10px] uppercase text-gray-500 font-bold tracking-widest mb-2">Nome</label>
                    <input className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-white/50 focus:bg-white/5 transition-all text-lg font-title" value={newSkill.name} onChange={(e) => setNewSkill({...newSkill, name: e.target.value})} placeholder="Ex: Jajanken" autoFocus />
                 </div>
                 <div className="grid grid-cols-2 gap-5">
                    <div>
                        <label className="block text-[10px] uppercase text-gray-500 font-bold tracking-widest mb-2">Categoria</label>
                        <select className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-white/50" value={newSkill.category} onChange={(e) => setNewSkill({...newSkill, category: e.target.value as any})}>
                          <option value="Hatsu">Hatsu</option>
                          <option value="Combat">Téc. Combate</option>
                          <option value="Weapon">Hab. Arma</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] uppercase text-gray-500 font-bold tracking-widest mb-2">Tipo</label>
                        <select className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-white/50" value={newSkill.type} onChange={(e) => setNewSkill({...newSkill, type: e.target.value as any})}>
                          <option value="Active">Ativa</option><option value="Passive">Passiva</option><option value="Bonus">Bônus</option><option value="Reaction">Reação</option>
                        </select>
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-5">
                    <div>
                        <label className="block text-[10px] uppercase text-gray-500 font-bold tracking-widest mb-2">Custo (Nen)</label>
                        <input type="number" className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-white/50" value={newSkill.cost || ''} onChange={(e) => setNewSkill({...newSkill, cost: parseInt(e.target.value)})} placeholder="0" />
                    </div>
                    <div>
                        <label className="block text-[10px] uppercase text-gray-500 font-bold tracking-widest mb-2">Dano</label>
                        <input className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-white/50" value={newSkill.damageDice || ''} onChange={(e) => setNewSkill({...newSkill, damageDice: e.target.value})} placeholder="Ex: 1d8" />
                    </div>
                 </div>
                 <div>
                    <label className="block text-[10px] uppercase text-gray-500 font-bold tracking-widest mb-2">Atributo</label>
                    <select className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-white/50" value={newSkill.attributeScaling || ''} onChange={(e) => setNewSkill({...newSkill, attributeScaling: e.target.value as any})}>
                        <option value="">Nenhum</option>{Object.keys(char.attributes).map(k => <option key={k} value={k}>{k.charAt(0).toUpperCase() + k.slice(1)}</option>)}
                    </select>
                 </div>
                 <div>
                    <label className="block text-[10px] uppercase text-gray-500 font-bold tracking-widest mb-2">Descrição</label>
                    <textarea className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-white/50 h-28 resize-none font-serif leading-relaxed" value={newSkill.description} onChange={(e) => setNewSkill({...newSkill, description: e.target.value})} placeholder="Descrição..." />
                 </div>
                 <button onClick={handleSaveSkill} className="w-full py-4 bg-white text-black font-bold rounded-lg uppercase tracking-wider hover:bg-gray-200 transition-all shadow-lg mt-2 flex justify-center items-center gap-2"><Save size={18} /> {editingSkillId ? 'Salvar' : 'Criar'}</button>
              </div>
           </div>
        </div>
      )}

      {/* Summon Modal */}
      {isSummonModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="glass-panel bg-[#131316] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden scale-100 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
              <div className="bg-gradient-to-r from-white/10 to-transparent p-6 border-b border-white/10 flex justify-between items-center">
                 <h3 className="font-header font-bold text-xl text-white uppercase tracking-wider flex items-center gap-2">
                   {editingSummonId ? <Edit3 size={20} /> : <Plus size={20} />} 
                   {editingSummonId ? 'Editar Invocação' : 'Nova Invocação'}
                 </h3>
                 <button onClick={() => setSummonModalOpen(false)} className="text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full transition-colors"><X size={20}/></button>
              </div>
              <div className="p-6 space-y-5">
                 {/* Summon Avatar Upload */}
                 <div className="w-full h-32 bg-black/30 rounded-lg border border-white/10 flex items-center justify-center relative group overflow-hidden cursor-pointer" onClick={() => triggerUpload({type: 'summonAvatar', summonId: 'temp'})}>
                     {newSummon.avatarUrl ? (
                        <img src={newSummon.avatarUrl} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                     ) : (
                        <div className="flex flex-col items-center text-gray-500 group-hover:text-white transition-colors">
                            <ImageIcon size={24} />
                            <span className="text-[10px] uppercase font-bold mt-2">Avatar da Invocação</span>
                        </div>
                     )}
                     <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                         <Camera size={24} className="text-white"/>
                     </div>
                 </div>

                 <div>
                    <label className="block text-[10px] uppercase text-gray-500 font-bold tracking-widest mb-2">Nome</label>
                    <input className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-white/50 focus:bg-white/5 transition-all text-lg font-title" value={newSummon.name} onChange={(e) => setNewSummon({...newSummon, name: e.target.value})} placeholder="Ex: Gorila de Nen" autoFocus />
                 </div>
                 <div>
                    <label className="block text-[10px] uppercase text-gray-500 font-bold tracking-widest mb-2">Tipo / Classificação</label>
                    <input className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-white/50" value={newSummon.type} onChange={(e) => setNewSummon({...newSummon, type: e.target.value})} placeholder="Ex: Besta de Nen, Clone, Item..." />
                 </div>
                 
                 {/* Summon Stats */}
                 <div className="grid grid-cols-2 gap-5">
                    <div>
                        <label className="block text-[10px] uppercase text-gray-500 font-bold tracking-widest mb-2">HP Máximo</label>
                        <input type="number" className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-white/50" value={newSummon.maxHp || ''} onChange={(e) => setNewSummon({...newSummon, maxHp: parseInt(e.target.value), currentHp: parseInt(e.target.value)})} placeholder="10" />
                    </div>
                    <div>
                        <label className="block text-[10px] uppercase text-gray-500 font-bold tracking-widest mb-2">Nen Máximo</label>
                        <input type="number" className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-white/50" value={newSummon.maxNen || ''} onChange={(e) => setNewSummon({...newSummon, maxNen: parseInt(e.target.value), currentNen: parseInt(e.target.value)})} placeholder="0" />
                    </div>
                 </div>

                 {/* Summon Attributes Editing */}
                 <div className="bg-white/5 p-4 rounded-lg border border-white/5">
                     <span className="block text-[10px] uppercase text-gray-400 font-bold tracking-widest mb-3 border-b border-white/5 pb-2">Atributos da Invocação</span>
                     <div className="grid grid-cols-3 gap-3">
                         {Object.keys(newSummon.attributes || {}).map((key) => {
                             const attrKey = key as keyof Attributes;
                             const labels: Record<string, string> = { strength: 'FOR', intelligence: 'INT', charisma: 'CAR', determination: 'DET', constitution: 'CON', prestidigitation: 'DES' };
                             
                             return (
                                 <div key={key}>
                                     <label className="block text-[9px] uppercase text-gray-500 font-bold mb-1">{labels[key]}</label>
                                     <input 
                                        type="number"
                                        className="w-full bg-black/30 border border-white/10 rounded p-2 text-white text-center outline-none focus:border-theme/50"
                                        value={newSummon.attributes ? newSummon.attributes[attrKey] : 0}
                                        onChange={(e) => setNewSummon({
                                            ...newSummon,
                                            attributes: {
                                                ...newSummon.attributes!,
                                                [attrKey]: parseInt(e.target.value) || 0
                                            }
                                        })}
                                     />
                                 </div>
                             )
                         })}
                     </div>
                 </div>

                 <div>
                    <label className="block text-[10px] uppercase text-gray-500 font-bold tracking-widest mb-2">Descrição</label>
                    <textarea className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-white/50 h-28 resize-none font-serif leading-relaxed" value={newSummon.description} onChange={(e) => setNewSummon({...newSummon, description: e.target.value})} placeholder="Descreva o que ela faz..." />
                 </div>
                 <button onClick={handleSaveSummon} className="w-full py-4 bg-white text-black font-bold rounded-lg uppercase tracking-wider hover:bg-gray-200 transition-all shadow-lg mt-2 flex justify-center items-center gap-2"><Save size={18} /> {editingSummonId ? 'Salvar' : 'Criar'}</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;