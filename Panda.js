/**
 * Panda.js
 * Client side syntax highlighter for HTML, CSS and Javascript
 *
 * Copyright 2011-2012 AvacWeb (avacweb.com)
 * Released under the MIT and GPL Licenses.
 */
(function(){
	var panda = {
		lineNumbering : true, //set to false to disable adding line numbers.
		languages : ['js', 'html', 'css', 'php'],
		js : {}, html : {}, css: {}, php : {}, //To begin a new language add a new empty object, and to the languages array
		regex : {
			regex : /\/(.(?!\\\/)).*\//g,
			comment1 : /(?!:(?=\/))[^:]\/\/[^\n]*/g,
			comment2 : /\/\*(.|[\n\r])*?\*\//gm,
			comment3 : /#[^\n]*/g,
			comment4 : /(&lt;|<)!--.*?--(&gt;|>)/g,
			string1 : /"(\\"|[^"])*"/g,
			string2 : /'(\\'|[^'])*'/g,
			multiLineString1 : /"(\\"|[^"])*"/gm,
			multiLineString2 : /'(\\'|[^'])*'/gm,
			phptag : /((?:<|&lt;)\?(php)?)|(?:\?(?:>|&gt;))/g,
			htmltag : /(?:&lt;|\<).+?(?:&gt;|\>)/g,
			htmlspecial : /(?:&lt;|\<)\/?(head|html|body|a|script|meta|link)#?.*?(?:&gt;|\>)/g, //hash because of our swaps
			operators : /(?:(!|=)?==?)|(?:\|\|)|[\-\+\>\/\*%]/g,
			attribute : /\s[\w\-]+(?==["'].*?['"])/g,
			phpvar : /\$[\w\d_]+(?=\W)/g,
			selector : /.*?(?=\s*\{)/g,
			extra : /[:\{\}\[\]\(\)]/g //can't includes ';' because it can be in any entity.
		}
	};

	panda.js.keywords = 'var function return if else while do this new typeof for null false true'.split(' ');
	panda.js.specials = 'document window Array RegExp Object Math String Number Date'.split(' ');
	panda.js.matchers = 'comment1 comment2 string1 string2 regex operators extra'.split(' ');
	
	panda.html.keywords = panda.html.specials = [];
	panda.html.matchers = 'comment4 attribute htmlspecial htmltag'.split(' ');
	
	panda.php.keywords = 'var function private public static if else return while do this new typeof for foreach as null false true'.split(' ');
	panda.php.specials = 'echo require include int array global'.split(' ');
	panda.php.matchers = 'comment3 comment2 comment1 multiLineString1 multiLineString2 phpvar phptag operators extra'.split(' ');
	
	panda.css.keywords = panda.css.specials = [];
	panda.css.matchers = 'comment2 string1 string2 selector extra'.split(' ');
	
	// For new languages. 
	// panda.newLang.keywords = 'keywords in the new language'.split(' '); 
	// panda.newLand.specials = 'special keywords often colored differently'.split(' ');
	// panda.newLang.matchers = 'list of regexs from the above which occur in this language. The order matters'.split(' ')
	
	//swap all BR elements into new lines. Makes it easier imo. 
	function brSwap(code, dir) {
		return dir ? code.replace(/\n/g, '<br/>') : code.replace(/\<br\s?\/?\>/g, '\n');
	};
	
	//wrap text in SPAN tags with a classname.
	function spanWrap(cn, text) {
		return '<span class="' + cn + '">' + text + '</span>';
	};
	
	//replaces special words such as 'var' and 'function' etc. Avoids it in variable names such as var myfunction;
	function parseSpecials(code, arr, cn) {
		return code.replace(RegExp('(?:^|\\W)(' + arr.join('|') + ')(?:\\W)', 'g'), function(c, word) {
			return c.replace(word, spanWrap(cn, word) );
		});
	};
	
	//adds the line numbers. If you wish to add a classname to each line add it in this func.
	function addLines(code) {
		return '<ol class="pandaCode"><li>' + code.split(/\n/).join('</li><li>') + '</li></ol>';
	};
	
	//parse function parses a string of text for any of the set up languages above.
	panda.parse = function(type, code) {
		var codeObj = panda[type];
		if(!codeObj) return code;
		var matchers = codeObj['matchers']
		, keywords = codeObj['keywords']
		, specials = codeObj['specials']
		, uid = (new Date()).getTime() //unique ID for our replacements. 
		, store = {}
		, code = brSwap( code.replace(/(^[\s\t\n]+)|([\s\t\n]+$)/g, '') ); //remove whitespace at start and end. and BR's
		
		for(var i = 0, l = matchers.length; i<l; i++) {
			var m = matchers[ i ]
			, r = this.regex[ m ]
			, key = '#' + m + '_' + uid + '_'
			, count = 0
			, hold = store[ m ] = {};
			if(!r) continue;
			
			code = code.replace(r, function( c ) {
				var alias = key + count++ + '_' + (r.multiline ? 'm' : '') + '#'; //creates a swap like #regex_uid_1#
				hold[ alias ] = c;
				return alias;
			});
		};
		
		if(keywords.length) code = parseSpecials(code, keywords, 'panda-keyword');
		if(specials.length) code = parseSpecials(code, specials, 'panda-special');
		
		for(i = matchers.length; i; i--) {
			var m = matchers[ i - 1 ], stripped = store[ m ];			
			for(var stripKey in stripped) {
				var s = stripped[ stripKey ];
				if(stripKey.indexOf('_m_#')) s = s.replace(/\n/g, '</span>\n<span class="panda-' + m + '">');
				code = code.replace( stripKey, spanWrap('panda-'+m, s) );
			}
		};
		
		if(this.lineNumbering) code = addLines(code);
		return brSwap( code.replace(/\t|(    )/g, '&nbsp;&nbsp;&nbsp;&nbsp;') , 1);
	};
	
	panda.colorNode = function(node) {
		var type = panda.identify( node );
		if(!type) return;
		if(node.nodeName.toLowerCase() == 'code' && node.parentNode.nodeName.toLowerCase() != 'pre') {
			var pre = document.createElement('pre');
			node.parentNode.insertBefore(pre, node);
			pre.appendChild( node );
		}
		node.innerHTML = panda.parse(type, node.innerHTML);
	};
	
	panda.identify = function(node) {
		var reg = /(?:\s|^)panda_(\w+)(?:\s|$)/;
		if( reg.test( node.className ) ) return reg.exec(node.className)[1]; //test classname for panda_lang class
		var scores = {}, regex = panda.regex, code = node.innerHTML, langs = panda.languages
		, i = 0, l = langs.length, winner = 0, winning_lang = null;
		
		for(var r in regex) scores[r] = (code.match( regex[r] ) || []).length; //find total matches for all the machers
		
		for(; i<l; i++) {
			var total = 0, lang = panda[ langs[i] ];
			//create a score for this language, by totaling the number of matches form the matchers.
			for(var j = 0, k = lang.matchers.length; j<k; j++) total += scores[ lang.matchers[j] ];
			//total up occurences of keywords.
			total += (code.match(RegExp( lang.keywords.join('|') )) || []).length;
			if(total > winner) {
				winner = total;
				winning_lang = langs[i];
			} 
		};
		return winning_lang;
	};
	
	panda.addKeyword = function(lang, word) {
		panda[ lang ].keywords.push(word);
	};
	
	panda.addSpecial = function(lang, word) {
		panda[ lang ].specials.push(word);
	};
	
	panda.addLang = function(name, obj) {
		if('matchers' in obj && 'keywords' in obj && 'specials' in obj) {
			var n = panda[name] = {};
			panda.languages.push( name );
			n.matchers = typeof obj.matchers == 'string' ? obj.matchers.split(' ') : obj.matchers;
			n.specials = typeof obj.specials == 'string' ? obj.specials.split(' ') : obj.specials;
			n.keywords = typeof obj.keywords == 'string' ? obj.keywords.split(' ') : obj.keywords;
			
			if(obj.regex && typeof obj.regex == 'object') {
				for(var i in obj.regex) {
					panda.regex[ i ] = obj.regex[ i ];
				}
			}
		}
	};
	
	if (typeof module === 'object' && typeof module.exports === 'object') { 
		module.exports = panda; 
	}
	else {
		window.panda = panda;
	}
})();