/* eslint-disable */

function add_script(src, async, defer, cb) {
    var script = document.createElement('script');
    script.src = src;
    script.async = !!async;
    if (defer) script.defer = !!defer;
    var head = document.head || document.getElementsByTagName('head')[0];
    if (!cb && typeof defer === 'function') {
      cb = defer;
    }

    if (typeof cb === 'function') {

      function onScriptLoaded() {
        var readyState = this.readyState; // we test for "complete" or "loaded" if on IE
        if (!readyState || /ded|te/.test(readyState)) {
          try {
            cb();
          } catch (error) {
            if (window.console && console.error) {
              console.error(error);
            }
          }
        }
      }

      script.onload = script.onerror = script.onreadystatechange = onScriptLoaded;
    }
    head.appendChild(script);
    return script;
}

function exec(script) {
  if (!window.cutsTheMustard) return;
  var s = typeof script;
  if (s === 'string') {
    try {
      add_script.apply(window, arguments);
    } catch(e) {}
  } else if (s === 'function') {
    try {
      script();
    } catch(e) {}
  } else if (script) {
    try{
      var args = Array.prototype.slice.call(arguments, 1);
      for (var i = 0; i < script.length; i++) {
        exec.apply(window, [script[i]].concat(args));
      }
    } catch(e){}
  }
}

var queued_scripts = [];
var low_priority_queue = [];

function queue(src, cb, low_priority) {
  var args = [src, true, !!low_priority, cb];

  if (!queued_scripts) {
    exec.apply(window, args);
    return;
  }

  if (low_priority) {
    low_priority_queue.push(args);
  } else {
    queued_scripts.push(args);
  }
}

function empty_queue(q) {
  var arr = q.slice(0);
  for (var i = 0; i < arr.length; i++) {
    exec.apply(window, arr[i]);
  }
}

function clear_queue() {
  empty_queue(queued_scripts);
  queued_scripts = null;
  var callback = low_priority_queue.length
                        ? low_priority_queue[low_priority_queue.length - 1][3]
                        : null;

  var done = function () {
    document.documentElement.className = document.documentElement.className + ' js-success';
  }

  var onLoaded = typeof callback !== 'function' ? done : function() {
    callback();
    done();
  }

  if (low_priority_queue.length) {
    low_priority_queue[low_priority_queue.length - 1][3] = onLoaded;
  } else {
    setTimeout(function(){onLoaded()},1);
  }

  empty_queue(low_priority_queue);
  low_priority_queue = null;
}

// Load the polyfill service with custom features. Exclude big unneeded polyfills.
// and use ?callback= to clear the queue of scripts to load
const defaultPolyfillFeatures = [
  'default-3.6',
  'matchMedia',
  'fetch|always|gated',
  'IntersectionObserver',
  'HTMLPictureElement',
  'Map|always|gated',
  'Array.from|always|gated'
];

const createPolyfillURL = features =>
  `https://cdn.polyfill.io/v2/polyfill.min.js?callback=clear_queue&features=${features.join(',')}&excludes=Symbol,Symbol.iterator,Symbol.species`;

export function init({polyfillFeatures=defaultPolyfillFeatures} = {}) {

  if (!window.cutsTheMustard) {
    window.cutsTheMustard = (typeof Function.prototype.bind !== 'undefined');
  }

  window.queue = queue;
  window.clear_queue = clear_queue;
  window.exec = exec;

  exec(function(){
    document.documentElement.className = document.documentElement.className.replace(/\bcore\b/g, [
      'enhanced'
    ].join(' '));
  });

  exec(createPolyfillURL(polyfillFeatures), true, true)
}
