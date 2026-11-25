import assert from 'node:assert/strict';
import { gidsOntdekking } from '../lib/gids-ontdekking.js';
const r = gidsOntdekking(`
<script>const x='<a href="https://gids.kadoly.com/nep">nep</a>';</script>
<!-- <a href="https://gids.kadoly.com/commentaar">commentaar</a> -->
<template><a href="https://gids.kadoly.com/template">template</a></template>
<textarea><a href="https://gids.kadoly.com/tekstveld">tekstveld</a></textarea>
<title><a href="https://gids.kadoly.com/titel">titel</a></title>
<a class="g" href="https://gids.kadoly.com/tv-meubel-breedte-berekenen"><b>Tv &amp; meubel</b></a>
<a rel='nofollow sponsored' href='https://gids.kadoly.com/dressoir'>Kast</a>
<a href=//gids.kadoly.com/ hidden>Verborgen</a>
<a href="https://gids.kadoly.com.evil.example/">ander domein</a>
<a href="https://gids.kadoly.com@evil.example/">ander domein</a>
<a href="https://gids.kadoly.com/lees?x=1&amp;y=2">Lees</a>
Sitemap: https://kadoly.com/sitemap.xml
Sitemap: https://gids.kadoly.com/sitemap.xml
`);
assert.equal(r.gidsLinks.length, 4);
assert.equal(r.gidsLinks[0].tekst, 'Tv & meubel');
assert.equal(r.gidsLinks[0].volgbaar, true);
assert.equal(r.gidsLinks[1].volgbaar, false);
assert.equal(r.gidsLinks[2].volgbaar, false);
assert.equal(r.gidsLinks[3].url, 'https://gids.kadoly.com/lees?x=1&y=2');
assert.equal(r.gidsSitemapInRobots, false);
const robots = s => gidsOntdekking(s, 'https://kadoly.com/robots.txt', {contentType:'text/plain; charset=utf-8'});
assert.equal(robots('Sitemap: https://gids.kadoly.com/sitemap.xml').gidsSitemapInRobots, true);
assert.equal(gidsOntdekking('Sitemap: https://gids.kadoly.com/sitemap.xml','https://kadoly.com/robots.txt',{contentType:'text/html'}).gidsSitemapInRobots, false);
assert.equal(gidsOntdekking('# Sitemap: https://gids.kadoly.com/sitemap.xml').gidsSitemapInRobots, false);
assert.equal(gidsOntdekking('Sitemap: https://gids.kadoly.com.evil.example/sitemap.xml').gidsSitemapInRobots, false);
assert.equal(gidsOntdekking('<a href="/shop">winkel</a>').gidsLinks.length, 0);
console.log('Gidsontdekking: echte HTML-links, rel, robots en uitsluiting script/commentaar/domeinmisleiding geslaagd.');
