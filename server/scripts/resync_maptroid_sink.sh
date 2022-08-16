
for i in bts layer-1 layer-2 plm_enemies bts-extra;
do
    mkdir -p .media/smile_exports/$1/$i/;
    cp ~chriscauley/projects/_maptroid-sink/$1/$i/*.png .media/smile_exports/$1/$i/;
done
# cp ~chriscauley/projects/_maptroid-sink/$1/plm_overrides/*.png .media/smile_exports/$1/plm_enemies/
