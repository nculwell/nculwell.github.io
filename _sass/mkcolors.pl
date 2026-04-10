#!/usr/bin/env perl

# This script reads colors_source.txt and outputs mdcolors.scss
# Run like this:
# ./mdcolors.pl colors_source.txt > mdcolors.scss

my $color;

foreach (<ARGV>) {
  chomp;
  s/\s*//g;
  if (!/\#/) 
  {
    $color = $_; 
  }
  else 
  {
    my @value = split /\#/;
    print "\$$color$value[0]: #$value[1];\n";
  }
}

