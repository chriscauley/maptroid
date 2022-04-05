import About from './About.vue'
import Contact from './Contact.vue'
import dread from './dread/index'
import Downloads from './Downloads.vue'
import FileBrowser from './FileBrowser.vue'
import gamepad from '@/unrest/gamepad'
import Home from './Home.vue'
import Play from './Play.vue'
import PlayMenu from './PlayMenu.vue'
import PowerSuit from './PowerSuit'
import ProcessDread from './ProcessDread.vue'
import Trainer from './Trainer'
import ScreenshotAnalyzer from './ScreenshotAnalyzer/index.vue'
import ScreenshotUpload from './ScreenshotUpload.vue'
import ScreenshotViewer from './ScreenshotViewer.vue'
import SmileCompare from './SmileCompare.vue'
import SmileOcr from './SmileOcr.vue'
import SmileSprite from './SmileSprite/index.vue'
import SpriteGallery from './SpriteGallery.vue'
import SuperMetroid from './sm/index.vue'
import SmAssignZone from './sm/AssignZone.vue'
import SmPlmAlign from './sm/PlmAlign.vue'

const { TestGamepad, ConfigureGamepad } = gamepad

export default {
  ...dread,
  About,
  Contact,
  Downloads,
  FileBrowser,
  ConfigureGamepad,
  TestGamepad,
  Home,
  Play,
  PlayMenu,
  PowerSuit,
  ProcessDread,
  Trainer,
  ScreenshotAnalyzer,
  ScreenshotUpload,
  ScreenshotViewer,
  SmileCompare,
  SmileOcr,
  SmileSprite,
  SpriteGallery,
  SuperMetroid,
  SmAssignZone,
  SmPlmAlign,
}
