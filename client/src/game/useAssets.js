import SpriteSheet from '@/views/SpriteSheet/store'

export default () => Promise.all([SpriteSheet('power-suit').load(), SpriteSheet('weapons').load()])
