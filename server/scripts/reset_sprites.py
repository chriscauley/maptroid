import _setup
import subprocess

from maptroid.models import Room, SmileSprite


m = "This will wipe room.data.plm_sprites, delete all sprites, and clear two directories."
m += "\nType yes to continue:"

if input(m) != "yes":
  print('exiting')
  exit()

print("deleting")
for room in Room.objects.filter(world__slug="super-metroid"):
  room.data.pop('plm_sprites', None)
  room.save()

SmileSprite.objects.all().delete()

bashCommand = "rm -rf .media/smile_sprites/ .media/plm_enemies/duplicates/"
process = subprocess.Popen(bashCommand.split(), stdout=subprocess.PIPE)
output, error = process.communicate()