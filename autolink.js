// Convert Amazon links to AA links.

"use strict";

(function() {

  // Built-in values.
  var amazonCountriesList = [ 'us', 'uk', 'ca', 'au', 'in' ];
  var amazonHostsByCountry = {
    'us': 'amazon.com', 'uk': 'amazon.co.uk', 'au': 'amazon.com.au', 'ca': 'amazon.ca', 'in': 'amazon.in'
  };
  var hostCountries = {};
  var wikipediaCountryFlags = {
    "us": "en/a/a4/Flag_of_the_United_States.svg",
    "uk": "en/a/ae/Flag_of_the_United_Kingdom.svg",
    "au": "en/b/b9/Flag_of_Australia.svg",
    "ca": "commons/d/d9/Flag_of_Canada_%28Pantone%29.svg",
    "in": "en/4/41/Flag_of_India.svg"
  };

  // To be populated by queries.
  var _aaLinksByHost;
  var _userCountryCode;

  for (var c in amazonHostsByCountry) {
    hostCountries[amazonHostsByCountry[c]] = c;
  }

  function onLoad() {
    fetchLinks();
    getUserCountry();
  }

  function loadComplete() {
    if (_aaLinksByHost && _userCountryCode) {
      makeAmazonSelector();
      amazonSelectorChange();
    }
  }

  function getUserCountry() {
    $.ajax("http://api.hostip.info/country.php", {
      dataType: "text",
      success: setUserCountry,
      error: function(x) { perror(x); setUserCountry('us'); }
    });
  }

  function setUserCountry(countryCode) {
    _userCountryCode = countryCode.toLowerCase();
    loadComplete();
  }

  function fetchLinks() {
    $.ajax("/aalinks.txt", {
      dataType: "text",
      success: receiveLinks
    });
  }

  function receiveLinks(linksDocument) {
    var comment = /[ \t]*#[^\n]*/;
    var noComment = linksDocument.replace(comment, "");
    var links = noComment.split(/\s+/g);
    var linksByHost = {}
    for (var i = 0; i < links.length; ++i) {
      var link = links[i];
      if (link) {
        var lk = parseAmazonLink(link);
        if (lk) {
          if (!linksByHost[lk.host])
            linksByHost[lk.host] = {};
          linksByHost[lk.host][lk.asin] = link;
        } else {
          console.error("Parse failure: " + link);
        }
      }
    }
    _aaLinksByHost = linksByHost;
    loadComplete();
  }

  function replaceLinks(cont) {
    //console.log(links);
    var linksByAsin = {};
    var linkHosts = {};
    for (var i = 0; i < links.length; ++i) {
      var link = links[i];
      if (link) {
        var lk = parseAmazonLink(link);
        if (lk) {
          linksByAsin[lk.host + "/" lk.asin] = link;
          linkHosts[lk.host] = 1;
          continue;
        }
        console.error("Match failure: " + link);
      }
    }
    //console.log(linksByAsin);
    $("a").each(function(_, a) {
      var href = $(a).attr("href");
      var m = href.match("amazon\\.com/([^/]+/)?[dg]p/([^/]+)");
      if (m) {
        var asin = m[2];
        if (linksByAsin[asin]) {
          var link = linksByAsin[asin];
          //console.log("Replacing link: " + link);
          $(a).attr("href", link);
        } else {
          console.log("Unmatched ASIN: " + asin);
        }
      } else {
        var ignore = href.match(/worldcat/) || href.match(/^#/);
        if (!ignore)
          console.log("Unmatched link: " + href);
      }
    });
    cont(linkHosts);
  }

  function parseLinks() {
  }

  function parseAmazonLink(link) {
    if (link) {
      var match = link.match("^https?://([^/]+\\.)?(amazon\\.[^/]+)/gp/product/([^/]+)/");
      if (match) {
        var linkHost = match[2];
        var linkAsin = match[3];
        if (linkHost && linkAsin) {
          return { host: linkHost, asin: linkAsin }
        }
      }
    }
    return null;
  }

  function makeAmazonSelector() {
    var $selector = $('<select></select>');
    for (var i=0; i < amazonCountriesList.length; ++i) {
      var countryCode = amazonCountriesList[i];
      var countryHost = amazonHostsByCountry[countryCode];
      if (_aaLinksByHost[countryHost]) {
        var option = $('<option/>');
        option.attr("value", countryCode);
        option.text(host);
        if (countryCode == _userCountryCode) {
          option.attr("selected", "selected");
        }
      }
    }
    $selector.change(amazonSelectorChange);
    $("#amazonSelector")
      .append($("<img src="">"))
      .append(selector);
  }

  function amazonSelectorChange() {
    var $opt = $("#amazonSelector select :selected");
    var $flag = $("#amazonSelector img");
    var countryCode = $opt.attr("value");
    $flag.attr("src", countryFlag(countryCode));
    replaceLinks();
  }

  function countryFlag(countryCode) {
    var flag = wikipediaCountryFlags[countryCode.toLowerCase()];
    if (flag)
      return "https://upload.wikimedia.org/wikipedia/" + flag;
    else
      return null;
  }

  function perror(xhr) {
    if (xhr.responseText)
      console.error(xhr.responseText);
  }

  $(document).ready(onLoad);

});

