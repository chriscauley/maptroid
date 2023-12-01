import About from './About.vue'
import AssignSprite from './AssignSprite/index.vue'
import Contact from './Contact.vue'
import dread from './dread/index'
import Downloads from './Downloads.vue'
import FAQ from './FAQ/index.vue'
import FileBrowser from './FileBrowser.vue'
import gamepad from '@/unrest/gamepad'
import Home from './Home.vue'
import Labbook from './Labbook.vue'
import MapView from './MapView.vue'
import play from './play'
import SplitRoom from './SplitRoom'
import SpriteSheet from './SpriteSheet'
import ProcessDread from './ProcessDread.vue'
import Skill from './Skill/index.vue'
import SylSvg from './SylSvg'
import Trainer from './Trainer'
import MultiTracker from './MultiTracker'
import ScreenshotAnalyzer from './ScreenshotAnalyzer/index.vue'
import ScreenshotUpload from './ScreenshotUpload.vue'
import ScreenshotViewer from './ScreenshotViewer.vue'
import SmileCompare from './SmileCompare.vue'
import SmileOcr from './SmileOcr.vue'
import SmileSprite from './SmileSprite/index.vue'
import SmAssignRoomEvent from './sm/AssignRoomEvent.vue'
import SmAssignZone from './sm/AssignZone.vue'
import SmPlmAlign from './sm/PlmAlign.vue'

const { TestGamepad, ConfigureGamepad } = gamepad

const { DreadSprites } = dread

export default {
  DreadSprites,
  ...play,
  About,
  AssignSprite,
  Contact,
  Downloads,
  FAQ,
  FileBrowser,
  ConfigureGamepad,
  TestGamepad,
  Home,
  Labbook,
  MapView,
  MultiTracker,
  ProcessDread,
  Skill,
  SylSvg,
  Trainer,
  ScreenshotAnalyzer,
  ScreenshotUpload,
  ScreenshotViewer,
  SmileCompare,
  SmileOcr,
  SmileSprite,
  SmAssignRoomEvent,
  SmAssignZone,
  SmPlmAlign,
  SplitRoom,
  SpriteSheet,
}
