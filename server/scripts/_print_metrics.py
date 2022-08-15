import _setup
from maptroid.models import World

_metrics = []
for world in World.objects.all():
    if not 'metrics' in world.data:
        continue
    if world.slug in ['decision', 'cliffhanger', 'kaizo']:
        continue
    # _metrics.append(main(world, '-f' in sys.argv))
    _metrics.append([(str(world)+" "*12)[:15], str(world.data['metrics']['screens'])])
_metrics = sorted(_metrics)
cols = 4
rows = len(_metrics) // 4 + 1
for ri in range(rows):
    out = []
    for c in range(cols):
        ci = c * rows + ri
        if len(_metrics) > ci:
            out.append("".join(_metrics[ci]))
    print('\t  '.join(out))