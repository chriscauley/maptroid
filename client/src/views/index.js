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
import Trainer from './Trainer'
import ScreenshotAnalyzer from './ScreenshotAnalyzer/index.vue'
import ScreenshotUpload from './ScreenshotUpload.vue'
import ScreenshotViewer from './ScreenshotViewer.vue'
import SmileCompare from './SmileCompare.vue'
import SmileOcr from './SmileOcr.vue'
import SmileSprite from './SmileSprite/index.vue'
import SpriteGallery from './SpriteGallery.vue'
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
  ProcessDread,
  Trainer,
  ScreenshotAnalyzer,
  ScreenshotUpload,
  ScreenshotViewer,
  SmileCompare,
  SmileOcr,
  SmileSprite,
  SmAssignZone,
  SmPlmAlign,
  SplitRoom,
  SpriteSheet,
  SpriteGallery,
}
