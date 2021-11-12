FILES="${@:-$(ls svg/|grep svg)}"

for i in ${FILES}
do
    NAME=${i%.*}
    inkscape -z svg/$NAME.svg -e $NAME.png
done

for i in ${FILES}
do
    NAME=${i%.*}
    optipng $NAME.png -o 7
done
