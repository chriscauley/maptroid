import ToolStorage from '@/components/unrest/ToolStorage'

const door1_variants = [
  'beam',
  'wide-beam',
  'diffusion-beam',
  'wave-beam',
  'grapple-beam',
  'plasma-beam',

  'trash',
  'gate',
  'pitfall',
]

const door2_variants = [
  'bomb',
  'power-bomb',
  'missile',
  'storm-missile',

  'flash-shift',
  'phantom-cloak',
  'screw-attack',
  'speed-booster',
]

const wall_variants = ['room', 'solid', 'mixed', 'ignore']

const tools = [
  { slug: 'door', variants: door1_variants },
  { slug: 'door', variants: door2_variants },
  { slug: 'wall', variants: wall_variants },
]

export default ToolStorage('screenshot/analyzer', { tools })
