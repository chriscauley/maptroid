import PowerSuit from '@/views/PowerSuit/store'

export default () => Promise.all([PowerSuit('power-suit').load(), PowerSuit('weapons').load()])
