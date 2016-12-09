#!/bin/bash

set -e
mkdir -p dist
cp -rf static/* dist
spritesheet-js -p dist sprites/*
flow check
webpack --minimize