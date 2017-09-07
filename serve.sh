#!/bin/sh
cp README.md index.md
bundle exec jekyll serve --host 0.0.0.0 --incremental
