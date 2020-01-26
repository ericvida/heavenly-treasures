function iter$(a){ return a ? (a.toIterable ? a.toIterable() : a) : []; }var raf = (typeof requestAnimationFrame !== 'undefined') ? requestAnimationFrame : (function(blk) { return setTimeout(blk,1000 / 60); });

// Scheduler
class Scheduler {
	constructor(){
		var self = this;
		this.queue = [];
		this.stage = -1;
		this.batch = 0;
		this.scheduled = false;
		this.listeners = {};
		
		this.__ticker = function(e) {
			self.scheduled = false;
			return self.tick(e);
		};
	}
	
	add(item,force){
		if (force || this.queue.indexOf(item) == -1) {
			this.queue.push(item);
		}		
		if (!this.scheduled) { return this.schedule() }	}
	
	listen(ns,item){
		this.listeners[ns] || (this.listeners[ns] = new Set());
		return this.listeners[ns].add(item);
	}
	
	unlisten(ns,item){
		return this.listeners[ns] && this.listeners[ns].delete(item);
	}
	
	get promise(){
		var self = this;
		return new Promise(function(resolve) { return self.add(resolve); });
	}
	
	tick(timestamp){
		var self = this;
		var items = this.queue;
		if (!this.ts) { this.ts = timestamp; }		this.dt = timestamp - this.ts;
		this.ts = timestamp;
		this.queue = [];
		this.stage = 1;
		this.batch++;
		
		if (items.length) {
			for (let i = 0, ary = iter$(items), len = ary.length, item; i < len; i++) {
				item = ary[i];
				if (typeof item === 'string' && this.listeners[item]) {
					this.listeners[item].forEach(function(item) {
						if (item.tick instanceof Function) {
							return item.tick(self);
						} else if (item instanceof Function) {
							return item(self);
						}					});
				} else if (item instanceof Function) {
					item(this.dt,this);
				} else if (item.tick) {
					item.tick(this.dt,this);
				}			}		}		this.stage = 2;
		this.stage = this.scheduled ? 0 : -1;
		return this;
	}
	
	schedule(){
		if (!this.scheduled) {
			this.scheduled = true;
			if (this.stage == -1) {
				this.stage = 0;
			}			raf(this.__ticker);
		}		return this;
	}
}

function iter$$1(a){ return a ? (a.toIterable ? a.toIterable() : a) : []; }function extend$(target,ext){
	var descriptors = Object.getOwnPropertyDescriptors(ext);
	Object.defineProperties(target.prototype,descriptors);
	return target;
}const keyCodes = {
	esc: [27],
	tab: [9],
	enter: [13],
	space: [32],
	up: [38],
	down: [40],
	del: [8,46]
};


// only for web?
extend$(Event,{
	
	wait$mod(state,params){
		return new Promise(function(resolve) {
			return setTimeout(resolve,((params[0] instanceof Number) ? params[0] : 1000));
		});
	},
	
	sel$mod(state,params){
		return state.event.target.closest(params[0]) || false;
	},
	
	throttle$mod({handler,element,event},params){
		if (handler.throttled) { return false }		handler.throttled = true;
		let name = params[0];
		if (!((name instanceof String))) {
			name = ("in-" + (event.type || 'event'));
		}		let cl = element.classList;
		cl.add(name);
		handler.once('idle',function() {
			cl.remove(name);
			return handler.throttled = false;
		});
		return true;
	},
});


// could cache similar event handlers with the same parts
class EventHandler {
	constructor(params,closure){
		this.params = params;
		this.closure = closure;
	}
	
	getHandlerForMethod(el,name){
		if (!(el)) { return null }		return el[name] ? el : this.getHandlerForMethod(el.parentNode,name);
	}
	
	emit(name,...params){
		return imba.emit(this,name,params);
	}
	on(name,...params){
		return imba.listen(this,name,...params);
	}
	once(name,...params){
		return imba.once(this,name,...params);
	}
	un(name,...params){
		return imba.unlisten(this,name,...params);
	}
	
	async handleEvent(event){
		var target = event.target;
		var element = event.currentTarget;
		var mods = this.params;
		let commit = true; // @params.length == 0
		
		// console.log 'handle event',event.type,@params
		this.currentEvents || (this.currentEvents = new Set());
		this.currentEvents.add(event);
		
		let state = {
			element: element,
			event: event,
			modifiers: mods,
			handler: this
		};
		
		for (let val, j = 0, keys = Object.keys(mods), l = keys.length, handler; j < l; j++){
			// let handler = part
			handler = keys[j];val = mods[handler];if (handler.indexOf('~') > 0) {
				handler = handler.split('~')[0];
			}			
			let args = [event,this];
			let res = undefined;
			let context = null;
			
			// parse the arguments
			if (val instanceof Array) {
				args = val.slice();
				
				for (let i = 0, items = iter$$1(args), len = items.length, par; i < len; i++) {
					// what about fully nested arrays and objects?
					// ought to redirect this
					par = items[i];
					if (typeof par == 'string' && par[0] == '~' && par[1] == '$') {
						let name = par.slice(2);
						let chain = name.split('.');
						let value = state[chain.shift()] || event;
						
						for (let i = 0, ary = iter$$1(chain), len = ary.length, part; i < len; i++) {
							part = ary[i];
							value = value ? value[part] : undefined;
						}						
						args[i] = value;
					}				}			}			
			// console.log "handle part",i,handler,event.currentTarget
			// check if it is an array?
			if (handler == 'stop') {
				event.stopImmediatePropagation();
			} else if (handler == 'prevent') {
				event.preventDefault();
			} else if (handler == 'ctrl') {
				if (!event.ctrlKey) { break; }			} else if (handler == 'commit') {
				commit = true;
			} else if (handler == 'silence') {
				commit = false;
			} else if (handler == 'alt') {
				if (!event.altKey) { break; }			} else if (handler == 'shift') {
				if (!event.shiftKey) { break; }			} else if (handler == 'meta') {
				if (!event.metaKey) { break; }			} else if (handler == 'self') {
				if (target != element) { break; }			} else if (handler == 'once') {
				// clean up bound data as well
				element.removeEventListener(event.type,this);
			} else if (handler == 'options') {
				continue;
			} else if (keyCodes[handler]) {
				if (keyCodes[handler].indexOf(event.keyCode) < 0) {
					break;
				}			} else if (handler == 'trigger' || handler == 'emit') {
				let name = args[0];
				let detail = args[1]; // is custom event if not?
				let e = new CustomEvent(name,{bubbles: true,detail: detail}); // : Event.new(name)
				e.originalEvent = event;
				let customRes = element.dispatchEvent(e);
			} else if (typeof handler == 'string') {
				let mod = handler + '$mod';
				
				if (event[mod] instanceof Function) {
					// console.log "found modifier!",mod
					handler = mod;
					context = event;
					args = [state,args];
				} else if (handler[0] == '_') {
					handler = handler.slice(1);
					context = this.closure;
				} else {
					context = this.getHandlerForMethod(element,handler);
				}			}			
			
			if (context) {
				res = context[handler].apply(context,args);
			} else if (handler instanceof Function) {
				res = handler.apply(element,args);
			}			
			if (res && (res.then instanceof Function)) {
				if (commit) { imba.commit(); }				// TODO what if await fails?
				res = await res;
			}			
			if (res === false) {
				break;
			}			
			state.value = res;
		}		
		if (commit) { imba.commit(); }		this.currentEvents.delete(event);
		if (this.currentEvents.size == 0) {
			this.emit('idle');
		}		// what if the result is a promise
		return;
	}
}

var {Document,Node: Node$1,Text: Text$1,Comment: Comment$1,Element: Element$1,SVGElement,HTMLElement: HTMLElement$1,DocumentFragment,Event: Event$1,CustomEvent: CustomEvent$1,MouseEvent,document: document$1} = window;

function iter$$2(a){ return a ? (a.toIterable ? a.toIterable() : a) : []; }function extend$$1(target,ext){
	var descriptors = Object.getOwnPropertyDescriptors(ext);
	Object.defineProperties(target.prototype,descriptors);
	return target;
}
extend$$1(DocumentFragment,{
	
	// Called to make a documentFragment become a live fragment
	setup$(flags,options){
		this.__start = imba.document.createComment('start');
		this.__end = imba.document.createComment('end');
		
		this.__end.replaceWith$ = function(other) {
			this.parentNode.insertBefore(other,this);
			return other;
		};
		
		this.appendChild(this.__start);
		return this.appendChild(this.__end);
	},
	
	// when we for sure know that the only content should be
	// a single text node
	text$(item){
		if (!this.__text) {
			this.__text = this.insert$(item);
		} else {
			this.__text.textContent = item;
		}		return;
	},
	
	insert$(item,options,toReplace){
		if (this.__parent) {
			// if the fragment is attached to a parent
			// we can just proxy the call through
			return this.__parent.insert$(item,options,toReplace || this.__end);
		} else {
			return Element$1.prototype.insert$.call(this,item,options,toReplace || this.__end);
		}	},
	
	insertInto$(parent,before){
		if (!this.__parent) {
			this.__parent = parent;
			parent.appendChild$(this);
		}		return this;
	},
	
	replaceWith$(other,parent){
		this.__start.insertBeforeBegin$(other);
		var el = this.__start;
		while (el){
			let next = el.nextSibling;
			this.appendChild(el);
			if (el == this.__end) { break; }			el = next;
		}		
		return other;
	},
	
	appendChild$(child){
		this.__end.insertBeforeBegin$(child);
		return child;
	},
	
	removeChild$(child){
		child.parentNode && child.parentNode.removeChild(child);
		return this;
	},
	
	isEmpty$(){
		let el = this.__start;
		let end = this.__end;
		
		while (el = el.nextSibling){
			if (el == end) { break; }			if ((el instanceof Element$1) || (el instanceof Text$1)) { return false }		}		return true;
	},
});

class TagCollection {
	constructor(f,parent){
		this.__f = f;
		this.__parent = parent;
		
		if (!(f & 128) && (this instanceof KeyedTagFragment)) {
			this.__start = document$1.createComment('start');
			if (parent) { parent.appendChild$(this.__start); }		}		
		if (!(f & 256)) {
			this.__end = document$1.createComment('end');
			if (parent) { parent.appendChild$(this.__end); }		}		
		this.setup();
	}
	
	get parentContext(){
		return this.__parent;
	}
	
	appendChild$(item,index){
		// we know that these items are dom elements
		if (this.__end && this.__parent) {
			this.__end.insertBeforeBegin$(item);
		} else if (this.__parent) {
			this.__parent.appendChild(item);
		}		return;
	}
	
	replaceWith$(other){
		this.detachNodes();
		this.__end.insertBeforeBegin$(other);
		this.__parent.removeChild(this.__end);
		this.__parent = null;
		return;
	}
	
	joinBefore$(before){
		return this.insertInto$(before.parentNode,before);
	}
	
	insertInto$(parent,before){
		if (!this.__parent) {
			this.__parent = parent;
			before ? before.insertBeforeBegin$(this.__end) : parent.appendChild$(this.__end);
			this.attachNodes();
		}		return this;
	}
	
	setup(){
		return this;
	}
}
class KeyedTagFragment extends TagCollection {
	static init$(){
		return super.inherited instanceof Function && super.inherited(this);
	}
	setup(){
		this.array = [];
		this.changes = new Map();
		this.dirty = false;
		return this.$ = {};
	}
	
	push(item,idx){
		// on first iteration we can merely run through
		if (!(this.__f & 1)) {
			this.array.push(item);
			this.appendChild$(item);
			return;
		}		
		let toReplace = this.array[idx];
		
		if (toReplace === item) ; else {
			this.dirty = true;
			// if this is a new item
			let prevIndex = this.array.indexOf(item);
			let changed = this.changes.get(item);
			
			if (prevIndex === -1) {
				// should we mark the one currently in slot as removed?
				this.array.splice(idx,0,item);
				this.insertChild(item,idx);
			} else if (prevIndex === idx + 1) {
				if (toReplace) {
					this.changes.set(toReplace,-1);
				}				this.array.splice(idx,1);
			} else {
				if (prevIndex >= 0) { this.array.splice(prevIndex,1); }				this.array.splice(idx,0,item);
				this.insertChild(item,idx);
			}			
			if (changed == -1) {
				this.changes.delete(item);
			}		}		return;
	}
	
	insertChild(item,index){
		if (index > 0) {
			let other = this.array[index - 1];
			// will fail with text nodes
			other.insertAfterEnd$(item);
		} else if (this.__start) {
			this.__start.insertAfterEnd$(item);
		} else {
			this.__parent.insertAdjacentElement('afterbegin',item);
		}		return;
	}
	
	removeChild(item,index){
		// @map.delete(item)
		// what if this is a fragment or virtual node?
		if (item.parentNode == this.__parent) {
			this.__parent.removeChild(item);
		}		return;
	}
	
	attachNodes(){
		for (let i = 0, items = iter$$2(this.array), len = items.length, item; i < len; i++) {
			item = items[i];
			this.__end.insertBeforeBegin$(item);
		}		return;
	}
	
	detachNodes(){
		for (let i = 0, items = iter$$2(this.array), len = items.length, item; i < len; i++) {
			item = items[i];
			this.__parent.removeChild(item);
		}		return;
	}
	
	end$(index){
		var self = this;
		if (!(this.__f & 1)) {
			this.__f |= 1;
			return;
		}		
		if (this.dirty) {
			this.changes.forEach(function(pos,item) {
				if (pos == -1) {
					return self.removeChild(item);
				}			});
			this.changes.clear();
			this.dirty = false;
		}		
		// there are some items we should remove now
		if (this.array.length > index) {
			
			// remove the children below
			while (this.array.length > index){
				let item = this.array.pop();
				this.removeChild(item);
			}			// @array.length = index
		}		return;
	}
} KeyedTagFragment.init$();
class IndexedTagFragment extends TagCollection {
	
	static init$(){
		return super.inherited instanceof Function && super.inherited(this);
	}
	setup(){
		this.$ = [];
		return this.length = 0;
	}
	
	end$(len){
		let from = this.length;
		if (from == len || !this.__parent) { return }		let array = this.$;
		let par = this.__parent;
		
		if (from > len) {
			while (from > len){
				par.removeChild$(array[--from]);
			}		} else if (len > from) {
			while (len > from){
				this.appendChild$(array[from++]);
			}		}		this.length = len;
		return;
	}
	
	attachNodes(){
		for (let i = 0, items = iter$$2(this.$), len = items.length, item; i < len; i++) {
			item = items[i];
			if (i == this.length) { break; }			this.__end.insertBeforeBegin$(item);
		}		return;
	}
	
	detachNodes(){
		let i = 0;
		while (i < this.length){
			let item = this.$[i++];
			this.__parent.removeChild$(item);
		}		return;
	}
} IndexedTagFragment.init$();
function createLiveFragment(bitflags,options){
	var el = document$1.createDocumentFragment();
	el.setup$(bitflags,options);
	return el;
}
function createIndexedFragment(bitflags,parent){
	return new IndexedTagFragment(bitflags,parent);
}
function createKeyedFragment(bitflags,parent){
	return new KeyedTagFragment(bitflags,parent);
}

function extend$$2(target,ext){
	var descriptors = Object.getOwnPropertyDescriptors(ext);
	Object.defineProperties(target.prototype,descriptors);
	return target;
}

extend$$2(SVGElement,{
	
	flag$(str){
		this.className.baseVal = str;
		return;
	},
	
	flagSelf$(str){
		// if a tag receives flags from inside <self> we need to
		// redefine the flag-methods to later use both
		var self = this;
		this.flag$ = function(str) { return self.flagSync$(self.__extflags = str); };
		this.flagSelf$ = function(str) { return self.flagSync$(self.__ownflags = str); };
		this.className.baseVal = (this.className.baseVal || '') + ' ' + (this.__ownflags = str);
		return;
	},
	
	flagSync$(){
		return this.className.baseVal = ((this.__extflags || '') + ' ' + (this.__ownflags || ''));
	},
});

function iter$$3(a){ return a ? (a.toIterable ? a.toIterable() : a) : []; }function extend$$3(target,ext){
	var descriptors = Object.getOwnPropertyDescriptors(ext);
	Object.defineProperties(target.prototype,descriptors);
	return target;
}var customElements_;

var root = ((typeof window !== 'undefined') ? window : (((typeof global !== 'undefined') ? global : null)));

var imba$1 = {
	version: '2.0.0',
	global: root,
	ctx: null,
	document: root.document
};

root.imba = imba$1;

(customElements_ = root.customElements) || (root.customElements = {
	define: function() { return console.log('no custom elements'); },
	get: function() { return console.log('no custom elements'); }
});

imba$1.setTimeout = function(fn,ms) {
	return setTimeout(function() {
		fn();
		return imba$1.commit();
	},ms);
};

imba$1.setInterval = function(fn,ms) {
	return setInterval(function() {
		fn();
		return imba$1.commit();
	},ms);
};

imba$1.clearInterval = root.clearInterval;
imba$1.clearTimeout = root.clearTimeout;

imba$1.q$ = function (query,ctx){
	return ((ctx instanceof Element) ? ctx : document).querySelector(query);
};

imba$1.q$$ = function (query,ctx){
	return ((ctx instanceof Element) ? ctx : document).querySelectorAll(query);
};

imba$1.inlineStyles = function (styles){
	var el = document.createElement('style');
	el.textContent = styles;
	document.head.appendChild(el);
	return;
};

var dashRegex = /-./g;

imba$1.toCamelCase = function (str){
	if (str.indexOf('-') >= 0) {
		return str.replace(dashRegex,function(m) { return m.charAt(1).toUpperCase(); });
	} else {
		return str;
	}};

// Basic events - move to separate file?
var emit__ = function(event,args,node) {
	var prev;
	var cb;
	var ret;	
	while ((prev = node) && (node = node.next)){
		if (cb = node.listener) {
			if (node.path && cb[node.path]) {
				ret = args ? cb[node.path].apply(cb,args) : cb[node.path]();
			} else {
				// check if it is a method?
				ret = args ? cb.apply(node,args) : cb.call(node);
			}		}		
		if (node.times && --node.times <= 0) {
			prev.next = node.next;
			node.listener = null;
		}	}	return;
};

// method for registering a listener on object
imba$1.listen = function (obj,event,listener,path){
	var __listeners___;
	var cbs;
	var list;
	var tail;	cbs = (__listeners___ = obj.__listeners__) || (obj.__listeners__ = {});
	list = cbs[event] || (cbs[event] = {});
	tail = list.tail || (list.tail = (list.next = {}));
	tail.listener = listener;
	tail.path = path;
	list.tail = tail.next = {};
	return tail;
};

// register a listener once
imba$1.once = function (obj,event,listener){
	var tail = imba$1.listen(obj,event,listener);
	tail.times = 1;
	return tail;
};

// remove a listener
imba$1.unlisten = function (obj,event,cb,meth){
	var node;
	var prev;	var meta = obj.__listeners__;
	if (!(meta)) { return }	
	if (node = meta[event]) {
		while ((prev = node) && (node = node.next)){
			if (node == cb || node.listener == cb) {
				prev.next = node.next;
				// check for correct path as well?
				node.listener = null;
				break;
			}		}	}	return;
};

// emit event
imba$1.emit = function (obj,event,params){
	var cb;
	if (cb = obj.__listeners__) {
		if (cb[event]) { emit__(event,params,cb[event]); }		if (cb.all) { emit__(event,[event,params],cb.all); }	}	return;
};

imba$1.scheduler = new Scheduler();
imba$1.commit = function() { return imba$1.scheduler.add('render'); };
imba$1.tick = function() {
	imba$1.commit();
	return imba$1.scheduler.promise;
};

/*
DOM
*/


imba$1.mount = function (element,into){
	// automatic scheduling of element - even before
	element.__schedule = true;
	return (into || document.body).appendChild(element);
};


const CustomTagConstructors = {};

class ImbaElementRegistry {
	
	constructor(){
		this.__types = {};
	}
	
	lookup(name){
		return this.__types[name];
	}
	
	get(name,klass){
		if (!(name) || name == 'component') { return ImbaElement }		if (this.__types[name]) { return this.__types[name] }		if (klass && root[klass]) { return root[klass] }		return root.customElements.get(name) || ImbaElement;
	}
	
	create(name){
		if (this.__types[name]) {
			// TODO refactor
			return this.__types[name].create$();
		} else {
			return document.createElement(name);
		}	}
	
	define(name,klass,options){
		this.__types[name] = klass;
		if (options && options.extends) {
			CustomTagConstructors[name] = klass;
		}		
		let proto = klass.prototype;
		if (proto.render && proto.end$ == Element.prototype.end$) {
			proto.end$ = proto.render;
		}		
		root.customElements.define(name,klass);
		return klass;
	}
}
imba$1.tags = new ImbaElementRegistry();

var proxyHandler = {
	get(target,name){
		let ctx = target;
		let val = undefined;
		while (ctx && val == undefined){
			if (ctx = ctx.parentContext) {
				val = ctx[name];
			}		}		return val;
	}
};

extend$$3(Node,{
	
	get __context(){
		var context$_;
		return (context$_ = this.context$) || (this.context$ = new Proxy(this,proxyHandler));
	},
	
	get parentContext(){
		return this.up$ || this.parentNode;
	},
	
	init$(){
		return this;
	},
	
	// replace this with something else
	replaceWith$(other){
		this.parentNode.replaceChild(other,this);
		return other;
	},
	
	insertInto$(parent){
		parent.appendChild$(this);
		return this;
	},
	
	insertBefore$(el,prev){
		return this.insertBefore(el,prev);
	},
	
	insertBeforeBegin$(other){
		return this.parentNode.insertBefore(other,this);
	},
	
	insertAfterEnd$(other){
		if (this.nextSibling) {
			return this.nextSibling.insertBeforeBegin$(other);
		} else {
			return this.parentNode.appendChild(other);
		}	},
});

extend$$3(Comment,{
	// replace this with something else
	replaceWith$(other){
		if (other && other.joinBefore$) {
			other.joinBefore$(this);
		} else {
			this.parentNode.insertBefore$(other,this);
		}		// other.insertBeforeBegin$(this)
		this.parentNode.removeChild(this);
		// @parentNode.replaceChild(other,this)
		return other;
	},
});

// what if this is in a webworker?
extend$$3(Element,{
	
	emit(name,detail,o = {bubbles: true}){
		if (detail != undefined) { o.detail = detail; }		let event = new CustomEvent(name,o);
		let res = this.dispatchEvent(event);
		return event;
	},
	
	slot$(name,ctx){
		return this;
	},
	
	on$(type,mods,scope){
		
		var check = 'on$' + type;
		var handler;		
		// check if a custom handler exists for this type?
		if (this[check] instanceof Function) {
			handler = this[check](mods,scope);
		}		
		handler = new EventHandler(mods,scope);
		var capture = mods.capture;
		var passive = mods.passive;
		
		var o = capture;
		
		if (passive) {
			o = {passive: passive,capture: capture};
		}		
		this.addEventListener(type,handler,o);
		return handler;
	},
	
	// inline in files or remove all together?
	text$(item){
		this.textContent = item;
		return this;
	},
	
	insert$(item,f,prev){
		let type = typeof item;
		
		if (type === 'undefined' || item === null) {
			// what if the prev value was the same?
			if (prev && (prev instanceof Comment)) {
				return prev;
			}			
			let el = document.createComment('');
			prev ? prev.replaceWith$(el) : el.insertInto$(this);
			return el;
		}		
		// dont reinsert again
		if (item === prev) {
			return item;
		} else if (type !== 'object') {
			let res;			let txt = item;
			
			if ((f & 128) && (f & 256)) {
				// FIXME what if the previous one was not text? Possibly dangerous
				// when we set this on a fragment - it essentially replaces the whole
				// fragment?
				this.textContent = txt;
				return;
			}			
			if (prev) {
				if (prev instanceof Text) {
					prev.textContent = txt;
					return prev;
				} else {
					res = document.createTextNode(txt);
					prev.replaceWith$(res,this);
					return res;
				}			} else {
				this.appendChild$(res = document.createTextNode(txt));
				return res;
			}		} else {
			prev ? prev.replaceWith$(item,this) : item.insertInto$(this);
			return item;
		}	},
	
	flag$(str){
		this.className = str;
		return;
	},
	
	flagSelf$(str){
		// if a tag receives flags from inside <self> we need to
		// redefine the flag-methods to later use both
		var self = this;
		this.flag$ = function(str) { return self.flagSync$(self.__extflags = str); };
		this.flagSelf$ = function(str) { return self.flagSync$(self.__ownflags = str); };
		this.className = (this.className || '') + ' ' + (this.__ownflags = str);
		return;
	},
	
	flagSync$(){
		return this.className = ((this.__extflags || '') + ' ' + (this.__ownflags || ''));
	},
	
	open$(){
		return this;
	},
	
	close$(){
		return this;
	},
	
	end$(){
		if (this.render) { this.render(); }		return;
	},
	
	css$(key,value,mods){
		return this.style[key] = value;
	},
});

Element.prototype.appendChild$ = Element.prototype.appendChild;
Element.prototype.removeChild$ = Element.prototype.removeChild;
Element.prototype.insertBefore$ = Element.prototype.insertBefore;
Element.prototype.replaceChild$ = Element.prototype.replaceChild;
Element.prototype.set$ = Element.prototype.setAttribute;

imba$1.createLiveFragment = createLiveFragment;
imba$1.createIndexedFragment = createIndexedFragment;
imba$1.createKeyedFragment = createKeyedFragment;

// Create custom tag with support for scheduling and unscheduling etc

var mountedQueue;var mountedFlush = function() {
	let items = mountedQueue;
	mountedQueue = null;
	if (items) {
		for (let i = 0, ary = iter$$3(items), len = ary.length, item; i < len; i++) {
			item = ary[i];
			item.mounted$();
		}	}	return;
};


class ImbaElement extends HTMLElement {
	static init$(){
		return super.inherited instanceof Function && super.inherited(this);
	}
	constructor(){
		super();
		this.setup$();
		if (this.build) { this.build(); }	}
	
	setup$(){
		this.__slots = {};
		return this.__f = 0;
	}
	
	init$(){
		this.__f |= 1;
		return this;
	}
	
	// returns the named slot - for context
	slot$(name,ctx){
		var slots_;
		if (name == '__' && !this.render) {
			return this;
		}		
		return (slots_ = this.__slots)[name] || (slots_[name] = imba$1.createLiveFragment());
	}
	
	schedule(){
		imba$1.scheduler.listen('render',this);
		this.__f |= 64;
		return this;
	}
	
	unschedule(){
		imba$1.scheduler.unlisten('render',this);
		this.__f &= ~64;
		return this;
	}
	
	
	connectedCallback(){
		let flags = this.__f;
		
		if (flags & 16) {
			return;
		}		
		if (this.mounted instanceof Function) {
			if (!(mountedQueue)) {
				mountedQueue = [];
				Promise.resolve().then(mountedFlush);
			}			mountedQueue.unshift(this);
		}		
		if (!(flags & 1)) {
			this.init$();
		}		
		if (!(flags & 8)) {
			this.__f |= 8;
			if (this.awaken) { this.awaken(); }		}		
		if (!(flags)) {
			if (this.render) { this.render(); }		}		
		this.mount$();
		return this;
	}
	
	mount$(){
		this.__f |= 16;
		
		if (this.__schedule) { this.schedule(); }		
		if (this.mount instanceof Function) {
			let res = this.mount();
			if (res && (res.then instanceof Function)) {
				res.then(imba$1.commit);
			}		}		return this;
	}
	
	mounted$(){
		if (this.mounted instanceof Function) { this.mounted(); }		return this;
	}
	
	disconnectedCallback(){
		this.__f &= ~16;
		if (this.__f & 64) { this.unschedule(); }		if (this.unmount instanceof Function) { return this.unmount() }	}
	
	tick(){
		return this.render && this.render();
	}
	
	awaken(){
		return this.__schedule = true;
	}
} ImbaElement.init$();

root.customElements.define('imba-element',ImbaElement);


imba$1.createElement = function (name,bitflags,parent,flags,text,sfc){
	var el = document.createElement(name);
	
	if (flags) { el.className = flags; }	
	if (sfc) {
		el.setAttribute('data-' + sfc,'');
	}	
	if (text !== null) {
		el.text$(text);
	}	
	if (parent && (parent instanceof Node)) {
		el.insertInto$(parent);
	}	
	return el;
};

imba$1.createComponent = function (name,bitflags,parent,flags,text,sfc){
	// the component could have a different web-components name?
	var el = document.createElement(name);
	
	if (CustomTagConstructors[name]) {
		el = CustomTagConstructors[name].create$(el);
		el.slot$ = ImbaElement.prototype.slot$;
		el.__slots = {};
	}	
	el.up$ = parent;
	el.__f = bitflags;
	el.init$();
	
	if (text !== null) {
		el.slot$('__').text$(text);
	}	
	if (flags) { el.className = flags; }	
	if (sfc) {
		el.setAttribute('data-' + sfc,'');
	}	
	return el;
};

imba$1.createSVGElement = function (name,bitflags,parent,flags,text,sfc){
	var el = document.createElementNS("http://www.w3.org/2000/svg",name);
	if (flags) {
		{
			el.className.baseVal = flags;
		}	}	if (parent && (parent instanceof Node)) {
		el.insertInto$(parent);
	}	return el;
};

// import './intersect'

var treasures = [
	{name: "Himrei",
	image: [
		"himrei"
	],
	story: [
		"Himrei developed blindness over the last several years. He had cornea transplant in one eye in an attempt to restore his sight. It was to no avail. His body didn't not accept the transplant, and he is quite discouraged. In an environment were it's difficult enough to make a living with sight, it is nearly impossible for him. ",
		"He has dream of being self suficient, and he would like to start selling gasoline from glass bottles. We would like to fix his house to withstand rain and wind, and build an awning in front of his house, to sit outside and sell gasoline.",
		"He is unable to pay for electricity to be connected to his home, so he runs a small light and charges his phone from a battery, he needs to constantly pay to have recharged.",
		"His drinking water comes from the river, and it is extremely dirty, we would like to purchase him a filter, to supply that need.",
		"We have made several improvements to his home over the years, but the river keeps beating on it during flood season, keeping it in a constant state of disrepair. We would really like to make lasting improvements to his home, but we need some financial assistance to do that."
	],
	needs: [
		{name: "House Repairs",
		price: 800,
		done: false},
		{name: "Fan",
		price: 20,
		done: false},
		{name: "Small Solar System",
		price: 100,
		done: false},
		{name: "Water Filter",
		price: 25,
		done: true}
	],
	donors: [
		{name: "Eric Tirado",
		donation: 25},
		{name: "Joshua Lewis",
		donation: 20}
	]},
	{name: "Thiery",
	image: [
		"thiery"
	],
	story: [
		"Thiery is a key leader in one of our small groups. Her husband was injured in a logging accident, and it left her to support her husband and three children all on her own.",
		"She takes rice on loan so that she can feed her family. And she also takes fish on loan, to sell at the market, and makes marginal profit.",
		"She is currently living in a small house with her parents, and her siblings. They have over 8 peple living in one house. After she became a Christian, she dreams of having her own home, as her family smoke, drink, eat unclean meats, and party during the holidays. We would like to help her have her own place, so that she can raise her children outside of that environment, and so that she can be more independent.",
		"She already has a piece of land, and the basic structure of her home, but she still needs some materials to finish the walls and floor, and to plant a little garden to eat from, and sell produce from it at the market."
	],
	needs: [
		{name: "Wood to complete building her home",
		price: 3000,
		done: false}
	],
	donors: [
		{name: "Marilu Farfan",
		donation: 100},
		{name: "Olga Herrera Castillo",
		donation: 30},
		{name: "Edita Cabrera",
		donation: 30},
		{name: "Yohana Lorenzo",
		donation: 30},
		{name: "Amanda Lorenzo",
		donation: 30},
		{name: "Corina Lopez",
		donation: 10},
		{name: "Wilda Alvarez",
		donation: 20},
		{name: "Anonimo",
		donation: 20},
		{name: "Angelica Roque",
		donation: 5},
		{name: "Ana Muñoz",
		donation: 20},
		{name: "Yazmin Mateo",
		donation: 20},
		{name: "Melissa Morales",
		donation: 50},
		{name: "Araceli Perez",
		donation: 50},
		{name: "Marina Castillo",
		donation: 45},
		{name: "Anonimo",
		donation: 50},
		{name: "Judith Carpio",
		donation: 30},
		{name: "Miriam Dominguez",
		donation: 20},
		{name: "Ivette Figueroa",
		donation: 500}
	]},
	{name: "Azim",
	image: ["azim"],
	story: [
		"Azim loves language. Though he has only received up to a 9th grade education, he is fluent in Khmer, Cham, Malay, & English.",
		"He has been my tutor since we moved to the village. I have learned conversational Khmer with him, and I am now starting to learn the cham dialect with him.",
		"His teaching earns him about $30 a month. He makes about $10 a month from repairing bicycles. I have hired him to be my tutor, and I pay him about $180 a month.",
		"There might come a day when I may not be able to hire him, so I would like help to improve his bicycle business. He would like to increase his bicycle inventory, until it's a sustainable business.",
		"With your help, we have purchased $100 in bicycles to get him started. While he has tutoring work with me, he would like to reinvest some of his bicycles' profits into buying more bicycles."
	],
	needs: [
		{name: "New Motorcycle",
		price: 700,
		done: true},
		{name: "New tools for his bicycle repair business",
		price: 100,
		done: false},
		{name: "Initial investment to purchase 4 bicycles to repair and sell",
		price: 100,
		done: true}
	],
	donors: [
		{name: "Waleska Echevaria",
		donation: 100},
		{name: "Ivette Figueroa",
		donation: 200},
		{name: "Miguel Tirado",
		donation: 400},
		{name: "Eric Tirado",
		donation: 100}
	]}
];

imba.inlineStyles(".app-footer[data-i838b27de]{background-color:#ccc;}\n");
function extendTag$(el,cls){
	Object.defineProperties(el,Object.getOwnPropertyDescriptors(cls.prototype));
	return el;
}class AppFooterComponent extends imba.tags.get('footer','HTMLElement') {
	init$(){
		super.init$();return this.setAttribute('data-i838b27de','');
	}
	static create$(){
		return extendTag$(imba.document.createElement('footer'),this);
	}
	static init$(){
		return super.inherited instanceof Function && super.inherited(this);
	}
	render(){
		var t$0, c$0, b$0, d$0, t$1;
		t$0=this;
		t$0.open$();
		c$0 = (b$0=d$0=1,t$0.$) || (b$0=d$0=0,t$0.$={});
		((!b$0||d$0&2) && t$0.flagSelf$('app-footer'));
		b$0 || (t$1=imba.createElement('p',0,t$0,null,"100% of your donations are used to meet our friends' most urgent needs",'i838b27de'));
		t$0.close$(d$0);
		return t$0;
	}
} AppFooterComponent.init$(); imba.tags.define('app-footer',AppFooterComponent,{extends: 'footer'});

/* css scoped
.app-footer {
	background-color: #ccc;
}
*/

imba.inlineStyles(".progress-bar[data-i648b9fe5]{width:100%;background-color:var(--dark);font-family:var(--copy);font-weight:bold;}.progress[data-i648b9fe5]{background-color:var(--first);text-align:center;padding:5px;max-width:100%;}.progress.support[data-i648b9fe5]{background-color:var(--dark);color:var(--white);}\n");

class ProgressBarComponent extends imba.tags.get('component','ImbaElement') {
	init$(){
		super.init$();return this.setAttribute('data-i648b9fe5','');
	}
	render(){
		var t$0, c$0, b$0, d$0, b$$1, c$$1, b$2, d$2, v$2, t$3, v$3;
		t$0=this;
		t$0.open$();
		c$0 = (b$0=d$0=1,t$0.$) || (b$0=d$0=0,t$0.$={});
		((!b$0||d$0&2) && t$0.flagSelf$('progress-bar'));
		if (this.data > 1) {
			b$$1 = (b$2=d$2=1,c$0.b) || (b$2=d$2=0,c$0.b=b$$1=imba.createElement('div',0,null,'progress',null,'i648b9fe5'));
			b$2||(b$$1.up$=t$0);
			(v$2=("" + (this.data) + "%"),v$2===c$0.d || (b$$1.css$('width',c$0.d=v$2)));
			t$3 = c$0.e || (c$0.e = t$3=imba.createElement('span',4096,b$$1,null,null,'i648b9fe5'));
			(v$3=("" + (this.data) + "%"),v$3===c$0.f || (c$0.f_ = t$3.insert$(c$0.f=v$3,0,c$0.f_)));
		} else {
			c$$1 = (b$2=d$2=1,c$0.c) || (b$2=d$2=0,c$0.c=c$$1=imba.createElement('div',0,null,'progress support',null,'i648b9fe5'));
			b$2||(c$$1.up$=t$0);
			b$2 || (t$3=imba.createElement('span',0,c$$1,null,"Support this Goal: 0%",'i648b9fe5'));
		}
		(c$0.b$$1_ = t$0.insert$(b$$1,1024,c$0.b$$1_));
		(c$0.c$$1_ = t$0.insert$(c$$1,1024,c$0.c$$1_));		t$0.close$(d$0);
		return t$0;
	}
} imba.tags.define('progress-bar',ProgressBarComponent,{});

/* css scoped
.progress-bar {
 width: 100%;
 background-color: var(--dark);
 font-family: var(--copy);
 font-weight: bold;
}
.progress {
	background-color: var(--first);
	text-align: center;
	padding: 5px;
	max-width: 100%;
}
.progress.support {
	background-color: var(--dark);
	color: var(--white);
}

*/

imba.inlineStyles(".card{display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex;-webkit-flex-direction:column;-ms-flex-direction:column;flex-direction:column;background-color:var(--white);cursor:pointer;-webkit-transition:all 0.3s ease 0s;transition:all 0.3s ease 0s;margin-bottom:20px;}.card__image-container{width:100%;padding-top:56.25%;overflow:hidden;position:relative;}.card__image-container img{width:100%;position:absolute;top:50%;left:50%;-webkit-transform:translate(-50%,-50%);-ms-transform:translate(-50%,-50%);transform:translate(-50%,-50%);}.card__content{padding:20px;}.card__title{margin-bottom:20px;}.card__info{display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex;margin-bottom:20px;-webkit-align-self:end;-ms-flex-item-align:end;align-self:end;-webkit-align-items:center;-webkit-box-align:center;-ms-flex-align:center;align-items:center;}.done{-webkit-text-decoration:line-through;text-decoration:line-through;color:var(--dark);}.story{border:var(--black) 1px solid;border-radius:var(--spacing);background-color:var(--white);padding:30px;margin-bottom:20px;}.needs{margin-bottom:20px;}ul{padding-left:20px;}.button{background-color:var(--first);padding:5px 10px;border-radius:5px;color:var(--dark);font-weight:bold;-webkit-text-decoration:none;text-decoration:none;border:1px solid var(--var(--dark));float:right;}.button:hover{background-color:var(--dark);color:var(--first);}\n");
function iter$$4(a){ return a ? (a.toIterable ? a.toIterable() : a) : []; }var $1 = new WeakMap(), $2 = new WeakMap(), $3 = new WeakMap();

console.log(acronym);
class PersonCardComponent extends imba.tags.get('component','ImbaElement') {
	static init$(){
		
		return this;
	}
	init$(){
		super.init$();return undefined;
	}
	set sumGoal(value) {
		return $1.set(this,value);
	}
	get sumGoal() {
		return $1.has(this) ? $1.get(this) : 0;
	}
	set sumDonations(value) {
		return $2.set(this,value);
	}
	get sumDonations() {
		return $2.has(this) ? $2.get(this) : 0;
	}
	set progress(value) {
		return $3.set(this,value);
	}
	get progress() {
		return $3.has(this) ? $3.get(this) : 0;
	}
	render(){
		var t$0, c$0, b$0, d$0, t$1, k$1, c$1, t$2, b$2, d$2, v$2, b$1, d$1, v$1, t$3, k$3, c$3, t$4, b$4, d$4, c$4, v$4, v$3, k$4, t$5, k$5, b$5, d$5, c$5, v$5;
		t$0=this;
		t$0.open$();
		c$0 = (b$0=d$0=1,t$0.$) || (b$0=d$0=0,t$0.$={});
		((!b$0||d$0&2) && t$0.flagSelf$('card'));
		t$1 = c$0.b || (c$0.b = t$1 = imba.createIndexedFragment(0,t$0));
		k$1 = 0;
		c$1=t$1.$;
		for (let i = 0, items = iter$$4(this.data.needs), len = items.length, item; i < len; i++) {
			item = items[i];
			this.sumGoal += item.price;
		}t$1.end$(k$1);
		t$1 = c$0.c || (c$0.c = t$1 = imba.createIndexedFragment(0,t$0));
		k$1 = 0;
		c$1=t$1.$;
		for (let i = 0, items = iter$$4(this.data.donors), len = items.length, item; i < len; i++) {
			item = items[i];
			this.sumDonations += item.donation;
		}t$1.end$(k$1);
		this.progress = Math.floor(this.sumDonations / this.sumGoal * 100);
		b$0 || (t$1=imba.createElement('div',0,t$0,'card__image-container',null,null));
		t$2 = (b$2=d$2=1,c$0.d) || (b$2=d$2=0,c$0.d=t$2=imba.createElement('img',0,t$1,null,null,null));
		(v$2="./images/" + this.data.name + ".jpg",v$2===c$0.e || (t$2.src=c$0.e=v$2));
		b$2 || (t$2.href="person image");
		t$1 = (b$1=d$1=1,c$0.f) || (b$1=d$1=0,c$0.f=t$1=imba.createComponent('progress-bar',0,t$0,null,null,null));
		(v$1=this.progress,v$1===c$0.g || (t$1.data=c$0.g=v$1));
		b$1 || !t$1.setup || t$1.setup(d$1);
		t$1.end$(d$1);
		b$1 || t$1.insertInto$(t$0);
		b$0 || (t$1=imba.createElement('div',0,t$0,'card__content',null,null));
		t$2 = c$0.h || (c$0.h = t$2=imba.createElement('h1',4096,t$1,'card__title',null,null));
		(v$2=this.data.name,v$2===c$0.i || (c$0.i_ = t$2.insert$(c$0.i=v$2,0,c$0.i_)));
		t$2 = c$0.j || (c$0.j = t$2=imba.createElement('div',2048,t$1,'story',null,null));
		t$3 = c$0.k || (c$0.k = t$3 = imba.createIndexedFragment(0,t$2));
		k$3 = 0;
		c$3=t$3.$;
		for (let i = 0, items = iter$$4(this.data.story), len = items.length, item; i < len; i++) {
			item = items[i];
			t$4 = (b$4=d$4=1,c$3[k$3]) || (b$4=d$4=0,c$3[k$3] = t$4=imba.createElement('p',4096,t$3,null,null,null));
			b$4||(t$4.up$=t$3);
			c$4=t$4.$l || (t$4.$l={});
			(v$4=item,v$4===c$4.m || (c$4.m_ = t$4.insert$(c$4.m=v$4,0,c$4.m_)));
			k$3++;
		}t$3.end$(k$3);
		b$0 || (t$2=imba.createElement('div',0,t$1,'needs',null,null));
		t$3 = c$0.n || (c$0.n = t$3=imba.createElement('h3',4096,t$2,null,null,null));
		(v$3=("" + (this.data.name) + "'s needs"),v$3===c$0.o || (c$0.o_ = t$3.insert$(c$0.o=v$3,0,c$0.o_)));
		t$3 = c$0.p || (c$0.p = t$3=imba.createElement('ul',2048,t$2,null,null,null));
		t$4 = c$0.q || (c$0.q = t$4 = imba.createKeyedFragment(1024,t$3));
		k$4 = 0;
		c$4=t$4.$;
		for (let i = 0, items = iter$$4(this.data.needs), len = items.length, item; i < len; i++) {
			// If project is completed add class of yes.
			item = items[i];
			if (item.done === true) {
				k$5='r$' + k$4;
				t$5 = (b$5=d$5=1,c$4[k$5]) || (b$5=d$5=0,c$4[k$5] = t$5=imba.createElement('li',4096,t$4,'done',null,null));
				b$5||(t$5.up$=t$4);
				c$5=t$5.$r || (t$5.$r={});
				(v$5=item.name + " $" + item.price,v$5===c$5.s || (c$5.s_ = t$5.insert$(c$5.s=v$5,0,c$5.s_)));
				t$4.push(t$5,k$4++,k$5);
			} else {
				k$5='t$' + k$4;
				t$5 = (b$5=d$5=1,c$4[k$5]) || (b$5=d$5=0,c$4[k$5] = t$5=imba.createElement('li',4096,t$4,null,null,null));
				b$5||(t$5.up$=t$4);
				c$5=t$5.$t || (t$5.$t={});
				(v$5=item.name + " $" + item.price,v$5===c$5.u || (c$5.u_ = t$5.insert$(c$5.u=v$5,0,c$5.u_)));
				t$4.push(t$5,k$4++,k$5);
			}		}t$4.end$(k$4);
		b$0 || (t$3=imba.createElement('b',0,t$2,null,"Total Goal: ",null));
		t$3 = c$0.v || (c$0.v = t$3=imba.createElement('span',4096,t$2,null,null,null));
		(v$3="$" + this.sumGoal,v$3===c$0.w || (c$0.w_ = t$3.insert$(c$0.w=v$3,0,c$0.w_)));
		b$0 || (t$2=imba.createElement('div',0,t$1,'card__donors',null,null));
		b$0 || (t$3=imba.createElement('h3',0,t$2,null,"Donors",null));
		t$3 = c$0.x || (c$0.x = t$3=imba.createElement('div',2048,t$2,null,null,null));
		t$4 = c$0.y || (c$0.y = t$4 = imba.createIndexedFragment(0,t$3));
		k$4 = 0;
		c$4=t$4.$;
		for (let i = 0, items = iter$$4(this.data.donors), len = items.length, item; i < len; i++) {
			item = items[i];
			t$5 = (b$5=d$5=1,c$4[k$4]) || (b$5=d$5=0,c$4[k$4] = t$5=imba.createElement('span',4096,t$4,null,null,null));
			b$5||(t$5.up$=t$4);
			c$5=t$5.$z || (t$5.$z={});
			(v$5=item.name.match(/\b(\w)/g).join('.').toUpperCase() + ". $" + item.donation + ", ",v$5===c$5.aa || (c$5.aa_ = t$5.insert$(c$5.aa=v$5,0,c$5.aa_)));
			k$4++;
		}t$4.end$(k$4);
		b$0 || (t$3=imba.createElement('p',0,t$2,null,null,null));
		b$0 || (t$4=imba.createElement('b',0,t$3,null,"Total Donations: ",null));
		t$4 = c$0.ab || (c$0.ab = t$4=imba.createElement('span',4096,t$3,null,null,null));
		(v$4="$" + this.sumDonations,v$4===c$0.ac || (c$0.ac_ = t$4.insert$(c$0.ac=v$4,0,c$0.ac_)));
		t$2 = (b$2=d$2=1,c$0.ad) || (b$2=d$2=0,c$0.ad=t$2=imba.createElement('a',4096,t$1,'button',null,null));
		(v$2=("mailto:tiradomission@gmail.com?subject=I would like to support " + (this.data.name.charAt(0).toUpperCase() + this.data.name.slice(1)) + "!&body=Hello my name is NAME,%0D%0AI would like to support " + (this.data.name) + " with AMOUNT."),v$2===c$0.ae || (t$2.href=c$0.ae=v$2));
		(v$2=("SUPPORT " + this.data.name.toUpperCase() + " DIRECTLY"),v$2===c$0.af || (c$0.af_ = t$2.insert$(c$0.af=v$2,0,c$0.af_)));
		t$0.close$(d$0);
		return t$0;
	}
} PersonCardComponent.init$(); imba.tags.define('person-card',PersonCardComponent,{});
/* css
.card {
	display: flex;
	flex-direction: column;
	background-color: var(--white);
	cursor: pointer;
	transition: all 0.3s ease 0s;
	margin-bottom: 20px;
}
.card__image-container {
	width: 100%;
	padding-top: 56.25%;
	overflow: hidden;
	position: relative;
}
.card__image-container img {
	width: 100%;
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
}
.card__content {
	padding: 20px;
}
.card__title {
	margin-bottom: 20px;
}
.card__info {
	display: flex;
	margin-bottom: 20px;
	align-self: end;
	align-items: center;
}
.done {
	text-decoration: line-through;
	color: var(--dark)
}
.story {
	border: var(--black) 1px solid;
	border-radius: var(--spacing);
	background-color: var(--white);
	padding: 30px;
	margin-bottom: 20px;
}
.needs {
	margin-bottom: 20px;
}
ul {
	padding-left: 20px;
}
.button {
	background-color: var(--first);
	padding: 5px 10px;
	border-radius: 5px;
	color: var(--dark);
	font-weight: bold;
	text-decoration: none;
	border: 1px solid var(--var(--dark));
	float: right;
}
.button:hover {
	background-color: var(--dark);
	color: var(--first);
}

*/

imba.inlineStyles(".app-header nav{background-color:var(--black);color:var(--white);display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex;-webkit-box-pack:space-around;-webkit-justify-content:space-around;-ms-flex-pack:space-around;justify-content:space-around;}nav a{color:white;-webkit-text-decoration:none;text-decoration:none;text-transform:uppercase;font-family:var(--heading);}.app-header nav a{padding:15px;-webkit-flex:1fr;-ms-flex:1fr;flex:1fr;}.app-header nav a:hover{background-color:var(--dark);padding:15px;-webkit-flex:1fr;-ms-flex:1fr;flex:1fr;}\n");
function extendTag$$1(el,cls){
	Object.defineProperties(el,Object.getOwnPropertyDescriptors(cls.prototype));
	return el;
}class AppHeaderComponent extends imba.tags.get('header','HTMLElement') {
	static create$(){
		return extendTag$$1(imba.document.createElement('header'),this);
	}
	static init$(){
		return super.inherited instanceof Function && super.inherited(this);
	}
	render(){
		var t$0, c$0, b$0, d$0, t$1, t$2;
		t$0=this;
		t$0.open$();
		c$0 = (b$0=d$0=1,t$0.$) || (b$0=d$0=0,t$0.$={});
		((!b$0||d$0&2) && t$0.flagSelf$('app-header'));
		b$0 || (t$1=imba.createElement('nav',0,t$0,null,null,null));
		b$0 || (t$2=imba.createElement('a',0,t$1,null,"home",null));
		b$0 || (t$2.href="/public");
		b$0 || (t$2=imba.createElement('a',0,t$1,null,"donate",null));
		b$0 || (t$2=imba.createElement('a',0,t$1,null,"about",null));
		t$0.close$(d$0);
		return t$0;
	}
} AppHeaderComponent.init$(); imba.tags.define('app-header',AppHeaderComponent,{extends: 'header'});

/* css
.app-header nav {
  background-color: var(--black);
  color: var(--white);
  display: flex;
  justify-content: space-around;
}
nav a {
  color: white;
  text-decoration: none;
  text-transform: uppercase;
  font-family: var(--heading);
}

.app-header nav a {
  padding: 15px;
  flex: 1fr;
}

.app-header nav a:hover {
  background-color: var(--dark);
  padding: 15px;
  flex: 1fr;
}

*/

imba.inlineStyles(":root{--first:#f4d35d;--second:#9fd356;--third:#0B7A75;--fourth:#684756;--gray:#f0f0f0;--dark:#626262;--black:#232324;--white:#fafffd;--spacing:10px;--heading:'Noto Serif',serif;--body:'Open Sans',sans-serif;}*{box-sizing:border-box;padding:0;margin:0;-webkit-scroll-behavior:smooth;-moz-scroll-behavior:smooth;-ms-scroll-behavior:smooth;scroll-behavior:smooth;}html{-webkit-scroll-behavior:smooth;-moz-scroll-behavior:smooth;-ms-scroll-behavior:smooth;scroll-behavior:smooth;}body{background-color:var(--dark);}body *{margin:0;}.content-wrapper{max-width:1200px;margin:0 auto;background-color:var(--gray);}h1,h2,h3,h4,h5,h6{font-family:'Noto Serif',serif;font-weight:bold;color:var(--third);}p,div,span{font-family:'Open Sans',sans-serif;}p{margin-bottom:var(--spacing);}a{color:var(--fourth);}\n.parent[data-i73e8ed81]{background-color:var(--gray);display:grid;padding:10px;grid-template-columns:minmax(100px,200px) minmax(300px,1fr) 300px;grid-template-rows:1fr;grid-column-gap:10px;grid-row-gap:10px;position:relative;}.welcome[data-i73e8ed81]{padding:var(--spacing);background-color:white;position:-webkit-sticky;position:sticky;font-size:.8rem;}aside[data-i73e8ed81]{grid-area:1 / 1 / 6 / 2;}.sticky[data-i73e8ed81]{position:-webkit-sticky;position:sticky;top:0;}.img__container[data-i73e8ed81]{width:100%;display:block;height:auto;position:relative;overflow:hidden;padding:55% 0 0 0;}.img__container img[data-i73e8ed81]{display:block;width:100%;height:auto;position:absolute;top:0;left:0;}main[data-i73e8ed81]{-webkit-scroll-behavior:smooth;-moz-scroll-behavior:smooth;-ms-scroll-behavior:smooth;scroll-behavior:smooth;display:grid;}\n");
function iter$$5(a){ return a ? (a.toIterable ? a.toIterable() : a) : []; }
class HeavenlyTreasuresComponent extends imba.tags.get('component','ImbaElement') {
	init$(){
		super.init$();return this.setAttribute('data-i73e8ed81','');
	}
	render(){
		var t$0, c$0, b$0, d$0, t$1, k$1, c$1, t$2, b$2, d$2, t$3, t$4, t$5, k$5, c$5, t$6, b$6, d$6, c$6, v$6, t$7, v$7, k$4, c$4, b$5, d$5, v$5, b$1, d$1;
		t$0=this;
		t$0.open$();
		c$0 = (b$0=d$0=1,t$0.$) || (b$0=d$0=0,t$0.$={});
		((!b$0||d$0&2) && t$0.flagSelf$('layout-container'));
		t$1 = c$0.b || (c$0.b = t$1 = imba.createIndexedFragment(0,t$0));
		k$1 = 0;
		c$1=t$1.$;
		for (let i = 0, items = iter$$5(treasures), len = items.length, item; i < len; i++) {
			item = items[i];
			t$2 = (b$2=d$2=1,c$1[k$1]) || (b$2=d$2=0,c$1[k$1] = t$2=imba.createElement('ul',0,t$1,null,null,'i73e8ed81'));
			b$2||(t$2.up$=t$1);
			k$1++;
		}t$1.end$(k$1);
		b$0 || (t$1=imba.createElement('div',0,t$0,'content-wrapper',null,'i73e8ed81'));
		t$2 = (b$2=d$2=1,c$0.c) || (b$2=d$2=0,c$0.c=t$2=imba.createComponent('app-header',0,t$1,null,null,'i73e8ed81'));
		b$2 || !t$2.setup || t$2.setup(d$2);
		t$2.end$(d$2);
		b$2 || t$2.insertInto$(t$1);
		b$0 || (t$2=imba.createElement('section',0,t$1,'parent',null,'i73e8ed81'));
		b$0 || (t$3=imba.createElement('aside',0,t$2,null,null,'i73e8ed81'));
		t$4 = c$0.d || (c$0.d = t$4=imba.createElement('div',2048,t$3,'sticky',null,'i73e8ed81'));
		t$5 = c$0.e || (c$0.e = t$5 = imba.createIndexedFragment(0,t$4));
		k$5 = 0;
		c$5=t$5.$;
		for (let i = 0, items = iter$$5(treasures), len = items.length, item; i < len; i++) {
			item = items[i];
			t$6 = (b$6=d$6=1,c$5[k$5]) || (b$6=d$6=0,c$5[k$5] = t$6=imba.createElement('a',0,t$5,'img__container',null,'i73e8ed81'));
			b$6||(t$6.up$=t$5);
			c$6=t$6.$f || (t$6.$f={});
			(v$6=("#" + (item.name)),v$6===c$6.g || (t$6.href=c$6.g=v$6));
			t$7 = (c$6.h) || (c$6.h=t$7=imba.createElement('img',0,t$6,null,null,'i73e8ed81'));
			(v$7=("./images/" + (item.name) + ".jpg"),v$7===c$6.i || (t$7.src=c$6.i=v$7));
			k$5++;
		}t$5.end$(k$5);
		t$3 = c$0.j || (c$0.j = t$3=imba.createElement('main',2048,t$2,'cards',null,'i73e8ed81'));
		t$4 = c$0.k || (c$0.k = t$4 = imba.createIndexedFragment(0,t$3));
		k$4 = 0;
		c$4=t$4.$;
		for (let i = 0, items = iter$$5(treasures), len = items.length, item; i < len; i++) {
			item = items[i];
			t$5 = (b$5=d$5=1,c$4[k$4]) || (b$5=d$5=0,c$4[k$4] = t$5=imba.createComponent('person-card',0,t$4,null,null,'i73e8ed81'));
			b$5||(t$5.up$=t$4);
			c$5=t$5.$l || (t$5.$l={});
			b$5 || (t$5.id=`${item.name}`);
			(v$5=item,v$5===c$5.m || (t$5.data=c$5.m=v$5));
			b$5 || !t$5.setup || t$5.setup(d$5);
			t$5.end$(d$5);
			k$4++;
		}t$4.end$(k$4);
		b$0 || (t$3=imba.createElement('section',0,t$2,'welcome',null,'i73e8ed81'));
		b$0 || (t$4=imba.createElement('div',0,t$3,'sticky',null,'i73e8ed81'));
		b$0 || (t$5=imba.createElement('h3',0,t$4,null,"Welcome to heavenly treasures",'i73e8ed81'));
		b$0 || (t$5=imba.createElement('p',0,t$4,null,"These are our friends in cambodia.",'i73e8ed81'));
		b$0 || (t$5=imba.createElement('p',0,t$4,null,"They are regular attendees to our church group. They are either baptized believers in Jesus or sympathetic towards the Gospel. We know that sharing the gospel means more than praying with and preaching to someone. The gospel also meets the deepest needs of the people.",'i73e8ed81'));
		b$0 || (t$5=imba.createElement('p',0,t$4,null,"In the last several months we have received gifts to support our friends in need, through our families. and your gifts made a huge impact on our friends' lives.",'i73e8ed81'));
		b$0 || (t$5=imba.createElement('p',0,t$4,null,"I made this website, to simply have a place to give you account of hour your funds are used.",'i73e8ed81'));
		b$0 || (t$5=imba.createElement('p',0,t$4,null,"We would like to also inform you of other needs you might be interested in supporting.",'i73e8ed81'));
		b$0 || (t$5=imba.createElement('p',0,t$4,null,"If you would like to send us funds to help these people, you can do so through our family members, or email us at tiradomission at gmail dot com.",'i73e8ed81'));
		b$0 || (t$5=imba.createElement('p',0,t$4,null,"Sending money through an organization means that some of your funds will be used for operational costs, and usually a non-profit accept funds sent to a specific individual.",'i73e8ed81'));
		b$0 || (t$5=imba.createElement('p',0,t$4,null,"We are NOT a non-profit. We cannot provide tax-deductible receipts. But we will make sure that 100% of your donation is used to help these.",'i73e8ed81'));
		b$0 || (t$5=imba.createElement('p',0,t$4,null,"If needed, we will personally pay for any transaction fee from our personal income, as we are also personally invested in supporting our friends.",'i73e8ed81'));
		b$0 || (t$5=imba.createElement('p',0,t$4,null,"This is completely based on trust, we are assuming that you are supporting, because you know us, or because you know our family.",'i73e8ed81'));
		b$0 || (t$5=imba.createElement('p',0,t$4,null,"We take no funds for ourselves from your direct giving. We have a salary from an organization (Adventist Frontier Missions) and all our needs our met. If you would like to support our personal fundraising goals, please do so at afmonline.org.",'i73e8ed81'));
		t$1 = (b$1=d$1=1,c$0.n) || (b$1=d$1=0,c$0.n=t$1=imba.createComponent('app-footer',0,t$0,null,null,'i73e8ed81'));
		b$1 || !t$1.setup || t$1.setup(d$1);
		t$1.end$(d$1);
		b$1 || t$1.insertInto$(t$0);
		t$0.close$(d$0);
		return t$0;
	}
} imba.tags.define('heavenly-treasures',HeavenlyTreasuresComponent,{});


/* css
:root {
--first: #f4d35d;;
--second: #9fd356;
--third: #0B7A75;
--fourth: #684756;
--gray: #f0f0f0;
--dark: #626262;
--black: #232324;
--white: #fafffd;
--spacing: 10px;
--heading: 'Noto Serif', serif;
--body: 'Open Sans', sans-serif;
}

* {
	box-sizing: border-box;
	padding: 0;
	margin: 0;
	scroll-behavior: smooth;
}
html {
	scroll-behavior: smooth;
}
body {
	background-color: var(--dark)
}
body * {
	margin: 0;
}
.content-wrapper {
	max-width: 1200px;
	margin: 0 auto;
	background-color: var(--gray)
}
h1,h2,h3,h4,h5,h6 {
	font-family: 'Noto Serif', serif;
	font-weight: bold;
	color: var(--third)
}
p, div, span {
	font-family: 'Open Sans', sans-serif;
}
p {
	margin-bottom: var(--spacing);
}

a {
	color: var(--fourth);
}
*/

/* css scoped

.parent {
	background-color: var(--gray);
	display: grid;
	padding: 10px;
	grid-template-columns: minmax(100px, 200px) minmax(300px, 1fr) 300px;
	grid-template-rows: 1fr;
	grid-column-gap: 10px;
	grid-row-gap: 10px;
	position: relative;
}
.welcome {
	padding: var(--spacing);
	background-color: white;
	position: sticky;
	font-size: .8rem;
}

aside { 
	grid-area: 1 / 1 / 6 / 2;
}

.sticky {
	position: sticky;
	top: 0;
}
.img__container {
	width: 100%;
	display: block;
	height: auto;
	position: relative;
	overflow: hidden;
	padding: 55% 0 0 0;
}
.img__container img {
	display: block;
	width: 100%;
	height: auto;
	position: absolute;
	top: 0;
	left: 0;
}
main {
	scroll-behavior: smooth;
	display: grid;
}

.cards {
}

*/
//# sourceMappingURL=bundle.js.map
