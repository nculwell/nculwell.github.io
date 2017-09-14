function markUnnamedLinks() {
  $("a").each(function(_, a) {
    if ($(a).attr("href") == $(a).text())
      $(a).addClass("unnamed-link");
  });
}
markUnnamedLinks();
