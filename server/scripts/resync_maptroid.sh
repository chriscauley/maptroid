set -e
source .venv/bin/activate
echo "First moving maptroid-sink with events"
python scripts/_finalize_smile.py $1

[ -d ".media/smile_exports/$1/" ] || mkdir .media/smile_exports/$1/
for i in bts layer-1 layer-2 plm_enemies bts-extra;
do
[ -d .media/smile_exports/$1/$i/ ] || mkdir .media/smile_exports/$1/$i/
    cp ~chriscauley/projects/_maptroid-sink/$1/$i/*.png .media/smile_exports/$1/$i/;
done
# cp ~chriscauley/projects/_maptroid-sink/$1/plm_overrides/*.png .media/smile_exports/$1/plm_enemies/
