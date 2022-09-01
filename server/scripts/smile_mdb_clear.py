# This removes bad smile ids (those in the unknown zone) form mdb.txt
# the goal is to save some time in the import script

from _setup import get_wzr

from django.conf import settings
import os

def main():
    world, _, _ = get_wzr()
    zone = world.zone_set.get(slug=f'ztrash-{world.slug}')
    bad_smile_ids = {
        r.key.split('_')[-1].replace('.png', ''): True
        for r in zone.room_set.all()
    }

    # load mdbs
    mdb_path = os.path.join(settings.SINK_DIR, world.slug, 'mdb.txt')
    with open(mdb_path, 'r') as f:
        mdb = f.read().split('\n')

    # create a backup if one doesn't exist
    mdb_copy_path = os.path.join(settings.SINK_DIR, world.slug, 'mdb_copy.txt')
    if not os.path.exists(mdb_copy_path):
        with open(mdb_copy_path, 'w') as f:
            f.write('\n'.join(mdb))


    # filter_smile_ids and save
    mdb = [s for s in mdb if not s in bad_smile_ids]
    with open(mdb_path, 'w') as f:
        f.write('\n'.join(mdb))



if __name__ == "__main__":
    main()