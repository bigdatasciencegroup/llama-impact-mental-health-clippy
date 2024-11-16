import {accessibilityTree, afterDOMLoaded} from "./app/contentloaded";
import {ElementSelector} from "./app/selector";

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', afterDOMLoaded);
} else {
  afterDOMLoaded().then(r => console.log(r)).catch(e => console.error(e));
}



