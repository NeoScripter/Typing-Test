#!/bin/dash

npx terser script.js -o script.min.js --compress --mangle && npx css-minify -f styles.css
