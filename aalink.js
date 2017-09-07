// Convert Amazon links to AA links.

"use strict";

function replaceLinks() {
  $.ajax("/aalinks.txt", {
    dataType: "text",
    success: replaceLinksContinue
  });
}

function replaceLinksContinue(aaLinks) {
  var links = aaLinks.split(/\s+/g);
  //console.log(links);
  var linksByAsin = {};
  for (var i = 0; i < links.length; ++i) {
    var link = links[i];
    if (link) {
      var lm = link.match("/gp/product/([^/]+)/");
      if (lm) {
        linksByAsin[lm[1]] = link;
      } else {
        console.error("Match failure: " + link);
      }
    }
  }
  //console.log(linksByAsin);
  $("a").each(function(_, a) {
    var href = $(a).attr("href");
    var m = href.match("amazon\\.com/([^/]+/)?[dg]p/([^/]+)");
    if (m) {
      var asin = m[2];
      console.log("ASIN: "+asin);
      if (linksByAsin[asin]) {
        var link = linksByAsin[asin];
        console.log("Replacing link: " + link);
        $(a).attr("href", link);
      }
    } else {
      var ignore = href.match(/worldcat/) || href.match(/^#/);
      if (!ignore)
        console.log("Unmatched link: " + href);
    }
  });
}

$(document).ready(replaceLinks);

