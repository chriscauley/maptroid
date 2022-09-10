import subprocess
import os

def main():
    with open('./base.graph', 'r') as f:
        text = f.read()
    top, *rest, bottom = text.split('/* split */')

    colors = zip(['start', 'purple', 'green', 'white', 'blue'], rest)
    for color, code in colors:
        with open(f'_{color}.graph', 'w') as f:
            f.write(top+code+bottom)

        with open(f'../src/svg/{color}.svg', "w") as f:
            cmd = f'dot _{color}.graph -Tsvg'
            process = subprocess.Popen(cmd.split(), stdout=f)
            process.wait()

        with open(f'../src/svg/{color}.svg', "r") as f:
            text = f.read()

        with open(f'../src/svg/{color}.svg', "w") as f:
            f.write('\n'.join(text.split('\n')[6:]))


if __name__ == "__main__":
    main()
