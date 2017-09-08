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

  function replaceLinks() {
    var selectedHost = amazonHostsByCountry[_selectedCountryCode];
    var replacementHost = addAmazonHostPrefix(selectedHost);
    $("a").each(function(_, a) {
      var $a = $(a);
      var href = $a.attr("sourcehref");
      if (!href) {
        href = $a.attr("href");
        $a.attr("sourcehref", href);
      }
      var lk = parseAmazonLink(href);
      if (lk) {
        var link = _aaLinksByHost[selectedHost][lk.asin];
        if (link) {
          //console.log("Replacing link: " + link);
          $a.attr("href", link);
        } else {
          // Use original link, but for the right country.
          //console.log("replacementHost: " + replacementHost);
          //console.log("href: " + href);
          var countryLink = href.replace(new RegExp("/[^/]*amazon\\.com/"), "/" + replacementHost+ "/");
          //console.log("countryLink: " + countryLink);
          $a.attr("href", countryLink);
          console.log("Unmatched ASIN: " + lk.asin);
        }
      } else {
        var ignore = !href.match(/amazon/) || href.match(/^#/);
        if (!ignore)
          console.log("Unmatched link: " + href);
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

  $(document).ready(onLoad);

})();

