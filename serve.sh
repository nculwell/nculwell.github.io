#!/bin/sh

HOST=0.0.0.0
OPTIONS="--host $HOST"
OPTIONS="$OPTIONS --drafts"
OPTIONS="$OPTIONS --unpublished"

bundle exec jekyll serve $OPTIONS

