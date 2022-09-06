import _setup
from django.conf import settings
from django.core.files import File
import json
from pathlib import Path
import shutil

from maptroid.models import World, Video, Channel

def main():
    for d in (Path(settings.SINK_DIR) / '_videos').iterdir():
        external_id = str(d).split('/')[-1]
        if Video.objects.filter(external_id=external_id).exists():
            continue

        with open(str(d / 'data.json'), 'r') as f:
            data = json.loads(f.read())

        try:
            channel = Channel.objects.get(name=data['channel_name'])
        except Channel.DoesNotExist:
            print('missing channel:', data['channel_name'])
            continue

        video_data = Video.default_data()
        video_data['unknown_items'] = data['items']
        video_data['fps'] = data['fps']
        thumbnail_path = Path(settings.MEDIA_ROOT) / 'video_thumbnails' / f'{external_id}.png'
        shutil.copy(d / 'thumbnail.png', thumbnail_path)
        kwargs = {
            'external_id': external_id,
            'channel': channel,
            'label': data['label'],
            'title': data['title'],
            'world': World.objects.get(slug=data['world_slug']),
            'data': video_data,
            'thumbnail': f'video_thumbnails/{external_id}.png',
        }

        if external_id.isdigit():
            kwargs['source'] = 'twitch'
        else:
            kwargs['source'] = 'youtube'
        Video.objects.create(**kwargs)
        print('created video for ', external_id)

if __name__ == "__main__":
    main()