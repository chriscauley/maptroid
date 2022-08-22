if [ -z "$SKIP_SYNC" ]
then
    source .venv/bin/activate
    echo "First moving maptroid-sink with events (this will fail in prod)"
    python scripts/_finalize_smile.py $1
fi

set -e

[ -d ".media/smile_exports/$1/" ] || mkdir .media/smile_exports/$1/
for i in bts layer-1 layer-2 plm_enemies bts-extra;
do
    [ -d .media/smile_exports/$1/$i/ ] || mkdir .media/smile_exports/$1/$i/
    cp ~chriscauley/projects/_maptroid-sink/$1/$i/*.png .media/smile_exports/$1/$i/;
done

if [ -z "$SKIP_SYNC" ]
then
    echo 'All done! (ignore instruction on previous line)'
done
