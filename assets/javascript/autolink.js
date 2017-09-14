---
layout: null
js_includes:
  - js/lib.js
---

// Convert Amazon links to AA links.

{% for js in page.js_includes %}
  {% include {{ js }} %}
{% endfor %}

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

  // Mutable state.
  var _selectedCountryCode;

  for (var c in amazonHostsByCountry) {
    hostCountries[amazonHostsByCountry[c]] = c;
  }

  function onLoad() {
    fetchLinks();
    getUserCountry();
  }

  // Proceed when all onLoad tasks are done.
  function loadComplete() {
    if (_aaLinksByHost && _userCountryCode) {
      extractLinkAsins();
      makeAmazonSelector();
      amazonSelectorChange();
    }
    window.ret = { _aaLinksByHost: _aaLinksByHost, _userCountryCode: _userCountryCode };
  }

  function getUserCountry() {
    $.ajax("https://ipinfo.io/json", {
      dataType: "json",
      success: function(data) { setUserCountry(data.country) },
      error: function(x) { perror(x); setUserCountry('us'); }
    });
  }

  function setUserCountry(countryCode) {
    _userCountryCode = countryCode.toLowerCase();
    console.log("Country: " + _userCountryCode.toUpperCase());
    loadComplete();
  }

  function fetchLinks() {
    $.ajax("/aalinks.txt", {
      dataType: "text",
      success: receiveLinks,
      error: function(err) {
        console.error(err);
        _aaLinksByHost = {};
      }
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

  function extractLinkAsins() {
    $("a").each(function(_, a) {
      var $a = $(a);
      if ($a.attr("data-asin")) {
        return; // asin is already populated
      }
      var href = $a.attr("href");
      if (!href) {
        return; // some links don't have an href (e.g. an ID-only anchor)
      }
      var azLink = parseAmazonLink(href);
      if (azLink) {
        $a.attr("data-asin", azLink.asin); // save the ASIN separately
        $a.attr("data-src-href", href); // save the original href
      } else {
        var ignore = !href.match(/amazon/);
        if (href.match(/amazon/)) {
          console.log("Link parse failure: " + href);
        }
      }
    });
    //$("a[data-asin]").after($(document.createTextNode('[A]')));
  }

  function replaceLinks() {
    var selectedHost = amazonHostsByCountry[_selectedCountryCode];
    var replacementHost = addAmazonHostPrefix(selectedHost);
    $("a[data-asin]").each(function(_, a) {
      var $a = $(a);
      var asin = $a.attr("data-asin");
      var aaLink = _aaLinksByHost[selectedHost] && _aaLinksByHost[selectedHost][asin];
      if (aaLink) {
        //console.log("Replacing link: " + aaLink);
        $a.attr("href", aaLink);
      } else {
        // Use original link, but for the right country.
        //console.log("replacementHost: " + replacementHost);
        //console.log("href: " + href);
        var srcHref = $a.attr("data-src-href");
        var countryLink = srcHref.replace(new RegExp("/[^/]*amazon\\.com/"), "/" + replacementHost+ "/");
        //console.log("countryLink: " + countryLink);
        $a.attr("href", countryLink);
        console.log("Unmatched ASIN: " + asin);
      }
    });
  }

  function parseAmazonLink(link) {
    if (link) {
      var amazonLinkPattern =
        "//([^/]+\\.)?(amazon\\.[^/]+)/([^/]+/)?(dp|gp/product)/([^/]+)";
      var match = link.match(amazonLinkPattern);
      if (match) {
        var linkHost = match[2];
        var linkAsin = match[5];
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
      //console.log("Country: " + countryCode + " / " + countryHost);
      if (_aaLinksByHost[countryHost]) {
        //console.log("Have country: " + countryCode);
        var option = $('<option/>');
        option.attr("value", countryCode);
        option.text(countryHost);
        if (countryCode == _userCountryCode) {
          option.attr("selected", "selected");
        }
        $selector.append(option);
      }
    }
    $selector.change(amazonSelectorChange);
    var $flag = $("<img/>").height(1);
    $("#amazonSelector")
      .append("<span>Amazon site: &nbsp; </span>")
      .append($selector)
      .append(' ')
      .append($flag)
      ;
    $flag.height($selector.height());
    // Repeat resize after function completes in case rendering is deferred.
    setTimeout(function() { $flag.height($selector.height()); });
  }

  function amazonSelectorChange() {
    var $opt = $("#amazonSelector select :selected");
    var $flag = $("#amazonSelector img");
    var countryCode = $opt.attr("value");
    if (countryCode) {
      $flag.attr("src", countryFlag(countryCode));
      _selectedCountryCode = countryCode;
    } else {
      _selectedCountryCode = _userCountryCode;
    }
    replaceLinks();
  }

  function addAmazonHostPrefix(host) {
    if (host == "amazon.com")
      return "smile." + host;
    else
      return "www." + host;
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

  function getTimestamp() {
    function pad(n) { if (n<10) return '0' + n; else return n; }
    var t = new Date();
    var timestamp =
      '' + t.year + '-' + pad(t.month) + '-' + pad(t.year)
      + 'T' + pad(t.hour) + ':' + pad(t.minute) + ':' + pad(t.second)
      + 'Z';
    return timestamp;
  }

  $(document).ready(onLoad);

})();

