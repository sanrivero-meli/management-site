/**
 * Script to import projects/initiatives
 * 
 * Usage:
 *   npx tsx scripts/import-projects.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Helper function to parse date format "DD-M" to "YYYY-MM-DD"
function parseDate(dateStr: string | null | undefined): string | null {
  if (!dateStr || dateStr.trim() === '' || dateStr === '-') return null
  
  const parts = dateStr.split('-')
  if (parts.length !== 2) return null
  
  const day = parseInt(parts[0], 10)
  const month = parseInt(parts[1], 10)
  
  if (isNaN(day) || isNaN(month) || day < 1 || day > 31 || month < 1 || month > 12) {
    return null
  }
  
  // Assuming year 2025
  const year = 2025
  return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
}

const initiatives = [
  {
    name: 'Banco de Mexico',
    scope: 'Obtención de la licencia bancaria en México (convertir la licencia IFPE en IBM).',
    status: 'Active' as const,
    estimated: 1.25,
    start_date: parseDate('05-1'),
    end_date: parseDate('31-3'),
  },
  {
    name: '[Carry Over] [Roll Out] - Aceptación del débito automático del usuario en cada apertura de cuenta + Update CCB',
    scope: 'Soporte al rollout',
    status: 'Active' as const,
    estimated: 0.75,
    start_date: parseDate('05-1'),
    end_date: parseDate('31-3'),
  },
  {
    name: '[Cross-segment] Línea Seller MLA - Preparación de los CHOs para cobros de IDC',
    scope: 'Traer concepto IDC en summaries de MLA',
    status: 'Active' as const,
    estimated: 0.25,
    start_date: parseDate('05-1'),
    end_date: parseDate('16-1'),
  },
  {
    name: '[MLB] Collateral - FGBS',
    scope: 'Asociación con el BNDES para el lanzamiento del FGBS (Fondo Garantidor BNDES-Sebrae), mediante el cual MP ofrece creditos con una garantía de hasta 80% del valor del crédito, con un stop-loss del 8% sobre la cartera, para usuarios PJ. El crédito operará como fondeo único (no se permiten dos créditos simultáneos; el seller podrá solicitar otro una vez cancelado el anterior), similar a Cuota Fija, pero con condiciones mejoradas. Desarrollos requeridos: -Integración con el proveedor para originar créditos, pagar el fee de originación y gestionar el reclamo de la garantía. -Implementación del flujo de opt-in y originación para usuarios. -Inclusión del fee de originación en la tasa del crédito. -Ajustes en modelos contables y procesos de cobranza para habilitar la ejecución del collateral. -(Opcional) Período de carencia de 3 meses, actualmente exigido por el BNDES, que podría eliminarse próximamente.',
    status: 'Active' as const,
    estimated: 8,
    start_date: parseDate('05-1'),
    end_date: parseDate('31-3'),
  },
  {
    name: 'Convivencia de Productos - Originación y Awareness',
    scope: '',
    status: 'Active' as const,
    estimated: 5,
    start_date: parseDate('05-1'),
    end_date: parseDate('31-3'),
  },
  {
    name: 'Convivencia de Productos - Transición de Buyers a Sellers',
    scope: '',
    status: 'Active' as const,
    estimated: 5,
    start_date: parseDate('05-1'),
    end_date: parseDate('31-3'),
  },
  {
    name: '[Linea Seller] Convivencia con PPV',
    scope: 'Poder tener convivencia de ofertas, reglas y flujos de originación entre PPV con Linea Seller. Actualmente el Admin donde se visualiza LS no soporta la convivencia.',
    status: 'Active' as const,
    estimated: 5.5,
    start_date: parseDate('05-1'),
    end_date: parseDate('30-1'),
  },
  {
    name: '[DE] Tasa 0 - Tasa por Plazo',
    scope: 'Generar capability de Tasa por Plazo para poder ofrecer tasa 0% a 7 días. Adecuar experiencia y triggers para ofrecer el beneficio a los usuarios correspondientes.',
    status: 'Active' as const,
    estimated: 0.5,
    start_date: parseDate('05-1'),
    end_date: parseDate('13-2'),
  },
  {
    name: '[Carry Over] [MLB] Continuación desarrollo Migración a Flox PPV',
    scope: 'Migración a FLOX para posteriormente poder implementar las propuestas de mejoras en los simuladores de PPV.',
    status: 'Active' as const,
    estimated: 0.5,
    start_date: parseDate('05-1'),
    end_date: parseDate('31-3'),
  },
  {
    name: 'Adelantos: Contextualización de restricciones de riesgo bajo',
    scope: 'Contextualizar en el admin de adelantos ante la aplicación de una restricción de riesgo bajo que imposibilita a los sellers de adelantar ventas no despachadas.',
    status: 'Planning' as const,
    estimated: 2.25,
    start_date: parseDate('05-1'),
    end_date: parseDate('31-3'),
  },
  {
    name: 'Desarrollo Prestamista en Linea Seller',
    scope: '',
    status: 'Active' as const,
    estimated: 0.5,
    start_date: parseDate('20-1'),
    end_date: parseDate('13-3'),
  },
  {
    name: 'Integración Nuevos Niveles de Validación KYC (Nivel 6 Reforzado y Nivel 7)',
    scope: 'Solo PF. PJ TBD.',
    status: 'Active' as const,
    estimated: 4.5,
    start_date: parseDate('05-1'),
    end_date: parseDate('27-2'),
  },
  {
    name: '[Desarrollo] Adelantos en Commerce - Ventas L2',
    scope: 'Desarrollo de nuevo cross sell de Adelantos en la pantalla de detalle de Ventas',
    status: 'Planning' as const,
    estimated: 1.25,
    start_date: parseDate('05-1'),
    end_date: parseDate('31-3'),
  },
  {
    name: '[Desarrollo] Adelantos en Commerce - Ventas L1',
    scope: 'Desarrollo de nuevo cross sell de Adelantos en la pantalla principal de Ventas',
    status: 'Planning' as const,
    estimated: 1.25,
    start_date: parseDate('05-1'),
    end_date: parseDate('31-3'),
  },
  {
    name: '[Commerce] Iteración Card Credits en Summary',
    scope: 'Desarrollo de nuevos casos de uso: Cobranza, Mora, TC. Preparacion del componente para consumir Score Numerico.',
    status: 'Active' as const,
    estimated: 0.75,
    start_date: parseDate('02-2'),
    end_date: parseDate('06-3'),
  },
  {
    name: '[Calidad] Migración a Andes X - Nativo',
    scope: 'Migración de flujos nativos a Andes X, UX + comienzo desarrollo',
    status: 'Active' as const,
    estimated: 1.5,
    start_date: parseDate('05-1'),
    end_date: parseDate('30-1'),
  },
  {
    name: '[Calidad] Migración a Andes X - Desktop',
    scope: 'Migración de flujos Desktop a Andes X, UX + comienzo desarrollo',
    status: 'Active' as const,
    estimated: 1.5,
    start_date: parseDate('05-1'),
    end_date: parseDate('13-2'),
  },
  {
    name: '[Linea Seller] Mejoras técnicas post Roll - Out',
    scope: '',
    status: 'Planning' as const,
    estimated: 3.5,
    start_date: parseDate('03-2'),
    end_date: parseDate('31-3'),
  },
  {
    name: '[Adelantos] Adaptaciones para poder ofrecer Fee 0%',
    scope: 'Contexto: El 35% de los usuarios Xsite que adelantan por primera vez repiten en los posteriores 30 días. Dada la alta tasa de repetición post primer adelanto se está impulsando xsite campañas de descuento de pricing para que el usuario pruebe el producto. Descripción iniciativa: Buscamos poder ofrecerle a los users la posibilidad de hacer adelantos a fee 0%. Actualmente el producto tiene la limitante de que los fees tienen que ser > 0, como control.',
    status: 'Planning' as const,
    estimated: 1,
    start_date: parseDate('09-1'),
    end_date: parseDate('23-1'),
  },
  {
    name: '[Renova] Experiencia de Renova en Admin Credits',
    scope: 'Diseño de experiencia de Renova en el Admin de Credits for Sellers.',
    status: 'Planning' as const,
    estimated: 3.5,
    start_date: parseDate('02-2'),
    end_date: parseDate('31-3'),
  },
  {
    name: 'FUNCIONALIDADE EOC: Grupos de Control',
    scope: 'Fase 4! Poder argar grupos en base a 1 o mas variables (fase 2 2.0 o fase 4 mas complejidad)',
    status: 'Active' as const,
    estimated: 0.5,
    start_date: null,
    end_date: null,
  },
  {
    name: 'ITERACIONES EOC: Evoluciones - Módulo de Políticas',
    scope: 'Poder calcular con fórmulas simples, de lógica, además de crear flujos de condiciones dentro del EOC.',
    status: 'Active' as const,
    estimated: 2,
    start_date: parseDate('05-1'),
    end_date: parseDate('31-3'),
  },
  {
    name: '[Strategy] Conversión Simulaciónes a Campañas',
    scope: 'Desarrollar la capacidad de "Convertir a Campaña" y viceversa, es decir "Campaña a Simulación"',
    status: 'Planning' as const,
    estimated: 1.25,
    start_date: parseDate('05-1'),
    end_date: parseDate('31-3'),
  },
  {
    name: 'Reglas y Killer - Incorporar Date Picker',
    scope: 'Implementación de la feature, acompañamiento.',
    status: 'Active' as const,
    estimated: 0.25,
    start_date: parseDate('05-1'),
    end_date: parseDate('31-3'),
  },
  {
    name: 'Campos Obligatorios y Default en Politicas',
    scope: 'Robustecer la interfaz (UX) para guiar al usuario. Al forzar la carga de datos obligatorios y transparentar los valores default, reducimos drásticamente el error humano y aseguramos que lo que se configura es exactamente lo que se ejecuta.',
    status: 'Planning' as const,
    estimated: 0.75,
    start_date: parseDate('05-1'),
    end_date: parseDate('31-3'),
  },
  {
    name: 'Condensador de Flujos - Implementación',
    scope: 'Soporte',
    status: 'Active' as const,
    estimated: 0.25,
    start_date: parseDate('05-1'),
    end_date: parseDate('31-3'),
  },
  {
    name: 'Impactos en Banco de México',
    scope: 'Análisis para identificar impactos',
    status: 'Planning' as const,
    estimated: 0.25,
    start_date: parseDate('05-1'),
    end_date: parseDate('31-3'),
  },
  {
    name: 'Multi Scoring',
    scope: 'Desarrollo',
    status: 'Active' as const,
    estimated: 0.25,
    start_date: parseDate('05-1'),
    end_date: parseDate('31-3'),
  },
]

async function importProjects() {
  console.log('Starting import of projects...')
  console.log('='.repeat(60))
  
  // Check if projects already exist
  const { data: existingProjects } = await supabase
    .from('projects')
    .select('name')
    .limit(5)

  if (existingProjects && existingProjects.length > 0) {
    console.log(`⚠️  Found ${existingProjects.length}+ existing projects in database`)
    console.log('Skipping import to avoid duplicates.')
    console.log('If you want to import anyway, delete existing projects first.')
    return
  }
  
  const { data, error } = await supabase
    .from('projects')
    .insert(initiatives)
    .select()

  if (error) {
    console.error('❌ Error importing projects:', error)
    process.exit(1)
  }

  console.log(`✅ Successfully imported ${data.length} projects!`)
  console.log('\nImported projects:')
  data.forEach((project, index) => {
    console.log(`${index + 1}. ${project.name} (${project.status})`)
  })
}

importProjects()
  .then(() => {
    console.log('\n✅ Import completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Import failed:', error)
    process.exit(1)
  })
