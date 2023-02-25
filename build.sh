#!/bin/bash

rm -rf build
mkdir build
tsc
cp -r dist build/dist
cp index.html styles.css build
