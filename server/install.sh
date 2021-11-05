if [ ! -d .venv ]; then
    python3 -m venv .venv
fi

source .venv/bin/activate

if [ ! -d deepzoom.py ]; then
    git clone https://github.com/openzoom/deepzoom.py.git
    cd deepzoom.py
    python setup.py install
fi
