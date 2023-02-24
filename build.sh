#!/bin/bash

mkdir -p build
tsc
cp -r dist build/dist
cp index.html styles.css build
