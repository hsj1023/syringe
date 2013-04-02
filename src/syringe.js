/* jshint forin:true, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, 
undef:true, unused:true, curly:true, browser:true, indent:3, maxerr:50, laxcomma:true,
forin:false, curly:false */

// Array.filter polyfill (MDN)
[].filter||(Array.prototype.filter=function(c,f){if(null==this)throw new TypeError;var b=Object(this),g=b.length>>>0;if("function"!=typeof c)throw new TypeError;for(var d=[],a=0;a<g;a++)if(a in b){var e=b[a];c.call(f,e,a,b)&&d.push(e)}return d});

// Array.map polyfill (MDN)
[].map||(Array.prototype.map=function(d,f){var g,e,a;if(null==this)throw new TypeError(" this is null or not defined");var b=Object(this),h=b.length>>>0;if("function"!==typeof d)throw new TypeError(d+" is not a function");f&&(g=f);e=Array(h);for(a=0;a<h;){var c;a in b&&(c=b[a],c=d.call(g,c,a,b),e[a]=c);a++}return e});

// Array.reduce polyfill (MDN)
"function"!==typeof Array.prototype.reduce&&(Array.prototype.reduce=function(d,e){if(null===this||"undefined"===typeof this)throw new TypeError("Array.prototype.reduce called on null or undefined");if("function"!==typeof d)throw new TypeError(d+" is not a function");var a=0,f=this.length>>>0,b,c=!1;1<arguments.length&&(b=e,c=!0);for(;f>a;++a)this.hasOwnProperty(a)&&(c?b=d(b,this[a],a,this):(b=this[a],c=!0));if(!c)throw new TypeError("Reduce of empty array with no initial value");return b});

// Function.bind polyfill (MDN)
Function.prototype.bind||(Function.prototype.bind=function(b){if("function"!==typeof this)throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");var d=Array.prototype.slice.call(arguments,1),e=this,a=function(){},c=function(){return e.apply(this instanceof a&&b?this:b,d.concat(Array.prototype.slice.call(arguments)))};a.prototype=this.prototype;c.prototype=new a;return c});

// syringe.js v0.1.0 
(function () {

   "use strict";
   
   var root = this; 

   root.syringe = function (init_deps) {
      
      // Pointers and containers
      var deps       = {}
         , hasProp   = {}.hasOwnProperty
         , slice     = [].slice
         , toString  = Object.prototype.toString;

      // Patterns
      var PARAMS = /^function\s*[^\(]*\(\s*([^\)]*)\)/m
         , PARAM = /^\s*(_?)(\S+?)\1\s*$/
         , CLEAN = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
   
      // Get the name of an object type as a string
      var getType = function (obj, lc) {
         var str = toString.call(obj).slice(8, -1);
         return (lc && str.toLowerCase()) || str;
      };
   
      // Get an object from an (optional) context using delimited string notation
      var getObj = function (str, ctx, sep) {
      
         ctx = ctx || this;
         str = str.split(sep || '.');
      
         var arr = str.filter(function (num) {
            return num.length;
         }),
            obj = null;
      
         obj = arr.reduce(function (prev, curr, index, list) {
            if (prev) {
               return prev[list[index]];
            }
         }, ctx);
         return obj;
      };
   
      // Create an object within an (optional) context using delimited string notation
      var setObj = function (str, ctx, sep) {
      
         ctx = ctx || this;
         str = str.split(sep || '.');
      
         var obj, _i, _len;
         for (_i = 0, _len = str.length; _i < _len; _i++) {
            obj = str[_i];
            ctx = (ctx[obj] = ctx[obj] || {});
         }
         return ctx;
      };
   
      // Return a map of any items in the passed array that match
      // items in the dependency object
      var getDeps = function (arr) {
         var fn = function (item) { 
            return deps[item];
         };
         return arr.map(fn, this);
      };
   
      // Execute a passed function by first reconciling its arguments
      // against the dependency object and then applying any matches
      // directly
      var run = function ( /* fn, args1, args2... */ ) {
   
         var args    = slice.call(arguments)
            , fn     = args.shift()
            , argStr = fn.toString().replace(CLEAN, '').match(PARAMS);
   
         var depArr = getDeps(argStr[1].split(',').map(function (val) {
            return val.replace(PARAM, function (match, p1, p2) {
               return p2;
            });
         }));
   
         depArr.length = depArr.length - args.length;
         return fn.apply(this, depArr.concat(args));
      };
      
      deps = (getType(init_deps, true) === 'object') ? init_deps : deps;      
      
      // Public API
      return {
   
         register: function (name, dep) {
            if (getType(name, true) === 'object') {
               for (var key in name) {
                  if (!hasProp.call(name, key)) continue;
                  this.register.apply(this, [key, name[key]]);
               }
               return this;
            }         
            deps[name] = dep;
            return this;
         },
         
         bind: function (name, fn, ctx) {
            
            // Is this binding going to be assigned to a name in an optional context?
            if (getType(name, true) === 'string' && getType(fn, true) === 'function') {
            
               ctx = ctx || root;
            
               var strArr  = name.split('.')
               , objStr    = (strArr.length > 1) ? strArr.pop() : false;
               
               fn = run.bind(ctx, fn);
   
               if (objStr) {
                  setObj(strArr.join('.'), ctx)[objStr] = fn;
               } else {
                  ctx[strArr.join('.')] = fn;
                  return fn;
               }
               
            // Is this binding simply going to be returned as an anonymous function?
            } else if (getType(name, true) === 'function') {
               ctx = getType(fn, true) === 'object' ? fn : root;
               return run.bind(ctx, name);
            }
   
         },
         
         list: function () {
            return deps;    
         },
   
         get: function (str) {
            return getObj(str, deps);
         },      
         
         set: function (str, value) {
            var strArr = str.split('.'), objStr = strArr.pop();
            setObj(strArr.join('.'), deps)[objStr] = value;
            return this;
         },      
         
         remove: function (name) {
            delete deps[name];
            return this;
         }
         
      };
   };

}.call(this));