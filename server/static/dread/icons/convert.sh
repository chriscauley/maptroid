set -e

FILES="${@:-$(ls svg/|grep svg)}"

MEDIA_TARGET=../../../.media/dread_icons

rm -rf $MEDIA_TARGET tmp
mkdir tmp
mkdir -p tmp/256
mkdir -p tmp/128
mkdir -p tmp/64
mkdir -p tmp/32
mkdir -p tmp/16

for i in ${FILES}
do
    NAME=${i%.*}
    inkscape -z svg/$NAME.svg -e tmp/256/$NAME.png
    convert tmp/256/$NAME.png -resize 50% tmp/128/$NAME.png
    convert tmp/256/$NAME.png -resize 25% tmp/64/$NAME.png
    convert tmp/256/$NAME.png -resize 12.5% tmp/32/$NAME.png
    convert tmp/256/$NAME.png -resize 6.25% tmp/16/$NAME.png
done

for i in 256 128 64 32 16
do
    optipng tmp/$i/*.png -o 7
    cd tmp/$i
    zip -r dread-icons-$i.zip *.png
    cd ../..
done

cd svg
zip -r dread-icons-svg.zip *.svg
mv dread-icons-svg.zip ../tmp
cd ..

cp tmp/64/*.png .
mv tmp $MEDIA_TARGET
