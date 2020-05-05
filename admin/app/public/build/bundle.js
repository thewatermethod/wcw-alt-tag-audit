
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        if (value != null || input.value) {
            input.value = value;
        }
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function afterUpdate(fn) {
        get_current_component().$$.after_update.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.21.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function createCommonjsModule(fn, module) {
    	return module = { exports: {} }, fn(module, module.exports), module.exports;
    }

    var purify = createCommonjsModule(function (module, exports) {
    /*! @license DOMPurify | (c) Cure53 and other contributors | Released under the Apache license 2.0 and Mozilla Public License 2.0 | github.com/cure53/DOMPurify/blob/2.0.8/LICENSE */

    (function (global, factory) {
       module.exports = factory() ;
    }(commonjsGlobal, function () {
      function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

      var hasOwnProperty = Object.hasOwnProperty,
          setPrototypeOf = Object.setPrototypeOf,
          isFrozen = Object.isFrozen,
          objectKeys = Object.keys;
      var freeze = Object.freeze,
          seal = Object.seal; // eslint-disable-line import/no-mutable-exports

      var _ref = typeof Reflect !== 'undefined' && Reflect,
          apply = _ref.apply,
          construct = _ref.construct;

      if (!apply) {
        apply = function apply(fun, thisValue, args) {
          return fun.apply(thisValue, args);
        };
      }

      if (!freeze) {
        freeze = function freeze(x) {
          return x;
        };
      }

      if (!seal) {
        seal = function seal(x) {
          return x;
        };
      }

      if (!construct) {
        construct = function construct(Func, args) {
          return new (Function.prototype.bind.apply(Func, [null].concat(_toConsumableArray(args))))();
        };
      }

      var arrayForEach = unapply(Array.prototype.forEach);
      var arrayIndexOf = unapply(Array.prototype.indexOf);
      var arrayJoin = unapply(Array.prototype.join);
      var arrayPop = unapply(Array.prototype.pop);
      var arrayPush = unapply(Array.prototype.push);
      var arraySlice = unapply(Array.prototype.slice);

      var stringToLowerCase = unapply(String.prototype.toLowerCase);
      var stringMatch = unapply(String.prototype.match);
      var stringReplace = unapply(String.prototype.replace);
      var stringIndexOf = unapply(String.prototype.indexOf);
      var stringTrim = unapply(String.prototype.trim);

      var regExpTest = unapply(RegExp.prototype.test);
      var regExpCreate = unconstruct(RegExp);

      var typeErrorCreate = unconstruct(TypeError);

      function unapply(func) {
        return function (thisArg) {
          for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
            args[_key - 1] = arguments[_key];
          }

          return apply(func, thisArg, args);
        };
      }

      function unconstruct(func) {
        return function () {
          for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
            args[_key2] = arguments[_key2];
          }

          return construct(func, args);
        };
      }

      /* Add properties to a lookup table */
      function addToSet(set, array) {
        if (setPrototypeOf) {
          // Make 'in' and truthy checks like Boolean(set.constructor)
          // independent of any properties defined on Object.prototype.
          // Prevent prototype setters from intercepting set as a this value.
          setPrototypeOf(set, null);
        }

        var l = array.length;
        while (l--) {
          var element = array[l];
          if (typeof element === 'string') {
            var lcElement = stringToLowerCase(element);
            if (lcElement !== element) {
              // Config presets (e.g. tags.js, attrs.js) are immutable.
              if (!isFrozen(array)) {
                array[l] = lcElement;
              }

              element = lcElement;
            }
          }

          set[element] = true;
        }

        return set;
      }

      /* Shallow clone an object */
      function clone(object) {
        var newObject = {};

        var property = void 0;
        for (property in object) {
          if (apply(hasOwnProperty, object, [property])) {
            newObject[property] = object[property];
          }
        }

        return newObject;
      }

      var html = freeze(['a', 'abbr', 'acronym', 'address', 'area', 'article', 'aside', 'audio', 'b', 'bdi', 'bdo', 'big', 'blink', 'blockquote', 'body', 'br', 'button', 'canvas', 'caption', 'center', 'cite', 'code', 'col', 'colgroup', 'content', 'data', 'datalist', 'dd', 'decorator', 'del', 'details', 'dfn', 'dir', 'div', 'dl', 'dt', 'element', 'em', 'fieldset', 'figcaption', 'figure', 'font', 'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'head', 'header', 'hgroup', 'hr', 'html', 'i', 'img', 'input', 'ins', 'kbd', 'label', 'legend', 'li', 'main', 'map', 'mark', 'marquee', 'menu', 'menuitem', 'meter', 'nav', 'nobr', 'ol', 'optgroup', 'option', 'output', 'p', 'picture', 'pre', 'progress', 'q', 'rp', 'rt', 'ruby', 's', 'samp', 'section', 'select', 'shadow', 'small', 'source', 'spacer', 'span', 'strike', 'strong', 'style', 'sub', 'summary', 'sup', 'table', 'tbody', 'td', 'template', 'textarea', 'tfoot', 'th', 'thead', 'time', 'tr', 'track', 'tt', 'u', 'ul', 'var', 'video', 'wbr']);

      // SVG
      var svg = freeze(['svg', 'a', 'altglyph', 'altglyphdef', 'altglyphitem', 'animatecolor', 'animatemotion', 'animatetransform', 'audio', 'canvas', 'circle', 'clippath', 'defs', 'desc', 'ellipse', 'filter', 'font', 'g', 'glyph', 'glyphref', 'hkern', 'image', 'line', 'lineargradient', 'marker', 'mask', 'metadata', 'mpath', 'path', 'pattern', 'polygon', 'polyline', 'radialgradient', 'rect', 'stop', 'style', 'switch', 'symbol', 'text', 'textpath', 'title', 'tref', 'tspan', 'video', 'view', 'vkern']);

      var svgFilters = freeze(['feBlend', 'feColorMatrix', 'feComponentTransfer', 'feComposite', 'feConvolveMatrix', 'feDiffuseLighting', 'feDisplacementMap', 'feDistantLight', 'feFlood', 'feFuncA', 'feFuncB', 'feFuncG', 'feFuncR', 'feGaussianBlur', 'feMerge', 'feMergeNode', 'feMorphology', 'feOffset', 'fePointLight', 'feSpecularLighting', 'feSpotLight', 'feTile', 'feTurbulence']);

      var mathMl = freeze(['math', 'menclose', 'merror', 'mfenced', 'mfrac', 'mglyph', 'mi', 'mlabeledtr', 'mmultiscripts', 'mn', 'mo', 'mover', 'mpadded', 'mphantom', 'mroot', 'mrow', 'ms', 'mspace', 'msqrt', 'mstyle', 'msub', 'msup', 'msubsup', 'mtable', 'mtd', 'mtext', 'mtr', 'munder', 'munderover']);

      var text = freeze(['#text']);

      var html$1 = freeze(['accept', 'action', 'align', 'alt', 'autocapitalize', 'autocomplete', 'autopictureinpicture', 'autoplay', 'background', 'bgcolor', 'border', 'capture', 'cellpadding', 'cellspacing', 'checked', 'cite', 'class', 'clear', 'color', 'cols', 'colspan', 'controls', 'controlslist', 'coords', 'crossorigin', 'datetime', 'decoding', 'default', 'dir', 'disabled', 'disablepictureinpicture', 'disableremoteplayback', 'download', 'draggable', 'enctype', 'enterkeyhint', 'face', 'for', 'headers', 'height', 'hidden', 'high', 'href', 'hreflang', 'id', 'inputmode', 'integrity', 'ismap', 'kind', 'label', 'lang', 'list', 'loading', 'loop', 'low', 'max', 'maxlength', 'media', 'method', 'min', 'minlength', 'multiple', 'muted', 'name', 'noshade', 'novalidate', 'nowrap', 'open', 'optimum', 'pattern', 'placeholder', 'playsinline', 'poster', 'preload', 'pubdate', 'radiogroup', 'readonly', 'rel', 'required', 'rev', 'reversed', 'role', 'rows', 'rowspan', 'spellcheck', 'scope', 'selected', 'shape', 'size', 'sizes', 'span', 'srclang', 'start', 'src', 'srcset', 'step', 'style', 'summary', 'tabindex', 'title', 'translate', 'type', 'usemap', 'valign', 'value', 'width', 'xmlns']);

      var svg$1 = freeze(['accent-height', 'accumulate', 'additive', 'alignment-baseline', 'ascent', 'attributename', 'attributetype', 'azimuth', 'basefrequency', 'baseline-shift', 'begin', 'bias', 'by', 'class', 'clip', 'clip-path', 'clip-rule', 'color', 'color-interpolation', 'color-interpolation-filters', 'color-profile', 'color-rendering', 'cx', 'cy', 'd', 'dx', 'dy', 'diffuseconstant', 'direction', 'display', 'divisor', 'dur', 'edgemode', 'elevation', 'end', 'fill', 'fill-opacity', 'fill-rule', 'filter', 'filterunits', 'flood-color', 'flood-opacity', 'font-family', 'font-size', 'font-size-adjust', 'font-stretch', 'font-style', 'font-variant', 'font-weight', 'fx', 'fy', 'g1', 'g2', 'glyph-name', 'glyphref', 'gradientunits', 'gradienttransform', 'height', 'href', 'id', 'image-rendering', 'in', 'in2', 'k', 'k1', 'k2', 'k3', 'k4', 'kerning', 'keypoints', 'keysplines', 'keytimes', 'lang', 'lengthadjust', 'letter-spacing', 'kernelmatrix', 'kernelunitlength', 'lighting-color', 'local', 'marker-end', 'marker-mid', 'marker-start', 'markerheight', 'markerunits', 'markerwidth', 'maskcontentunits', 'maskunits', 'max', 'mask', 'media', 'method', 'mode', 'min', 'name', 'numoctaves', 'offset', 'operator', 'opacity', 'order', 'orient', 'orientation', 'origin', 'overflow', 'paint-order', 'path', 'pathlength', 'patterncontentunits', 'patterntransform', 'patternunits', 'points', 'preservealpha', 'preserveaspectratio', 'primitiveunits', 'r', 'rx', 'ry', 'radius', 'refx', 'refy', 'repeatcount', 'repeatdur', 'restart', 'result', 'rotate', 'scale', 'seed', 'shape-rendering', 'specularconstant', 'specularexponent', 'spreadmethod', 'startoffset', 'stddeviation', 'stitchtiles', 'stop-color', 'stop-opacity', 'stroke-dasharray', 'stroke-dashoffset', 'stroke-linecap', 'stroke-linejoin', 'stroke-miterlimit', 'stroke-opacity', 'stroke', 'stroke-width', 'style', 'surfacescale', 'tabindex', 'targetx', 'targety', 'transform', 'text-anchor', 'text-decoration', 'text-rendering', 'textlength', 'type', 'u1', 'u2', 'unicode', 'values', 'viewbox', 'visibility', 'version', 'vert-adv-y', 'vert-origin-x', 'vert-origin-y', 'width', 'word-spacing', 'wrap', 'writing-mode', 'xchannelselector', 'ychannelselector', 'x', 'x1', 'x2', 'xmlns', 'y', 'y1', 'y2', 'z', 'zoomandpan']);

      var mathMl$1 = freeze(['accent', 'accentunder', 'align', 'bevelled', 'close', 'columnsalign', 'columnlines', 'columnspan', 'denomalign', 'depth', 'dir', 'display', 'displaystyle', 'encoding', 'fence', 'frame', 'height', 'href', 'id', 'largeop', 'length', 'linethickness', 'lspace', 'lquote', 'mathbackground', 'mathcolor', 'mathsize', 'mathvariant', 'maxsize', 'minsize', 'movablelimits', 'notation', 'numalign', 'open', 'rowalign', 'rowlines', 'rowspacing', 'rowspan', 'rspace', 'rquote', 'scriptlevel', 'scriptminsize', 'scriptsizemultiplier', 'selection', 'separator', 'separators', 'stretchy', 'subscriptshift', 'supscriptshift', 'symmetric', 'voffset', 'width', 'xmlns']);

      var xml = freeze(['xlink:href', 'xml:id', 'xlink:title', 'xml:space', 'xmlns:xlink']);

      // eslint-disable-next-line unicorn/better-regex
      var MUSTACHE_EXPR = seal(/\{\{[\s\S]*|[\s\S]*\}\}/gm); // Specify template detection regex for SAFE_FOR_TEMPLATES mode
      var ERB_EXPR = seal(/<%[\s\S]*|[\s\S]*%>/gm);
      var DATA_ATTR = seal(/^data-[\-\w.\u00B7-\uFFFF]/); // eslint-disable-line no-useless-escape
      var ARIA_ATTR = seal(/^aria-[\-\w]+$/); // eslint-disable-line no-useless-escape
      var IS_ALLOWED_URI = seal(/^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i // eslint-disable-line no-useless-escape
      );
      var IS_SCRIPT_OR_DATA = seal(/^(?:\w+script|data):/i);
      var ATTR_WHITESPACE = seal(/[\u0000-\u0020\u00A0\u1680\u180E\u2000-\u2029\u205f\u3000]/g // eslint-disable-line no-control-regex
      );

      var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

      function _toConsumableArray$1(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

      var getGlobal = function getGlobal() {
        return typeof window === 'undefined' ? null : window;
      };

      /**
       * Creates a no-op policy for internal use only.
       * Don't export this function outside this module!
       * @param {?TrustedTypePolicyFactory} trustedTypes The policy factory.
       * @param {Document} document The document object (to determine policy name suffix)
       * @return {?TrustedTypePolicy} The policy created (or null, if Trusted Types
       * are not supported).
       */
      var _createTrustedTypesPolicy = function _createTrustedTypesPolicy(trustedTypes, document) {
        if ((typeof trustedTypes === 'undefined' ? 'undefined' : _typeof(trustedTypes)) !== 'object' || typeof trustedTypes.createPolicy !== 'function') {
          return null;
        }

        // Allow the callers to control the unique policy name
        // by adding a data-tt-policy-suffix to the script element with the DOMPurify.
        // Policy creation with duplicate names throws in Trusted Types.
        var suffix = null;
        var ATTR_NAME = 'data-tt-policy-suffix';
        if (document.currentScript && document.currentScript.hasAttribute(ATTR_NAME)) {
          suffix = document.currentScript.getAttribute(ATTR_NAME);
        }

        var policyName = 'dompurify' + (suffix ? '#' + suffix : '');

        try {
          return trustedTypes.createPolicy(policyName, {
            createHTML: function createHTML(html$$1) {
              return html$$1;
            }
          });
        } catch (_) {
          // Policy creation failed (most likely another DOMPurify script has
          // already run). Skip creating the policy, as this will only cause errors
          // if TT are enforced.
          console.warn('TrustedTypes policy ' + policyName + ' could not be created.');
          return null;
        }
      };

      function createDOMPurify() {
        var window = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : getGlobal();

        var DOMPurify = function DOMPurify(root) {
          return createDOMPurify(root);
        };

        /**
         * Version label, exposed for easier checks
         * if DOMPurify is up to date or not
         */
        DOMPurify.version = '2.0.10';

        /**
         * Array of elements that DOMPurify removed during sanitation.
         * Empty if nothing was removed.
         */
        DOMPurify.removed = [];

        if (!window || !window.document || window.document.nodeType !== 9) {
          // Not running in a browser, provide a factory function
          // so that you can pass your own Window
          DOMPurify.isSupported = false;

          return DOMPurify;
        }

        var originalDocument = window.document;
        var removeTitle = false;

        var document = window.document;
        var DocumentFragment = window.DocumentFragment,
            HTMLTemplateElement = window.HTMLTemplateElement,
            Node = window.Node,
            NodeFilter = window.NodeFilter,
            _window$NamedNodeMap = window.NamedNodeMap,
            NamedNodeMap = _window$NamedNodeMap === undefined ? window.NamedNodeMap || window.MozNamedAttrMap : _window$NamedNodeMap,
            Text = window.Text,
            Comment = window.Comment,
            DOMParser = window.DOMParser,
            trustedTypes = window.trustedTypes;

        // As per issue #47, the web-components registry is inherited by a
        // new document created via createHTMLDocument. As per the spec
        // (http://w3c.github.io/webcomponents/spec/custom/#creating-and-passing-registries)
        // a new empty registry is used when creating a template contents owner
        // document, so we use that as our parent document to ensure nothing
        // is inherited.

        if (typeof HTMLTemplateElement === 'function') {
          var template = document.createElement('template');
          if (template.content && template.content.ownerDocument) {
            document = template.content.ownerDocument;
          }
        }

        var trustedTypesPolicy = _createTrustedTypesPolicy(trustedTypes, originalDocument);
        var emptyHTML = trustedTypesPolicy ? trustedTypesPolicy.createHTML('') : '';

        var _document = document,
            implementation = _document.implementation,
            createNodeIterator = _document.createNodeIterator,
            getElementsByTagName = _document.getElementsByTagName,
            createDocumentFragment = _document.createDocumentFragment;
        var importNode = originalDocument.importNode;


        var hooks = {};

        /**
         * Expose whether this browser supports running the full DOMPurify.
         */
        DOMPurify.isSupported = implementation && typeof implementation.createHTMLDocument !== 'undefined' && document.documentMode !== 9;

        var MUSTACHE_EXPR$$1 = MUSTACHE_EXPR,
            ERB_EXPR$$1 = ERB_EXPR,
            DATA_ATTR$$1 = DATA_ATTR,
            ARIA_ATTR$$1 = ARIA_ATTR,
            IS_SCRIPT_OR_DATA$$1 = IS_SCRIPT_OR_DATA,
            ATTR_WHITESPACE$$1 = ATTR_WHITESPACE;
        var IS_ALLOWED_URI$$1 = IS_ALLOWED_URI;

        /**
         * We consider the elements and attributes below to be safe. Ideally
         * don't add any new ones but feel free to remove unwanted ones.
         */

        /* allowed element names */

        var ALLOWED_TAGS = null;
        var DEFAULT_ALLOWED_TAGS = addToSet({}, [].concat(_toConsumableArray$1(html), _toConsumableArray$1(svg), _toConsumableArray$1(svgFilters), _toConsumableArray$1(mathMl), _toConsumableArray$1(text)));

        /* Allowed attribute names */
        var ALLOWED_ATTR = null;
        var DEFAULT_ALLOWED_ATTR = addToSet({}, [].concat(_toConsumableArray$1(html$1), _toConsumableArray$1(svg$1), _toConsumableArray$1(mathMl$1), _toConsumableArray$1(xml)));

        /* Explicitly forbidden tags (overrides ALLOWED_TAGS/ADD_TAGS) */
        var FORBID_TAGS = null;

        /* Explicitly forbidden attributes (overrides ALLOWED_ATTR/ADD_ATTR) */
        var FORBID_ATTR = null;

        /* Decide if ARIA attributes are okay */
        var ALLOW_ARIA_ATTR = true;

        /* Decide if custom data attributes are okay */
        var ALLOW_DATA_ATTR = true;

        /* Decide if unknown protocols are okay */
        var ALLOW_UNKNOWN_PROTOCOLS = false;

        /* Output should be safe for jQuery's $() factory? */
        var SAFE_FOR_JQUERY = false;

        /* Output should be safe for common template engines.
         * This means, DOMPurify removes data attributes, mustaches and ERB
         */
        var SAFE_FOR_TEMPLATES = false;

        /* Decide if document with <html>... should be returned */
        var WHOLE_DOCUMENT = false;

        /* Track whether config is already set on this instance of DOMPurify. */
        var SET_CONFIG = false;

        /* Decide if all elements (e.g. style, script) must be children of
         * document.body. By default, browsers might move them to document.head */
        var FORCE_BODY = false;

        /* Decide if a DOM `HTMLBodyElement` should be returned, instead of a html
         * string (or a TrustedHTML object if Trusted Types are supported).
         * If `WHOLE_DOCUMENT` is enabled a `HTMLHtmlElement` will be returned instead
         */
        var RETURN_DOM = false;

        /* Decide if a DOM `DocumentFragment` should be returned, instead of a html
         * string  (or a TrustedHTML object if Trusted Types are supported) */
        var RETURN_DOM_FRAGMENT = false;

        /* If `RETURN_DOM` or `RETURN_DOM_FRAGMENT` is enabled, decide if the returned DOM
         * `Node` is imported into the current `Document`. If this flag is not enabled the
         * `Node` will belong (its ownerDocument) to a fresh `HTMLDocument`, created by
         * DOMPurify. */
        var RETURN_DOM_IMPORT = false;

        /* Try to return a Trusted Type object instead of a string, retrun a string in
         * case Trusted Types are not supported  */
        var RETURN_TRUSTED_TYPE = false;

        /* Output should be free from DOM clobbering attacks? */
        var SANITIZE_DOM = true;

        /* Keep element content when removing element? */
        var KEEP_CONTENT = true;

        /* If a `Node` is passed to sanitize(), then performs sanitization in-place instead
         * of importing it into a new Document and returning a sanitized copy */
        var IN_PLACE = false;

        /* Allow usage of profiles like html, svg and mathMl */
        var USE_PROFILES = {};

        /* Tags to ignore content of when KEEP_CONTENT is true */
        var FORBID_CONTENTS = addToSet({}, ['annotation-xml', 'audio', 'colgroup', 'desc', 'foreignobject', 'head', 'iframe', 'math', 'mi', 'mn', 'mo', 'ms', 'mtext', 'noembed', 'noframes', 'plaintext', 'script', 'style', 'svg', 'template', 'thead', 'title', 'video', 'xmp']);

        /* Tags that are safe for data: URIs */
        var DATA_URI_TAGS = addToSet({}, ['audio', 'video', 'img', 'source', 'image', 'track']);

        /* Attributes safe for values like "javascript:" */
        var URI_SAFE_ATTRIBUTES = null;
        var DEFAULT_URI_SAFE_ATTRIBUTES = addToSet({}, ['alt', 'class', 'for', 'id', 'label', 'name', 'pattern', 'placeholder', 'summary', 'title', 'value', 'style', 'xmlns']);

        /* Keep a reference to config to pass to hooks */
        var CONFIG = null;

        /* Ideally, do not touch anything below this line */
        /* ______________________________________________ */

        var formElement = document.createElement('form');

        /**
         * _parseConfig
         *
         * @param  {Object} cfg optional config literal
         */
        // eslint-disable-next-line complexity
        var _parseConfig = function _parseConfig(cfg) {
          if (CONFIG && CONFIG === cfg) {
            return;
          }

          /* Shield configuration object from tampering */
          if (!cfg || (typeof cfg === 'undefined' ? 'undefined' : _typeof(cfg)) !== 'object') {
            cfg = {};
          }

          /* Set configuration parameters */
          ALLOWED_TAGS = 'ALLOWED_TAGS' in cfg ? addToSet({}, cfg.ALLOWED_TAGS) : DEFAULT_ALLOWED_TAGS;
          ALLOWED_ATTR = 'ALLOWED_ATTR' in cfg ? addToSet({}, cfg.ALLOWED_ATTR) : DEFAULT_ALLOWED_ATTR;
          URI_SAFE_ATTRIBUTES = 'ADD_URI_SAFE_ATTR' in cfg ? addToSet(clone(DEFAULT_URI_SAFE_ATTRIBUTES), cfg.ADD_URI_SAFE_ATTR) : DEFAULT_URI_SAFE_ATTRIBUTES;
          FORBID_TAGS = 'FORBID_TAGS' in cfg ? addToSet({}, cfg.FORBID_TAGS) : {};
          FORBID_ATTR = 'FORBID_ATTR' in cfg ? addToSet({}, cfg.FORBID_ATTR) : {};
          USE_PROFILES = 'USE_PROFILES' in cfg ? cfg.USE_PROFILES : false;
          ALLOW_ARIA_ATTR = cfg.ALLOW_ARIA_ATTR !== false; // Default true
          ALLOW_DATA_ATTR = cfg.ALLOW_DATA_ATTR !== false; // Default true
          ALLOW_UNKNOWN_PROTOCOLS = cfg.ALLOW_UNKNOWN_PROTOCOLS || false; // Default false
          SAFE_FOR_JQUERY = cfg.SAFE_FOR_JQUERY || false; // Default false
          SAFE_FOR_TEMPLATES = cfg.SAFE_FOR_TEMPLATES || false; // Default false
          WHOLE_DOCUMENT = cfg.WHOLE_DOCUMENT || false; // Default false
          RETURN_DOM = cfg.RETURN_DOM || false; // Default false
          RETURN_DOM_FRAGMENT = cfg.RETURN_DOM_FRAGMENT || false; // Default false
          RETURN_DOM_IMPORT = cfg.RETURN_DOM_IMPORT || false; // Default false
          RETURN_TRUSTED_TYPE = cfg.RETURN_TRUSTED_TYPE || false; // Default false
          FORCE_BODY = cfg.FORCE_BODY || false; // Default false
          SANITIZE_DOM = cfg.SANITIZE_DOM !== false; // Default true
          KEEP_CONTENT = cfg.KEEP_CONTENT !== false; // Default true
          IN_PLACE = cfg.IN_PLACE || false; // Default false
          IS_ALLOWED_URI$$1 = cfg.ALLOWED_URI_REGEXP || IS_ALLOWED_URI$$1;
          if (SAFE_FOR_TEMPLATES) {
            ALLOW_DATA_ATTR = false;
          }

          if (RETURN_DOM_FRAGMENT) {
            RETURN_DOM = true;
          }

          /* Parse profile info */
          if (USE_PROFILES) {
            ALLOWED_TAGS = addToSet({}, [].concat(_toConsumableArray$1(text)));
            ALLOWED_ATTR = [];
            if (USE_PROFILES.html === true) {
              addToSet(ALLOWED_TAGS, html);
              addToSet(ALLOWED_ATTR, html$1);
            }

            if (USE_PROFILES.svg === true) {
              addToSet(ALLOWED_TAGS, svg);
              addToSet(ALLOWED_ATTR, svg$1);
              addToSet(ALLOWED_ATTR, xml);
            }

            if (USE_PROFILES.svgFilters === true) {
              addToSet(ALLOWED_TAGS, svgFilters);
              addToSet(ALLOWED_ATTR, svg$1);
              addToSet(ALLOWED_ATTR, xml);
            }

            if (USE_PROFILES.mathMl === true) {
              addToSet(ALLOWED_TAGS, mathMl);
              addToSet(ALLOWED_ATTR, mathMl$1);
              addToSet(ALLOWED_ATTR, xml);
            }
          }

          /* Merge configuration parameters */
          if (cfg.ADD_TAGS) {
            if (ALLOWED_TAGS === DEFAULT_ALLOWED_TAGS) {
              ALLOWED_TAGS = clone(ALLOWED_TAGS);
            }

            addToSet(ALLOWED_TAGS, cfg.ADD_TAGS);
          }

          if (cfg.ADD_ATTR) {
            if (ALLOWED_ATTR === DEFAULT_ALLOWED_ATTR) {
              ALLOWED_ATTR = clone(ALLOWED_ATTR);
            }

            addToSet(ALLOWED_ATTR, cfg.ADD_ATTR);
          }

          if (cfg.ADD_URI_SAFE_ATTR) {
            addToSet(URI_SAFE_ATTRIBUTES, cfg.ADD_URI_SAFE_ATTR);
          }

          /* Add #text in case KEEP_CONTENT is set to true */
          if (KEEP_CONTENT) {
            ALLOWED_TAGS['#text'] = true;
          }

          /* Add html, head and body to ALLOWED_TAGS in case WHOLE_DOCUMENT is true */
          if (WHOLE_DOCUMENT) {
            addToSet(ALLOWED_TAGS, ['html', 'head', 'body']);
          }

          /* Add tbody to ALLOWED_TAGS in case tables are permitted, see #286, #365 */
          if (ALLOWED_TAGS.table) {
            addToSet(ALLOWED_TAGS, ['tbody']);
            delete FORBID_TAGS.tbody;
          }

          // Prevent further manipulation of configuration.
          // Not available in IE8, Safari 5, etc.
          if (freeze) {
            freeze(cfg);
          }

          CONFIG = cfg;
        };

        /**
         * _forceRemove
         *
         * @param  {Node} node a DOM node
         */
        var _forceRemove = function _forceRemove(node) {
          arrayPush(DOMPurify.removed, { element: node });
          try {
            // eslint-disable-next-line unicorn/prefer-node-remove
            node.parentNode.removeChild(node);
          } catch (_) {
            node.outerHTML = emptyHTML;
          }
        };

        /**
         * _removeAttribute
         *
         * @param  {String} name an Attribute name
         * @param  {Node} node a DOM node
         */
        var _removeAttribute = function _removeAttribute(name, node) {
          try {
            arrayPush(DOMPurify.removed, {
              attribute: node.getAttributeNode(name),
              from: node
            });
          } catch (_) {
            arrayPush(DOMPurify.removed, {
              attribute: null,
              from: node
            });
          }

          node.removeAttribute(name);
        };

        /**
         * _initDocument
         *
         * @param  {String} dirty a string of dirty markup
         * @return {Document} a DOM, filled with the dirty markup
         */
        var _initDocument = function _initDocument(dirty) {
          /* Create a HTML document */
          var doc = void 0;
          var leadingWhitespace = void 0;

          if (FORCE_BODY) {
            dirty = '<remove></remove>' + dirty;
          } else {
            /* If FORCE_BODY isn't used, leading whitespace needs to be preserved manually */
            // eslint-disable-next-line unicorn/better-regex
            var matches = stringMatch(dirty, /^[\s]+/);
            leadingWhitespace = matches && matches[0];
          }

          var dirtyPayload = trustedTypesPolicy ? trustedTypesPolicy.createHTML(dirty) : dirty;
          /* Use the DOMParser API by default, fallback later if needs be */
          try {
            doc = new DOMParser().parseFromString(dirtyPayload, 'text/html');
          } catch (_) {}

          /* Remove title to fix a mXSS bug in older MS Edge */
          if (removeTitle) {
            addToSet(FORBID_TAGS, ['title']);
          }

          /* Use createHTMLDocument in case DOMParser is not available */
          if (!doc || !doc.documentElement) {
            doc = implementation.createHTMLDocument('');
            var _doc = doc,
                body = _doc.body;

            body.parentNode.removeChild(body.parentNode.firstElementChild);
            body.outerHTML = dirtyPayload;
          }

          if (dirty && leadingWhitespace) {
            doc.body.insertBefore(document.createTextNode(leadingWhitespace), doc.body.childNodes[0] || null);
          }

          /* Work on whole document or just its body */
          return getElementsByTagName.call(doc, WHOLE_DOCUMENT ? 'html' : 'body')[0];
        };

        /* Here we test for a broken feature in Edge that might cause mXSS */
        if (DOMPurify.isSupported) {
          (function () {
            try {
              var doc = _initDocument('<x/><title>&lt;/title&gt;&lt;img&gt;');
              if (regExpTest(/<\/title/, doc.querySelector('title').innerHTML)) {
                removeTitle = true;
              }
            } catch (_) {}
          })();
        }

        /**
         * _createIterator
         *
         * @param  {Document} root document/fragment to create iterator for
         * @return {Iterator} iterator instance
         */
        var _createIterator = function _createIterator(root) {
          return createNodeIterator.call(root.ownerDocument || root, root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_COMMENT | NodeFilter.SHOW_TEXT, function () {
            return NodeFilter.FILTER_ACCEPT;
          }, false);
        };

        /**
         * _isClobbered
         *
         * @param  {Node} elm element to check for clobbering attacks
         * @return {Boolean} true if clobbered, false if safe
         */
        var _isClobbered = function _isClobbered(elm) {
          if (elm instanceof Text || elm instanceof Comment) {
            return false;
          }

          if (typeof elm.nodeName !== 'string' || typeof elm.textContent !== 'string' || typeof elm.removeChild !== 'function' || !(elm.attributes instanceof NamedNodeMap) || typeof elm.removeAttribute !== 'function' || typeof elm.setAttribute !== 'function' || typeof elm.namespaceURI !== 'string') {
            return true;
          }

          return false;
        };

        /**
         * _isNode
         *
         * @param  {Node} obj object to check whether it's a DOM node
         * @return {Boolean} true is object is a DOM node
         */
        var _isNode = function _isNode(object) {
          return (typeof Node === 'undefined' ? 'undefined' : _typeof(Node)) === 'object' ? object instanceof Node : object && (typeof object === 'undefined' ? 'undefined' : _typeof(object)) === 'object' && typeof object.nodeType === 'number' && typeof object.nodeName === 'string';
        };

        /**
         * _executeHook
         * Execute user configurable hooks
         *
         * @param  {String} entryPoint  Name of the hook's entry point
         * @param  {Node} currentNode node to work on with the hook
         * @param  {Object} data additional hook parameters
         */
        var _executeHook = function _executeHook(entryPoint, currentNode, data) {
          if (!hooks[entryPoint]) {
            return;
          }

          arrayForEach(hooks[entryPoint], function (hook) {
            hook.call(DOMPurify, currentNode, data, CONFIG);
          });
        };

        /**
         * _sanitizeElements
         *
         * @protect nodeName
         * @protect textContent
         * @protect removeChild
         *
         * @param   {Node} currentNode to check for permission to exist
         * @return  {Boolean} true if node was killed, false if left alive
         */
        // eslint-disable-next-line complexity
        var _sanitizeElements = function _sanitizeElements(currentNode) {
          var content = void 0;

          /* Execute a hook if present */
          _executeHook('beforeSanitizeElements', currentNode, null);

          /* Check if element is clobbered or can clobber */
          if (_isClobbered(currentNode)) {
            _forceRemove(currentNode);
            return true;
          }

          /* Now let's check the element's type and name */
          var tagName = stringToLowerCase(currentNode.nodeName);

          /* Execute a hook if present */
          _executeHook('uponSanitizeElement', currentNode, {
            tagName: tagName,
            allowedTags: ALLOWED_TAGS
          });

          /* Take care of an mXSS pattern using p, br inside svg, math */
          if ((tagName === 'svg' || tagName === 'math') && currentNode.querySelectorAll('p, br').length !== 0) {
            _forceRemove(currentNode);
            return true;
          }

          /* Remove element if anything forbids its presence */
          if (!ALLOWED_TAGS[tagName] || FORBID_TAGS[tagName]) {
            /* Keep content except for black-listed elements */
            if (KEEP_CONTENT && !FORBID_CONTENTS[tagName] && typeof currentNode.insertAdjacentHTML === 'function') {
              try {
                var htmlToInsert = currentNode.innerHTML;
                currentNode.insertAdjacentHTML('AfterEnd', trustedTypesPolicy ? trustedTypesPolicy.createHTML(htmlToInsert) : htmlToInsert);
              } catch (_) {}
            }

            _forceRemove(currentNode);
            return true;
          }

          /* Remove in case a noscript/noembed XSS is suspected */
          if (tagName === 'noscript' && regExpTest(/<\/noscript/i, currentNode.innerHTML)) {
            _forceRemove(currentNode);
            return true;
          }

          if (tagName === 'noembed' && regExpTest(/<\/noembed/i, currentNode.innerHTML)) {
            _forceRemove(currentNode);
            return true;
          }

          /* Convert markup to cover jQuery behavior */
          if (SAFE_FOR_JQUERY && !currentNode.firstElementChild && (!currentNode.content || !currentNode.content.firstElementChild) && regExpTest(/</g, currentNode.textContent)) {
            arrayPush(DOMPurify.removed, { element: currentNode.cloneNode() });
            if (currentNode.innerHTML) {
              currentNode.innerHTML = stringReplace(currentNode.innerHTML, /</g, '&lt;');
            } else {
              currentNode.innerHTML = stringReplace(currentNode.textContent, /</g, '&lt;');
            }
          }

          /* Sanitize element content to be template-safe */
          if (SAFE_FOR_TEMPLATES && currentNode.nodeType === 3) {
            /* Get the element's text content */
            content = currentNode.textContent;
            content = stringReplace(content, MUSTACHE_EXPR$$1, ' ');
            content = stringReplace(content, ERB_EXPR$$1, ' ');
            if (currentNode.textContent !== content) {
              arrayPush(DOMPurify.removed, { element: currentNode.cloneNode() });
              currentNode.textContent = content;
            }
          }

          /* Execute a hook if present */
          _executeHook('afterSanitizeElements', currentNode, null);

          return false;
        };

        /**
         * _isValidAttribute
         *
         * @param  {string} lcTag Lowercase tag name of containing element.
         * @param  {string} lcName Lowercase attribute name.
         * @param  {string} value Attribute value.
         * @return {Boolean} Returns true if `value` is valid, otherwise false.
         */
        // eslint-disable-next-line complexity
        var _isValidAttribute = function _isValidAttribute(lcTag, lcName, value) {
          /* Make sure attribute cannot clobber */
          if (SANITIZE_DOM && (lcName === 'id' || lcName === 'name') && (value in document || value in formElement)) {
            return false;
          }

          /* Allow valid data-* attributes: At least one character after "-"
              (https://html.spec.whatwg.org/multipage/dom.html#embedding-custom-non-visible-data-with-the-data-*-attributes)
              XML-compatible (https://html.spec.whatwg.org/multipage/infrastructure.html#xml-compatible and http://www.w3.org/TR/xml/#d0e804)
              We don't need to check the value; it's always URI safe. */
          if (ALLOW_DATA_ATTR && regExpTest(DATA_ATTR$$1, lcName)) ; else if (ALLOW_ARIA_ATTR && regExpTest(ARIA_ATTR$$1, lcName)) ; else if (!ALLOWED_ATTR[lcName] || FORBID_ATTR[lcName]) {
            return false;

            /* Check value is safe. First, is attr inert? If so, is safe */
          } else if (URI_SAFE_ATTRIBUTES[lcName]) ; else if (regExpTest(IS_ALLOWED_URI$$1, stringReplace(value, ATTR_WHITESPACE$$1, ''))) ; else if ((lcName === 'src' || lcName === 'xlink:href' || lcName === 'href') && lcTag !== 'script' && stringIndexOf(value, 'data:') === 0 && DATA_URI_TAGS[lcTag]) ; else if (ALLOW_UNKNOWN_PROTOCOLS && !regExpTest(IS_SCRIPT_OR_DATA$$1, stringReplace(value, ATTR_WHITESPACE$$1, ''))) ; else if (!value) ; else {
            return false;
          }

          return true;
        };

        /**
         * _sanitizeAttributes
         *
         * @protect attributes
         * @protect nodeName
         * @protect removeAttribute
         * @protect setAttribute
         *
         * @param  {Node} currentNode to sanitize
         */
        // eslint-disable-next-line complexity
        var _sanitizeAttributes = function _sanitizeAttributes(currentNode) {
          var attr = void 0;
          var value = void 0;
          var lcName = void 0;
          var idAttr = void 0;
          var l = void 0;
          /* Execute a hook if present */
          _executeHook('beforeSanitizeAttributes', currentNode, null);

          var attributes = currentNode.attributes;

          /* Check if we have attributes; if not we might have a text node */

          if (!attributes) {
            return;
          }

          var hookEvent = {
            attrName: '',
            attrValue: '',
            keepAttr: true,
            allowedAttributes: ALLOWED_ATTR
          };
          l = attributes.length;

          /* Go backwards over all attributes; safely remove bad ones */
          while (l--) {
            attr = attributes[l];
            var _attr = attr,
                name = _attr.name,
                namespaceURI = _attr.namespaceURI;

            value = stringTrim(attr.value);
            lcName = stringToLowerCase(name);

            /* Execute a hook if present */
            hookEvent.attrName = lcName;
            hookEvent.attrValue = value;
            hookEvent.keepAttr = true;
            hookEvent.forceKeepAttr = undefined; // Allows developers to see this is a property they can set
            _executeHook('uponSanitizeAttribute', currentNode, hookEvent);
            value = hookEvent.attrValue;
            /* Did the hooks approve of the attribute? */
            if (hookEvent.forceKeepAttr) {
              continue;
            }

            /* Remove attribute */
            // Safari (iOS + Mac), last tested v8.0.5, crashes if you try to
            // remove a "name" attribute from an <img> tag that has an "id"
            // attribute at the time.
            if (lcName === 'name' && currentNode.nodeName === 'IMG' && attributes.id) {
              idAttr = attributes.id;
              attributes = arraySlice(attributes, []);
              _removeAttribute('id', currentNode);
              _removeAttribute(name, currentNode);
              if (arrayIndexOf(attributes, idAttr) > l) {
                currentNode.setAttribute('id', idAttr.value);
              }
            } else if (
            // This works around a bug in Safari, where input[type=file]
            // cannot be dynamically set after type has been removed
            currentNode.nodeName === 'INPUT' && lcName === 'type' && value === 'file' && hookEvent.keepAttr && (ALLOWED_ATTR[lcName] || !FORBID_ATTR[lcName])) {
              continue;
            } else {
              // This avoids a crash in Safari v9.0 with double-ids.
              // The trick is to first set the id to be empty and then to
              // remove the attribute
              if (name === 'id') {
                currentNode.setAttribute(name, '');
              }

              _removeAttribute(name, currentNode);
            }

            /* Did the hooks approve of the attribute? */
            if (!hookEvent.keepAttr) {
              continue;
            }

            /* Work around a security issue in jQuery 3.0 */
            if (SAFE_FOR_JQUERY && regExpTest(/\/>/i, value)) {
              _removeAttribute(name, currentNode);
              continue;
            }

            /* Take care of an mXSS pattern using namespace switches */
            if (regExpTest(/svg|math/i, currentNode.namespaceURI) && regExpTest(regExpCreate('</(' + arrayJoin(objectKeys(FORBID_CONTENTS), '|') + ')', 'i'), value)) {
              _removeAttribute(name, currentNode);
              continue;
            }

            /* Sanitize attribute content to be template-safe */
            if (SAFE_FOR_TEMPLATES) {
              value = stringReplace(value, MUSTACHE_EXPR$$1, ' ');
              value = stringReplace(value, ERB_EXPR$$1, ' ');
            }

            /* Is `value` valid for this attribute? */
            var lcTag = currentNode.nodeName.toLowerCase();
            if (!_isValidAttribute(lcTag, lcName, value)) {
              continue;
            }

            /* Handle invalid data-* attribute set by try-catching it */
            try {
              if (namespaceURI) {
                currentNode.setAttributeNS(namespaceURI, name, value);
              } else {
                /* Fallback to setAttribute() for browser-unrecognized namespaces e.g. "x-schema". */
                currentNode.setAttribute(name, value);
              }

              arrayPop(DOMPurify.removed);
            } catch (_) {}
          }

          /* Execute a hook if present */
          _executeHook('afterSanitizeAttributes', currentNode, null);
        };

        /**
         * _sanitizeShadowDOM
         *
         * @param  {DocumentFragment} fragment to iterate over recursively
         */
        var _sanitizeShadowDOM = function _sanitizeShadowDOM(fragment) {
          var shadowNode = void 0;
          var shadowIterator = _createIterator(fragment);

          /* Execute a hook if present */
          _executeHook('beforeSanitizeShadowDOM', fragment, null);

          while (shadowNode = shadowIterator.nextNode()) {
            /* Execute a hook if present */
            _executeHook('uponSanitizeShadowNode', shadowNode, null);

            /* Sanitize tags and elements */
            if (_sanitizeElements(shadowNode)) {
              continue;
            }

            /* Deep shadow DOM detected */
            if (shadowNode.content instanceof DocumentFragment) {
              _sanitizeShadowDOM(shadowNode.content);
            }

            /* Check attributes, sanitize if necessary */
            _sanitizeAttributes(shadowNode);
          }

          /* Execute a hook if present */
          _executeHook('afterSanitizeShadowDOM', fragment, null);
        };

        /**
         * Sanitize
         * Public method providing core sanitation functionality
         *
         * @param {String|Node} dirty string or DOM node
         * @param {Object} configuration object
         */
        // eslint-disable-next-line complexity
        DOMPurify.sanitize = function (dirty, cfg) {
          var body = void 0;
          var importedNode = void 0;
          var currentNode = void 0;
          var oldNode = void 0;
          var returnNode = void 0;
          /* Make sure we have a string to sanitize.
            DO NOT return early, as this will return the wrong type if
            the user has requested a DOM object rather than a string */
          if (!dirty) {
            dirty = '<!-->';
          }

          /* Stringify, in case dirty is an object */
          if (typeof dirty !== 'string' && !_isNode(dirty)) {
            // eslint-disable-next-line no-negated-condition
            if (typeof dirty.toString !== 'function') {
              throw typeErrorCreate('toString is not a function');
            } else {
              dirty = dirty.toString();
              if (typeof dirty !== 'string') {
                throw typeErrorCreate('dirty is not a string, aborting');
              }
            }
          }

          /* Check we can run. Otherwise fall back or ignore */
          if (!DOMPurify.isSupported) {
            if (_typeof(window.toStaticHTML) === 'object' || typeof window.toStaticHTML === 'function') {
              if (typeof dirty === 'string') {
                return window.toStaticHTML(dirty);
              }

              if (_isNode(dirty)) {
                return window.toStaticHTML(dirty.outerHTML);
              }
            }

            return dirty;
          }

          /* Assign config vars */
          if (!SET_CONFIG) {
            _parseConfig(cfg);
          }

          /* Clean up removed elements */
          DOMPurify.removed = [];

          /* Check if dirty is correctly typed for IN_PLACE */
          if (typeof dirty === 'string') {
            IN_PLACE = false;
          }

          if (IN_PLACE) ; else if (dirty instanceof Node) {
            /* If dirty is a DOM element, append to an empty document to avoid
               elements being stripped by the parser */
            body = _initDocument('<!-->');
            importedNode = body.ownerDocument.importNode(dirty, true);
            if (importedNode.nodeType === 1 && importedNode.nodeName === 'BODY') {
              /* Node is already a body, use as is */
              body = importedNode;
            } else if (importedNode.nodeName === 'HTML') {
              body = importedNode;
            } else {
              // eslint-disable-next-line unicorn/prefer-node-append
              body.appendChild(importedNode);
            }
          } else {
            /* Exit directly if we have nothing to do */
            if (!RETURN_DOM && !SAFE_FOR_TEMPLATES && !WHOLE_DOCUMENT && RETURN_TRUSTED_TYPE &&
            // eslint-disable-next-line unicorn/prefer-includes
            dirty.indexOf('<') === -1) {
              return trustedTypesPolicy ? trustedTypesPolicy.createHTML(dirty) : dirty;
            }

            /* Initialize the document to work on */
            body = _initDocument(dirty);

            /* Check we have a DOM node from the data */
            if (!body) {
              return RETURN_DOM ? null : emptyHTML;
            }
          }

          /* Remove first element node (ours) if FORCE_BODY is set */
          if (body && FORCE_BODY) {
            _forceRemove(body.firstChild);
          }

          /* Get node iterator */
          var nodeIterator = _createIterator(IN_PLACE ? dirty : body);

          /* Now start iterating over the created document */
          while (currentNode = nodeIterator.nextNode()) {
            /* Fix IE's strange behavior with manipulated textNodes #89 */
            if (currentNode.nodeType === 3 && currentNode === oldNode) {
              continue;
            }

            /* Sanitize tags and elements */
            if (_sanitizeElements(currentNode)) {
              continue;
            }

            /* Shadow DOM detected, sanitize it */
            if (currentNode.content instanceof DocumentFragment) {
              _sanitizeShadowDOM(currentNode.content);
            }

            /* Check attributes, sanitize if necessary */
            _sanitizeAttributes(currentNode);

            oldNode = currentNode;
          }

          oldNode = null;

          /* If we sanitized `dirty` in-place, return it. */
          if (IN_PLACE) {
            return dirty;
          }

          /* Return sanitized string or DOM */
          if (RETURN_DOM) {
            if (RETURN_DOM_FRAGMENT) {
              returnNode = createDocumentFragment.call(body.ownerDocument);

              while (body.firstChild) {
                // eslint-disable-next-line unicorn/prefer-node-append
                returnNode.appendChild(body.firstChild);
              }
            } else {
              returnNode = body;
            }

            if (RETURN_DOM_IMPORT) {
              /*
                AdoptNode() is not used because internal state is not reset
                (e.g. the past names map of a HTMLFormElement), this is safe
                in theory but we would rather not risk another attack vector.
                The state that is cloned by importNode() is explicitly defined
                by the specs.
              */
              returnNode = importNode.call(originalDocument, returnNode, true);
            }

            return returnNode;
          }

          var serializedHTML = WHOLE_DOCUMENT ? body.outerHTML : body.innerHTML;

          /* Sanitize final string template-safe */
          if (SAFE_FOR_TEMPLATES) {
            serializedHTML = stringReplace(serializedHTML, MUSTACHE_EXPR$$1, ' ');
            serializedHTML = stringReplace(serializedHTML, ERB_EXPR$$1, ' ');
          }

          return trustedTypesPolicy && RETURN_TRUSTED_TYPE ? trustedTypesPolicy.createHTML(serializedHTML) : serializedHTML;
        };

        /**
         * Public method to set the configuration once
         * setConfig
         *
         * @param {Object} cfg configuration object
         */
        DOMPurify.setConfig = function (cfg) {
          _parseConfig(cfg);
          SET_CONFIG = true;
        };

        /**
         * Public method to remove the configuration
         * clearConfig
         *
         */
        DOMPurify.clearConfig = function () {
          CONFIG = null;
          SET_CONFIG = false;
        };

        /**
         * Public method to check if an attribute value is valid.
         * Uses last set config, if any. Otherwise, uses config defaults.
         * isValidAttribute
         *
         * @param  {string} tag Tag name of containing element.
         * @param  {string} attr Attribute name.
         * @param  {string} value Attribute value.
         * @return {Boolean} Returns true if `value` is valid. Otherwise, returns false.
         */
        DOMPurify.isValidAttribute = function (tag, attr, value) {
          /* Initialize shared config vars if necessary. */
          if (!CONFIG) {
            _parseConfig({});
          }

          var lcTag = stringToLowerCase(tag);
          var lcName = stringToLowerCase(attr);
          return _isValidAttribute(lcTag, lcName, value);
        };

        /**
         * AddHook
         * Public method to add DOMPurify hooks
         *
         * @param {String} entryPoint entry point for the hook to add
         * @param {Function} hookFunction function to execute
         */
        DOMPurify.addHook = function (entryPoint, hookFunction) {
          if (typeof hookFunction !== 'function') {
            return;
          }

          hooks[entryPoint] = hooks[entryPoint] || [];
          arrayPush(hooks[entryPoint], hookFunction);
        };

        /**
         * RemoveHook
         * Public method to remove a DOMPurify hook at a given entryPoint
         * (pops it from the stack of hooks if more are present)
         *
         * @param {String} entryPoint entry point for the hook to remove
         */
        DOMPurify.removeHook = function (entryPoint) {
          if (hooks[entryPoint]) {
            arrayPop(hooks[entryPoint]);
          }
        };

        /**
         * RemoveHooks
         * Public method to remove all DOMPurify hooks at a given entryPoint
         *
         * @param  {String} entryPoint entry point for the hooks to remove
         */
        DOMPurify.removeHooks = function (entryPoint) {
          if (hooks[entryPoint]) {
            hooks[entryPoint] = [];
          }
        };

        /**
         * RemoveAllHooks
         * Public method to remove all DOMPurify hooks
         *
         */
        DOMPurify.removeAllHooks = function () {
          hooks = {};
        };

        return DOMPurify;
      }

      var purify = createDOMPurify();

      return purify;

    }));
    //# sourceMappingURL=purify.js.map
    });

    /* src\Media.svelte generated by Svelte v3.21.0 */
    const file = "src\\Media.svelte";

    function create_fragment(ctx) {
    	let div3;
    	let div0;
    	let img;
    	let img_src_value;
    	let t0;
    	let a;
    	let t1;
    	let a_href_value;
    	let t2;
    	let div1;
    	let label;
    	let t3;
    	let label_for_value;
    	let t4;
    	let input;
    	let input_id_value;
    	let input_name_value;
    	let t5;
    	let div2;
    	let button;
    	let div3_class_value;
    	let dispose;

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div0 = element("div");
    			img = element("img");
    			t0 = space();
    			a = element("a");
    			t1 = text("View full size (opens in new tab)");
    			t2 = space();
    			div1 = element("div");
    			label = element("label");
    			t3 = text("Enter alt text below");
    			t4 = space();
    			input = element("input");
    			t5 = space();
    			div2 = element("div");
    			button = element("button");
    			button.textContent = "Add alt text";
    			if (img.src !== (img_src_value = /*picture*/ ctx[0].path)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", /*alt*/ ctx[1]);
    			attr_dev(img, "class", "svelte-vavyv7");
    			add_location(img, file, 63, 4, 1330);
    			attr_dev(a, "href", a_href_value = /*picture*/ ctx[0].large);
    			attr_dev(a, "target", "_blank");
    			add_location(a, file, 64, 4, 1368);
    			attr_dev(div0, "class", "svelte-vavyv7");
    			add_location(div0, file, 62, 2, 1319);
    			attr_dev(label, "for", label_for_value = `enter_alt_text_${/*picture*/ ctx[0].id}`);
    			add_location(label, file, 69, 4, 1484);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "id", input_id_value = `enter_alt_text_${/*picture*/ ctx[0].id}`);
    			attr_dev(input, "name", input_name_value = `enter_alt_text_${/*picture*/ ctx[0].id}`);
    			add_location(input, file, 70, 4, 1562);
    			attr_dev(div1, "class", "svelte-vavyv7");
    			add_location(div1, file, 68, 2, 1473);
    			attr_dev(button, "class", "button");
    			add_location(button, file, 77, 4, 1727);
    			attr_dev(div2, "class", "svelte-vavyv7");
    			add_location(div2, file, 76, 2, 1716);

    			attr_dev(div3, "class", div3_class_value = "" + (null_to_empty(/*isOdd*/ ctx[2]
    			? "media media--odd"
    			: "media media--even") + " svelte-vavyv7"));

    			add_location(div3, file, 61, 0, 1253);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div0);
    			append_dev(div0, img);
    			append_dev(div0, t0);
    			append_dev(div0, a);
    			append_dev(a, t1);
    			append_dev(div3, t2);
    			append_dev(div3, div1);
    			append_dev(div1, label);
    			append_dev(label, t3);
    			append_dev(div1, t4);
    			append_dev(div1, input);
    			set_input_value(input, /*alt*/ ctx[1]);
    			append_dev(div3, t5);
    			append_dev(div3, div2);
    			append_dev(div2, button);
    			if (remount) run_all(dispose);

    			dispose = [
    				listen_dev(input, "input", /*input_input_handler*/ ctx[6]),
    				listen_dev(button, "click", /*editAltText*/ ctx[3], false, false, false)
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*picture*/ 1 && img.src !== (img_src_value = /*picture*/ ctx[0].path)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*alt*/ 2) {
    				attr_dev(img, "alt", /*alt*/ ctx[1]);
    			}

    			if (dirty & /*picture*/ 1 && a_href_value !== (a_href_value = /*picture*/ ctx[0].large)) {
    				attr_dev(a, "href", a_href_value);
    			}

    			if (dirty & /*picture*/ 1 && label_for_value !== (label_for_value = `enter_alt_text_${/*picture*/ ctx[0].id}`)) {
    				attr_dev(label, "for", label_for_value);
    			}

    			if (dirty & /*picture*/ 1 && input_id_value !== (input_id_value = `enter_alt_text_${/*picture*/ ctx[0].id}`)) {
    				attr_dev(input, "id", input_id_value);
    			}

    			if (dirty & /*picture*/ 1 && input_name_value !== (input_name_value = `enter_alt_text_${/*picture*/ ctx[0].id}`)) {
    				attr_dev(input, "name", input_name_value);
    			}

    			if (dirty & /*alt*/ 2 && input.value !== /*alt*/ ctx[1]) {
    				set_input_value(input, /*alt*/ ctx[1]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { picture = {} } = $$props;
    	let { index = 0 } = $$props;

    	let { removeMedia = () => {
    		
    	} } = $$props;

    	// component scoped vars
    	let alt = "";

    	let isOdd = index % 2 === 1;

    	/**
     *
     * click handler for button
     * takes an html event, sends an ajax request to wp and saves new alt text
     *
     * */
    	const editAltText = e => {
    		const data = {
    			action: "wcw_update_alt_text",
    			nonce: wcw_alt_tags.updateAltTextNonce,
    			altText: purify.sanitize(alt),
    			media: picture.id
    		};

    		// todo - this is using jquery instead of fetch for some reason, need to fix
    		jQuery.post(wcw_alt_tags.ajaxUrl, data, response => {
    			if (response == 0 && alt != "") {
    				removeMedia(index);
    				$$invalidate(1, alt = "");
    			}
    		});
    	};

    	const writable_props = ["picture", "index", "removeMedia"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Media> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Media", $$slots, []);

    	function input_input_handler() {
    		alt = this.value;
    		$$invalidate(1, alt);
    	}

    	$$self.$set = $$props => {
    		if ("picture" in $$props) $$invalidate(0, picture = $$props.picture);
    		if ("index" in $$props) $$invalidate(4, index = $$props.index);
    		if ("removeMedia" in $$props) $$invalidate(5, removeMedia = $$props.removeMedia);
    	};

    	$$self.$capture_state = () => ({
    		DOMPurify: purify,
    		picture,
    		index,
    		removeMedia,
    		alt,
    		isOdd,
    		editAltText
    	});

    	$$self.$inject_state = $$props => {
    		if ("picture" in $$props) $$invalidate(0, picture = $$props.picture);
    		if ("index" in $$props) $$invalidate(4, index = $$props.index);
    		if ("removeMedia" in $$props) $$invalidate(5, removeMedia = $$props.removeMedia);
    		if ("alt" in $$props) $$invalidate(1, alt = $$props.alt);
    		if ("isOdd" in $$props) $$invalidate(2, isOdd = $$props.isOdd);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [picture, alt, isOdd, editAltText, index, removeMedia, input_input_handler];
    }

    class Media extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { picture: 0, index: 4, removeMedia: 5 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Media",
    			options,
    			id: create_fragment.name
    		});
    	}

    	get picture() {
    		throw new Error("<Media>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set picture(value) {
    		throw new Error("<Media>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get index() {
    		throw new Error("<Media>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set index(value) {
    		throw new Error("<Media>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get removeMedia() {
    		throw new Error("<Media>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set removeMedia(value) {
    		throw new Error("<Media>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\App.svelte generated by Svelte v3.21.0 */

    const { console: console_1 } = globals;
    const file$1 = "src\\App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[11] = list[i];
    	child_ctx[13] = i;
    	return child_ctx;
    }

    // (139:2) {#each pictures.slice(0, perPage) as picture, index}
    function create_each_block(ctx) {
    	let current;

    	const media = new Media({
    			props: {
    				picture: /*picture*/ ctx[11],
    				index: /*index*/ ctx[13],
    				removeMedia: /*removeMedia*/ ctx[3]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(media.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(media, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const media_changes = {};
    			if (dirty & /*pictures, perPage*/ 3) media_changes.picture = /*picture*/ ctx[11];
    			media.$set(media_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(media.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(media.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(media, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(139:2) {#each pictures.slice(0, perPage) as picture, index}",
    		ctx
    	});

    	return block;
    }

    // (143:2) {#if perPage < pictures.length}
    function create_if_block(ctx) {
    	let div;
    	let button;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			button = element("button");
    			button.textContent = "Load more";
    			attr_dev(button, "class", "button");
    			add_location(button, file$1, 144, 6, 2944);
    			attr_dev(div, "class", "button-wrap svelte-12lsuys");
    			add_location(div, file$1, 143, 4, 2912);
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, div, anchor);
    			append_dev(div, button);
    			if (remount) dispose();
    			dispose = listen_dev(button, "click", /*loadMore*/ ctx[2], false, false, false);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(143:2) {#if perPage < pictures.length}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div;
    	let p;
    	let t0;
    	let t1_value = /*pictures*/ ctx[0].length + "";
    	let t1;
    	let t2;
    	let t3;
    	let t4;
    	let current;
    	let each_value = /*pictures*/ ctx[0].slice(0, /*perPage*/ ctx[1]);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	let if_block = /*perPage*/ ctx[1] < /*pictures*/ ctx[0].length && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			p = element("p");
    			t0 = text("You have ");
    			t1 = text(t1_value);
    			t2 = text(" alt tags to review.");
    			t3 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t4 = space();
    			if (if_block) if_block.c();
    			attr_dev(p, "class", "svelte-12lsuys");
    			add_location(p, file$1, 136, 2, 2707);
    			attr_dev(div, "class", "widefat svelte-12lsuys");
    			add_location(div, file$1, 135, 0, 2683);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p);
    			append_dev(p, t0);
    			append_dev(p, t1);
    			append_dev(p, t2);
    			append_dev(div, t3);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			append_dev(div, t4);
    			if (if_block) if_block.m(div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if ((!current || dirty & /*pictures*/ 1) && t1_value !== (t1_value = /*pictures*/ ctx[0].length + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*pictures, perPage, removeMedia*/ 11) {
    				each_value = /*pictures*/ ctx[0].slice(0, /*perPage*/ ctx[1]);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, t4);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if (/*perPage*/ ctx[1] < /*pictures*/ ctx[0].length) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					if_block.m(div, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let pictures = [];
    	let more = true;
    	let offset = 0;
    	let perPage = 10;
    	let siteMessage = false;

    	const dispatchMessage = () => {
    		const message = siteMessage;

    		const data = {
    			action: "wcw_update_site_message",
    			nonce: wcw_alt_tags.updateSiteMessageNonce,
    			status: message
    		};

    		jQuery.post(wcw_alt_tags.ajaxUrl, data, response => {
    			console.log("message received bud");
    		});
    	};

    	const fetchMedia = () => {
    		// rest url provided via wp_localize_script
    		fetch(`${wcw_alt_tags.restUrl}?offset=${offset}`).then(res => {
    			return res.json();
    		}).then(res => {
    			// check to see we have at least 1
    			if (res.length > 0) {
    				document.cookie = "wcw_alt_clean=clean";
    			} else {
    				document.cookie = "wcw_alt_clean=dirty";
    			}

    			// check to see if we don't have at least 10
    			if (res.length < 10) {
    				more = false;
    			}

    			// sort the pic into our array
    			sortMedia(res);

    			// and then, if there is more pics, we do it again
    			if (more) {
    				offset += 10;
    				fetchMedia();
    			}
    		});
    	};

    	/**
     *  return the
     * */
    	const findPicSource = pic => {
    		if (pic.media_details.sizes) {
    			return pic.media_details.sizes.thumbnail.source_url;
    		} else {
    			return false;
    		}
    	};

    	const loadMore = () => {
    		$$invalidate(1, perPage += 10);
    	};

    	const removeMedia = index => {
    		pictures.splice(index, 1);
    		$$invalidate(0, pictures);
    	};

    	const sortMedia = picArray => {
    		picArray.forEach(pic => {
    			if (pic.alt_text == "" && pic.media_type == "image" && pic.mime_type != "image/svg+xml" && pic.mime_type != "image/tiff") {
    				var thumbnail = findPicSource(pic);

    				if (thumbnail) {
    					let picture = {
    						id: pic.id,
    						path: findPicSource(pic),
    						large: pic.source_url
    					};

    					$$invalidate(0, pictures = [...pictures, picture]);
    				}

    				if (!siteMessage) {
    					siteMessage = true;
    					dispatchMessage();
    				}
    			}
    		});
    	};

    	/***
     *
     *  lifecycle events
     *
     * */
    	onMount(() => {
    		fetchMedia();
    		document.cookie = "wcw_alt_visited=visited;max-age=31536000";
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);

    	$$self.$capture_state = () => ({
    		onMount,
    		afterUpdate,
    		Media,
    		pictures,
    		more,
    		offset,
    		perPage,
    		siteMessage,
    		dispatchMessage,
    		fetchMedia,
    		findPicSource,
    		loadMore,
    		removeMedia,
    		sortMedia
    	});

    	$$self.$inject_state = $$props => {
    		if ("pictures" in $$props) $$invalidate(0, pictures = $$props.pictures);
    		if ("more" in $$props) more = $$props.more;
    		if ("offset" in $$props) offset = $$props.offset;
    		if ("perPage" in $$props) $$invalidate(1, perPage = $$props.perPage);
    		if ("siteMessage" in $$props) siteMessage = $$props.siteMessage;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [pictures, perPage, loadMore, removeMedia];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    const app = new App({
      target: document.querySelector("#altTagRoot"),
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
