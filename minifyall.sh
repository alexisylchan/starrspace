#!/bin/bash
version=1.2
for filename in static/src/*.js; do
    name=${filename##*/}
    basename=${name%.js}
    # git mv static/build/src/$basename.min.js static/build/src/$basename.$version.min.js
    minifyjs -m -i static/src/$basename.js -o static/build/src/$basename.$version.min.js
    git add static/src/$basename.js    
    git add static/build/src/$basename.$version.min.js
done
