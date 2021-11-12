for i in `ls *.svg`
do
    inkscape -z $i -e ../${i%.*}.png
done