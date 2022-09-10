import subprocess
import os

def main():
    colors = ['start', 'purple', 'green', 'white', 'blue']
    for color in colors:
        with open(f'../src/svg/{color}.svg', "w") as f:
            cmd = f'dot {color}.graph -Tsvg'
            process = subprocess.Popen(cmd.split(), stdout=f)
            process.wait()

        # Remove the first 6 lines as the xml declaration breaks the vue svg loader
        with open(f'../src/svg/{color}.svg', "r") as f:
            text = f.read()

        with open(f'../src/svg/{color}.svg', "w") as f:
            f.write('\n'.join(text.split('\n')[6:]))


if __name__ == "__main__":
    main()
