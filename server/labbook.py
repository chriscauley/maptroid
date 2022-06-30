import cv2
from django.conf import settings
import json
from pathlib import Path

def _media(path):
    return '/media/' + str(path).split('.media/')[-1]

class Labbook():
    def __init__(self, name, data=None):
        self.name = name
        self.data = data or {}
        if not self.data.get('name'):
            self.data['name'] = name
        self.root = Path(settings.MEDIA_ROOT) / f'labbooks/{name}'
        self.root.mkdir(parents=True, exist_ok=True)
        self.data['sections'] = self.sections = []
        self.url = None
        self.warnings = []

    def __str__(self):
        return f'http://maptroid.uberfordogs.com:8943/app/labbook/{self.name}'

    def add(self, section):
        section_no = len(self.sections)
        if 'np' in section:
            path = str(self.root / f'{section_no}.png')
            cv2.imwrite(path, section.pop('np'))
            section['media'] = path
        if 'media' in section:
            path = section.pop('media')
            image = cv2.imread(path)
            section['height'], section['width'] = image.shape[:2]
            section['src'] = _media(path)
            section['fname'] = path.split('/')[-1]
        self.sections.append(section)
        self.save()

    def add_image(self, path, caption=None, data=None):
        data = data or {}
        self.add({ **data, 'media': path, 'caption': caption })

    def save(self):
        data_path = self.root / 'data.json'
        data_text = json.dumps(self.data, indent=2)
        data_path.write_text(data_text)
        index = {}
        index_path = Path(settings.MEDIA_ROOT) / f'labbooks/index.json'
        if index_path.exists():
            try:
                index = json.loads(index_path.read_text())
            except:
                print("Warning: malformed json", self.name)
        index[self.name] = self.url = _media(data_path)
        index_path.write_text(json.dumps(index, indent=2))

    def warn(self, warning):
        self.warnings.append(warning)
        self.add({ 'flag': 'warning', 'caption': f'WARNING: {warning}' })

    def close(self):
        if len(self.warnings):
            print(f"\nLabbook closed with {len(self.warnings)} warnings:")
            print(self)
            print("\n".join(self.warnings))