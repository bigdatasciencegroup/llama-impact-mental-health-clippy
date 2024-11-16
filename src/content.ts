import {afterDOMLoaded} from "./app/contentloaded";

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', afterDOMLoaded);
} else {
  afterDOMLoaded().then(r => console.log(r)).catch(e => console.error(e));
}
