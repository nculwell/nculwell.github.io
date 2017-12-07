---
title: Blog
---

# Blog

<div>

<img src='/assets/img/AllosaurusMnhn_TALL.jpg'
  style='
    width: auto;
    max-width: 35%;
    max-height: 20em;
    float: right;
    margin: 0;
    padding: 0;
    margin-left: 1em;
    margin-bottom: 1em;
  ' />

</div>

## Articles

<ul>
  {% for post in site.posts %}
  <li>
    <a href="{{ post.url }}">{{ post.title }}</a>
  </li>
  {% endfor %}
</ul>

{% include javascript.html %}

