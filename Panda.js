/**
EDIT2020 - for es6 updates.

 * Panda.js
 * Extendable Client side syntax highlighter core javascript and API. No languages included.
 *
 * Copyright 2011-2012 AvacWeb (avacweb.com)
 * Released under the MIT and GPL Licenses.
*/
(function(){
	var panda = {
		cacheIdentity : true,
		installedLanguages : [],
		languages : {},
		regex : {
			comment1 : /\/\/[^\n]*/g,
			comment2 : /\/\*(.|[\n\r])*?\*\//gm,
			comment3 : /#[^\n]*/g,
			string : /(['"])(?:\\?.)*?\1/g,
			operators : /[!=\+%\*\-][!=\+\-]?|&(?:amp;){2}|&gt;|&lt;|(?:\|\|)/g,
			extra : /[:\{\}\[\]\(\)]/g
		}
	};

	//swap all BR elements into new lines. Makes it easier imo.
	function brSwap(code, dir) {
		return dir ? code.replace(/\r?\n/g, '<br/>') : code.replace(/\<br\s?\/?\>/gi, '\n');
	};

	//wrap text in SPAN tags with a classname.
	function spanWrap(cn, text) {
		//clapanda? We give it this attribute, instead of 'class' because 'class' is a keyword in a lot of languages.
		//clapanda is then replaced with class at the end.
		return '<span clapanda="' + cn + '">' + text + '</span>';
	};

	//replaces special words such as 'var' and 'function' etc. Avoids it in variable names such as var myfunction;
	function parseSpecials(code, arr, cn) {
		return code.replace(RegExp('\\b(?:' + arr.join('|') + ')\\b', 'g'), function(c) {
			return spanWrap(cn, c);
		});
	};

	//mini parse function for internal regexps.
	function quickParse(name, obj, code) {
		for(var r in obj) code = code.replace(obj[r], function(c) { return spanWrap(name + '-' + r, c); });
		return code;
	};

	//function deals with adding lines to the code.
	function addLines(code) {
		var li = '<li class="panda-line">';
		return '<ol>' + li + code.split(/\n/).join('</li>' + li) + '</li></ol>';
	};

	//parse function parses a string of text for any of the added languages.
	panda.parse = function(type, code) {
		var codeObj = panda.languages[type];
		if(!codeObj) return code;

		var matchers = codeObj['matchers']
		, keywords = codeObj['keywords']
		, specials = codeObj['specials']
		, uid = (new Date()).getTime() //unique ID for our replacements.
		, store = {}
		, code = brSwap( code ).replace(/\</g, '&lt;').replace(/>/g, '&gt;').replace(/&nbsp;/g, ' ');  //clean code

		for(var i = 0, count = 0, m; (m = matchers[ i++ ]); ) {
			var r = this.regex[ m ]
			, key = '£panda_' + m + '_' + uid + '_'
			, hold = store[ m ] = {}
			, innerRegex = false //parsing regex inside regex... read docs.

			if(!r) continue; //continue if non-existant regex
			if(r.inner) {
				innerRegex = r.inner;
				r = r.outer;
			}

			code = code.replace(r, function( c ) {
				var alias = key + count++ + '_' + (r.multiline ? 'm_' : '') + 'panda£'; //creates a swap like £panda_regex_uid_1_panda£
				if(innerRegex) c = quickParse('panda-'+m, innerRegex, c);
				hold[ alias ] = c;
				return alias;
			});
		};

		if(keywords.length) code = parseSpecials(code, keywords, 'panda-keyword');
		if(specials.length) code = parseSpecials(code, specials, 'panda-special');

		//Everyone likes their integers colored.
		if(!codeObj.noints) code = code.replace(/\b\d+(?:\.\d+)?\b/g, function(num) {
			return spanWrap('panda-int', num);
		});

		for(i = matchers.length; i; i--) {
			var m = matchers[ i - 1 ], stripped = store[ m ];
			for(var stripKey in stripped) {
				var s = stripped[ stripKey ];
				if(stripKey.indexOf('_m_')) s = s.replace(/\n/g, '</span>\n<span clapanda="panda-' + m + '">');
				code = code.replace( stripKey, spanWrap('panda-'+m, s) );
			}
		};

		//this is ugly, but it prevents class keyword messing things up.
		code = code.split(' ').join('&nbsp;').replace(/&nbsp;clapanda=/g, ' class=').replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;');
		return brSwap( addLines(code) , 1);
	};

	panda.identify = function(node) {
		if(node.pandaType) return node.pandaType;
		var reg = /(?:\s|^)panda[_-](\w+)(?:\s|$)/;
		if( reg.test( node.className ) ) return reg.exec(node.className)[1]; //test classname for panda_lang class
		return 'default';
	};

	panda.colorNode = function(node) {
		var type = panda.identify( node );
		if(panda.cacheIdentity) node.pandaType = type;
		node.className += ' panda-code panda-' + type; //add these classnames for style declarations dependent on them
		node.innerHTML = panda.parse(type, node.innerHTML);
	};

	/* API for adding to Panda */

	panda.addSpecials = function(lang, words) {
		this.addKeywords(lang, words, true);
	};

	panda.addKeywords = function(lang, words, specials) {
		if(lang in panda) {
			for(var i = 0, l = words.length; i<l; i++) panda.languages[lang][ specials ? 'specials' : 'keywords' ].push( words[i] );
		}
	};

	panda.addLang = function(name, obj) {
		if('matchers' in obj) {
			var n = panda.languages[name] = {};
			panda.installedLanguages.push( name );
			n.matchers = typeof obj.matchers == 'string' ? obj.matchers.split(' ') : obj.matchers;
			n.specials = (typeof obj.specials == 'string' ? obj.specials.split(' ') : obj.specials) || [];
			n.keywords = (typeof obj.keywords == 'string' ? obj.keywords.split(' ') : obj.keywords) || [];
			if(obj.regex && typeof obj.regex == 'object') {
				for(var i in obj.regex) panda.regex[ i ] = obj.regex[ i ];
			}
		}
	};

	window.panda = panda;

	// Add a default language as fall back on code blocks with no panda_{LANG} classname. Feel free to add to this.
	panda.addLang('default', {
		matchers : ['string'],
		keywords : 'var for while if else elseif function def class try catch return true false continue break case default delete switch in as null typeof sizeof null int char bool boolean long double float enum import struct signed unsigned',
		specials : ['document']
	});

	//just call this in a DOMReady or onload function.
	panda.onload = function() {
		var codes = document.getElementsByTagName('code');
		for(var i = 0, c; (c = codes[ i++ ]); ) {
			panda.colorNode( c );
		};
	};
})();
