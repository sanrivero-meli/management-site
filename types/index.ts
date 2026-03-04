// Database types based on Supabase schema
export type TeamMember = {
  id: string
  name: string
  email: string
  seniority: string
  level: number // 1-3
  influence_level: number // 1-5
  motivation_level: number // 1-5
  created_at?: string
  updated_at?: string
}

export type Goal = {
  id: string
  team_member_id: string
  title: string
  description: string | null
  key_actions: string[] | null
  kpis: string[] | null
  target_date: string | null
  status: 'Not Started' | 'In Progress' | 'Blocked' | 'Complete'
  related_skills: string[] | null
  created_at?: string
  updated_at?: string
}

export type Feedback = {
  id: string
  team_member_id: string
  cycle: string
  content?: string // Kept for backward compatibility
  highlights: string
  improvements: string
  highlights_skills: string[] | null
  improvements_skills: string[] | null
  feedback_date: string
  created_at?: string
  updated_at?: string
}

// Project constants
export const PROJECT_STATUSES = ['To Do', 'IN Poroto', 'CHECK POROTO', 'NO', 'OUT poroto', 'Check PR', 'Cancelled'] as const

export const JIRA_TRANSITION_IDS: Record<string, string> = {
  'To Do': '641',
  'IN Poroto': '701',
  'CHECK POROTO': '711',
  'NO': '721',
  'OUT poroto': '731',
  'Check PR': '791',
  'Cancelled': '771',
}
export const PROJECT_PRIORITIES = ['HIT', 'Carryover', 'BAU', 'World Class', 'Wishlist', 'Quality'] as const
export const PROJECT_CATEGORIES = ['Legal', 'Delivery', 'Research', 'Support'] as const
export const PROJECT_SQUADS = ['Long Term', 'Short Term', 'Backoffice', 'Cross'] as const
export const PROJECT_TAGS = ['Craft', 'Highlight'] as const
export const PRODUCT_OWNERS = ['Agustina', 'Tatiana', 'Santiago', 'Matías', 'Felipe', 'Francisco'] as const

export type ProjectStatus = typeof PROJECT_STATUSES[number]
export type ProjectPriority = typeof PROJECT_PRIORITIES[number]
export type ProjectCategory = typeof PROJECT_CATEGORIES[number]
export type ProjectSquad = typeof PROJECT_SQUADS[number]
export type ProjectTag = typeof PROJECT_TAGS[number]
export type ProductOwner = typeof PRODUCT_OWNERS[number]

export type Project = {
  id: string
  name: string
  description: string | null
  scope: string | null
  jira_link: string | null
  jira_key: string | null
  status: ProjectStatus
  priority: ProjectPriority | null
  category: ProjectCategory | null
  squad: ProjectSquad | null
  tags: ProjectTag[] | null
  owners: string[] | null // Array of team member IDs
  product_owner: ProductOwner | null
  start_date: string | null
  end_date: string | null
  estimated: number | null
  required_skills: string[] | null
  skill_requirements: SkillRequirement[] | null
  team_size: number | null // 1-2 (null = auto-suggest)
  complexity: number | null // 1-3
  created_at?: string
  updated_at?: string
}

export type Assignment = {
  id: string
  project_id: string
  team_member_id: string
  sprints_allocated: number
  quarter: string
  role: AssignmentRole | null
  notes: string | null
  created_at?: string
  updated_at?: string
}

// Task constants
export const TASK_STATUSES = ['Not Started', 'In Progress', 'Blocked', 'Complete'] as const
export type TaskStatus = typeof TASK_STATUSES[number]

export type ProjectTask = {
  id: string
  project_id: string
  name: string
  description: string | null
  deliverables: string | null
  start_date: string | null
  end_date: string | null
  owner_id: string | null
  status: TaskStatus
  created_at?: string
  updated_at?: string
}

export type ProjectMilestone = {
  id: string
  project_id: string
  name: string
  date: string
  color: string
  created_at?: string
}

export const MILESTONE_COLORS = [
  '#ef4444', // red-500
  '#3b82f6', // blue-500
  '#10b981', // green-500
  '#f59e0b', // amber-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
] as const

// Skills type - 15 skills organized in 4 categories
export type Skills = {
  id: string
  team_member_id: string
  // Core (4 skills)
  pensamiento_critico: number // 0-3
  vision_sistemica: number // 0-3
  argumentacion_facilitacion: number // 0-3
  adopcion_ai_nuevas_tecnologias: number // 0-3
  // Product Design (5 skills)
  conocimiento_usuario: number // 0-3
  problem_framing_briefing: number // 0-3
  ideacion_prototipado: number // 0-3
  user_journey_flow: number // 0-3
  propuestas_out_of_the_box: number // 0-3
  // Visual Design (3 skills)
  principios_diseno: number // 0-3
  sistema_diseno: number // 0-3
  visual_polishing: number // 0-3
  // Content Strategy (3 skills)
  escritura_ux: number // 0-3
  narrativa_estrategia: number // 0-3
  sistema_contenidos: number // 0-3
  overall_rating: number // 0-3
  skill_descriptions?: Record<string, string> | null
  skill_comments?: Record<string, string> | null
  is_draft?: boolean
  created_at?: string
  updated_at?: string
}

export const SKILL_CATEGORIES = {
  'Core': [
    'pensamiento_critico',
    'vision_sistemica',
    'argumentacion_facilitacion',
    'adopcion_ai_nuevas_tecnologias',
  ],
  'Product Design': [
    'conocimiento_usuario',
    'problem_framing_briefing',
    'ideacion_prototipado',
    'user_journey_flow',
    'propuestas_out_of_the_box',
  ],
  'Visual Design': [
    'principios_diseno',
    'sistema_diseno',
    'visual_polishing',
  ],
  'Content Strategy': [
    'escritura_ux',
    'narrativa_estrategia',
    'sistema_contenidos',
  ],
} as const

export const SKILL_LABELS: Record<string, string> = {
  pensamiento_critico: 'Pensamiento Crítico',
  vision_sistemica: 'Visión sistémica',
  argumentacion_facilitacion: 'Argumentación y facilitación',
  adopcion_ai_nuevas_tecnologias: 'Adopción de AI y nuevas tecnologías',
  conocimiento_usuario: 'Conocimiento del Usuario',
  problem_framing_briefing: 'Problem Framing & Briefing',
  ideacion_prototipado: 'Ideación y prototipado (craft)',
  user_journey_flow: 'User journey & flow (craft)',
  propuestas_out_of_the_box: 'Propuestas Out-of-the-Box',
  principios_diseno: 'Principios de Diseño',
  sistema_diseno: 'Sistema de diseño',
  visual_polishing: 'Visual polishing (craft)',
  escritura_ux: 'Escritura UX (craft)',
  narrativa_estrategia: 'Narrativa y estrategia',
  sistema_contenidos: 'Sistema de Contenidos',
}

export const SKILL_DESCRIPTIONS: Record<string, string> = {
  pensamiento_critico: 'Tomar partido y aportar opiniones formadas en benchmark, objetivos del negocio, necesidades del usuario y en su conocimiento técnico.',
  vision_sistemica: 'Tener una mirada holística para la elaboración de propuestas, mapeando todos los impactos, buscando escalabilidad y consistencia en el ecosistema.',
  argumentacion_facilitacion: 'Desarrollar capacidad argumentativa, facilitando y alineando espacios de trabajo colaborativo. Entendiendo dónde poner el foco de la conversación para ser más eficiente, por ejemplo yendo de lo general a lo particular.',
  adopcion_ai_nuevas_tecnologias: 'Estar a la vanguardia, explorar e incorporar nuevas herramientas para ganar calidad y velocidad en la ejecución. Identifica si tiene capacidad de escalar e impulsa una capability.',
  conocimiento_usuario: 'Conocer las necesidades del usuario, sabiendo que insight obtener para considerarlo en el proceso de diseño "user centric".',
  problem_framing_briefing: 'Conceptualizar una solución de lo que necesitamos diseñar, a partir de las necesidad del negocio y del usuario para lograr impacto.',
  ideacion_prototipado: 'Realizar propuestas rápidas, generando wireframes y prototipos (por ej usando IA) para evaluar diferentes caminos o hipotesis de solución.',
  user_journey_flow: 'Pensar experiencias y flujos con mirada holística mapeando todos los casos de uso (felices y no felices). Definir el alcance.',
  propuestas_out_of_the_box: 'Pensar en experiencias que generen un efecto WOW por ejemplo que se adelantan a necesidades del user. Romper statu quo, explora y desarrolla múltiples alternativas "out of the box".',
  principios_diseno: 'Entender y dominar los principios de diseño, saber cómo aplicarlos y cuando corresponde hacer algo funcional, emocional o uso de recursos especiales como motion. Saber ejecutarlo con excelencia.',
  sistema_diseno: 'Uso eficiente del sistema de diseño. Explorar al máximo los componentes existentes para obtener lo mejor de ellos, y saber cuándo y cómo expandir sus límites sumando extensiones, trayendo nuevas tendencias que nos permiten mantenerlo actualizado.',
  visual_polishing: 'Velar por el diseño en el proceso punta a punta. Foco en pixel perfect y coherencia en cada step de la experiencia que diseña. Garantizar la correcta implementación y presta atención a los detalles.',
  escritura_ux: 'Garantizar una escritura funcional y natural que sea accesible, inclusiva, orientada a la acción y escaneable. Tener el criterio para aplicar la sugerencia de la IA o modificarla.',
  narrativa_estrategia: 'Crear narrativas con propósito mediante storytelling: Establece mensajes clave para destacar la propuesta de valor y el comportamiento del user a influir según el contexto. Definir qué contar, en qué orden y con qué jerarquía.',
  sistema_contenidos: 'Velar por los estándares, glosarios y vocabularios controlados para mejorar el entendimiento y adopción del producto. Saber cuando aplicarlo y cuando romperlo.',
}

export const RATING_LABELS = {
  0: 'No experience',
  1: 'Beginner',
  2: 'Intermediate',
  3: 'Advanced',
} as const

export type MemberPerformanceProject = {
  id: string
  team_member_id: string
  project_id: string | null
  project_name: string
  start_date: string
  end_date: string | null
  status: 'Planning' | 'Active' | 'On Hold' | 'Complete' | 'Cancelled'
  related_skills: string[] | null
  comments: string | null
  links: Array<{ label: string; url: string }> | null
  created_at?: string
  updated_at?: string
}

// Skills History type - published snapshots of skills
export type SkillsHistory = {
  id: string
  team_member_id: string
  version_date: string
  version_name: string | null
  // Core (4 skills)
  pensamiento_critico: number | null
  vision_sistemica: number | null
  argumentacion_facilitacion: number | null
  adopcion_ai_nuevas_tecnologias: number | null
  // Product Design (5 skills)
  conocimiento_usuario: number | null
  problem_framing_briefing: number | null
  ideacion_prototipado: number | null
  user_journey_flow: number | null
  propuestas_out_of_the_box: number | null
  // Visual Design (3 skills)
  principios_diseno: number | null
  sistema_diseno: number | null
  visual_polishing: number | null
  // Content Strategy (3 skills)
  escritura_ux: number | null
  narrativa_estrategia: number | null
  sistema_contenidos: number | null
  overall_rating: number | null
  skill_comments: Record<string, string> | null
  created_at?: string
}

// Skills Comparison type - for comparing two versions
export type SkillsComparison = {
  version1: SkillsHistory
  version2: SkillsHistory
  deltas: Record<string, number> // skill_key -> difference (version2 - version1)
}

// Member Influence type - tracks influence relationships between team members
export type MemberInfluence = {
  id: string
  source_member_id: string
  target_member_id: string
  influence_level: number // 1-5
  created_at?: string
  updated_at?: string
}

// Influence labels for 1-5 scale
export const INFLUENCE_LABELS: Record<number, string> = {
  1: 'Very Low',
  2: 'Low',
  3: 'Average',
  4: 'High',
  5: 'Very High',
} as const

// Todo types
export interface TodoCategory {
  id: string
  user_id: string
  name: string
  color: string
  created_at: string
}

export interface Todo {
  id: string
  user_id: string
  title: string
  description: string | null
  completed: boolean
  priority: 'low' | 'medium' | 'high'
  due_date: string | null
  created_at: string
  updated_at: string
}

// Allocation engine types
export type SkillRequirement = {
  skill: string
  importance: 'must_have' | 'nice_to_have'
}

export type AssignmentRole = 'lead' | 'contributor'

// Planning types
export const SPRINTS_PER_QUARTER = 12

export const QUARTERS = [
  'Q1 2025', 'Q2 2025', 'Q3 2025', 'Q4 2025',
  'Q1 2026', 'Q2 2026', 'Q3 2026', 'Q4 2026',
] as const

export const COMPLEXITY_LABELS: Record<number, string> = {
  1: 'Low',
  2: 'Medium',
  3: 'High',
}

export type TeamMemberWithSkills = TeamMember & {
  skills: Skills | null
}

export type AssignmentWithDetails = Assignment & {
  project?: { name: string; jira_key: string | null; priority: ProjectPriority | null }
  team_member?: { name: string; seniority: string; level: number }
}

export type SuggestedAssignment = {
  project_id: string
  team_member_id: string
  sprints_allocated: number
  confidence_score: number // 0-1
  role: AssignmentRole
  match_details: {
    skill_score: number
    must_have_coverage: number
    capacity_remaining: number
    seniority_fit: string
    motivation_bonus: number
    experience_bonus: number
    complementarity_score: number
  }
}

export type JiraEpic = {
  id: string
  key: string
  summary: string
  status: string
  priority: string
}
