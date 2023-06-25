from smur import nature

randomizers = {
    'nature': nature,
}

def get_randomizer(slug):
    if slug not in randomizers:
        slugs = '|'.join(list(randomizers.keys()))
        raise ValueError(f'Unknown randomizer "{slug}", options are {slugs}')
    return randomizers[slug]