import lunr from "/Users/zhenhuang/Documents/Note/node_modules/lunr/lunr.js";
require("/Users/zhenhuang/Documents/Note/node_modules/lunr-languages/lunr.stemmer.support.js")(lunr);
require("/Users/zhenhuang/Documents/Note/node_modules/@easyops-cn/docusaurus-search-local/dist/client/shared/lunrLanguageZh.js").lunrLanguageZh(lunr);
require("/Users/zhenhuang/Documents/Note/node_modules/lunr-languages/lunr.multi.js")(lunr);
export const removeDefaultStopWordFilter = [];
export const language = ["en","zh"];
export const searchIndexUrl = "search-index{dir}.json?_=aa875cd4";
export const searchResultLimits = 8;
export const fuzzyMatchingDistance = 1;