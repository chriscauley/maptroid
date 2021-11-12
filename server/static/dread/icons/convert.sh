for i in `ls svg/|grep svg`
do
    inkscape -z svg/$i -e ${i%.*}.png
done

optipng *.png -o 7