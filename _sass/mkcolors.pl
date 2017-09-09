#!/usr/bin/env perl

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

