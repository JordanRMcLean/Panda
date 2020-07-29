/*  Panda.js Updating for ES6 script.

TODO:
- update ints to match exponentials and floats
- match variables in javascript strings
- add new javascript keywords: Promise, async, await, let, const, class,
- innerText or textContent instead of innerHTML
- add language of 'none' to exclude code from being parsed.
- remove whitespace from front and back.

*/

(function (win, doc) {

    //no need for a class.
    const Panda = {
        //unique id for replacing and returning text
        replacerID: 'panda_' + (new Date()).getTime() + '_',

        languages: {			
		//stores the language objects which specify what to parse and keywords.
		/*  'language' : {
				matchers: array of which regexp to use for this lang,
                keywords: array,
                specials: array of words more special than keywords eg window/document etc
		    }
		*/		
        },

        //regular expressions needed, key represents what part of a code they identify
        regex: {
            comment1: /\/\/[^\n]*/g,
            comment2: /\/\*(.|[\n\r])*?\*\//gm,
            comment3: /#[^\n]*/g,
            string: /(['"])(?:\\?.|\r?\n)*?\1/gm,
			templatestring: {
				outer: /`(?:[^`]|\r?\n)*?`/gm,
				inner: {
					variable : /\$\{[\w_-]+\}/g
				}
			},
            operator: /[!=\+%\*\-][!=\+\-]?|&(?:amp;){2}|&gt;|&lt;|(?:\|{2})/g,
            extra: /[:\{\}\[\]\(\)]/g,
            int: /\b\d+(?:\.\d+)?/g,
			xmlcomment : /&lt;!--.*?--(?:&gt;|>)/g,
			xmltag : {
				outer : /&lt;\/?.+?(?:&gt;|\>)/g,
				inner : {
					attribute : /(['"])(?:\\?.)+?\1/g,
					special : /&lt;\/?(?:head|html|body|a|script|meta|link).*?&gt;/g
				}
			},
			cssselector : {
				outer: /[^\{\}]*?(?=\{)/gm,
				inner : {
					pseudo : /:[\w-]+(?:\(.*?\))?\b/g
				}
			},			
			cssimportant : /!important(?=\s*(?:;|\}|\n))/gi,
			cssproperty : /\b[^\n]+(?=:)/g,
			cssunit : /\b\d+(?:\.\d+)?(ex|p[xct]|%|[cme]m|in)\b/gi,
			regexp : /\/(\\\/|.)*?\//g,
			JSglobal : /\b(?:document|window|navigator|screen)\b/gi,
			
        },

        //init and parse all code elements. Optional.
        init() {
			for(let codeElement of doc.getElementsByTagName('code') ) {
				this.colorNode(codeElement);
			}
        },

        //match panda_lang (lang)  Can this be cleaner with classList?
        identifyLanguage(codeElement) {
            let regex = /(?:\s|^)panda[_-](\w+)(?:\s|$)/;

            if (regex.test(codeElement.className)) {
                return regex.exec(codeElement.className)[1];
            }

            return 'default'
        },

        //Turns codeElement into "Panda-ed" code element.
        colorNode(codeElement) {
            let lang = this.identifyLanguage(codeElement);
			codeElement.classList && codeElement.classList.add('panda-code', 'panda-' + lang);
			
			if(lang !== 'ignore' ) {
				codeElement.innerHTML = this.parse(lang, codeElement.textContent);
			}
        },

        //where it all happens. the parsing of the text into span elements.
        parse(language, code) {

            let languageObj = this.languages[language],
                replacementStorage = [],
                replaceKey = this.replacerID,
                keyIncrement = 0,
                regex = this.regex;

            if (!languageObj || language === 'ignore') {
                return code;
            }

            let {
                matchers,
                keywords,
                specials
            } = languageObj;

            // saves instances of '<' and '>' 
            let parsedCode = htmlSwap(code);
			
            //Go through the matchers, matching each case
			//if matcher has internal expressions to match, go through those too. 
			matchers.forEach(matcherToParse => {
				if(matcherToParse in regex) {
					
					let expression = regex[matcherToParse]
					, internalParse = false;
					
					if(expression.outer) {
						internalParse = expression.inner;
						expression = expression.outer;	
					}
					
					parsedCode = parsedCode.replace(expression, match => {
						let uniqueReplacementKey = replaceKey + keyIncrement++;
						
						if( !!internalParse && typeof internalParse === 'object' ) {
							
							for(let internalRegex in internalParse) {
								match = simpleParse(match, internalParse[internalRegex], matcherToParse + '-' + internalRegex);
							}
							
						}
						
						if(expression.multiline) {
							match = match.replace(/(\r?\n)/g, '</span>$1<span class="panda-' + matcherToParse + '">');
						}
						
						replacementStorage.push([ uniqueReplacementKey , spanWrap(matcherToParse, match) ]);
						
						return uniqueReplacementKey;
					})
					
				}
			})
			//all "matcher" regular expressions have now been matched and replaced with unique keys.

            //match keywords 
			if(keywords.length > 0) {
				parsedCode = simpleParse(parsedCode, RegExp('\\b(?:' + keywords.join('|') + ')\\b', 'g'), 'keyword');
			}
			
            //match all special words
			if(specials.length > 0) {
				parsedCode = simpleParse(parsedCode, RegExp('\\b(?:' + specials.join('|') + ')\\b', 'g'), 'special');
			}
			
			//replace all integers now that strings are removed?
			parsedCode = parsedCode.replace(regex.int, integer => spanWrap('int', integer))
			
			//replace all unique replacmeents with their counter parts
			for(let i = replacementStorage.length, token; (token = replacementStorage[--i]); ) {
				parsedCode = parsedCode.replace( token[0], token[1] );
			}
			
			//add line numbers
			parsedCode = specialCharacters(parsedCode);
			parsedCode = addLines(parsedCode);
			
			
			return parsedCode;

        }
    }
	
	
	//replace all instances of an expression with span with classname.
	function simpleParse(code, expression, classname) {		
		return code.replace(expression, match => {
			return spanWrap(classname, match);
		})	
	}

	//protect < & >
    function htmlSwap(code) {		
		return code.replace(/\</g, '&lt;').replace(/>/g, '&gt;');
    }
	
	//turn \t \r \n  \s into HTML counterparts to ensure visible format remains	
	function specialCharacters(code) {	
		return code.replace(/\t/g, '&nbsp;&nbsp;');
	}
	
	function spanWrap(className, text) {	
		return '<span class="panda-' + className + '">' + text + '</span>';	
	}

    //function deals with adding lines to the code.
    function addLines(code) {
        var li = '<li class="panda-line">';
        return '<ol>' + li + code.split(/\n/).join('</li>' + li) + '</li></ol>';
    }
	
	
	/*
	*  -----------------------------------------------------------
	*  ---------- API for adding languages -----------------------
	*  -----------------------------------------------------------
	*/
	
	Panda.addLanguage = function(languageName, specifics) {
		
		//need matchers as minimum
		if(specifics.matchers) {
			
			//empty language object to prevent errors.
			let languageObj = {
				matchers : [],
				specials : [],
				keywords : []
			};
			
			for(let spec in languageObj) {
				languageObj[spec] = 
					(typeof specifics[spec] === 'string' ? specifics[spec].split(' ') : specifics[spec]) || [];		
			}
			
			this.languages[languageName] = languageObj;
			
			if(specifics.regex) {
				this.addMatchers(specifics.regex);
			}
		}
		
	};
		
	Panda.addMatchers = function(matchers) {
		for(let name in matchers) {
			this.regex[name] = matchers[name];
		}	
	};
	
	win.Panda = Panda; 

	
	/*
	*  -----------------------------------------------------------
	*  ----------  Add some common languages -----------------------
	*  -----------------------------------------------------------
	*/
	
    // Add a default language as fall back on code blocks with no panda_{LANG} classname.
    Panda.addLanguage('default', {
        matchers: ['comment1', 'comment2', 'xmltag', 'xmlcomment'],
        keywords: 'var for while if else elseif function def class try catch return true false continue break case default delete switch in as null typeof sizeof null int char bool boolean long double float enum import struct signed unsigned',
        specials: ['document', 'window']
    });
	
	Panda.addLanguage('html', {
		matchers: ['xmltag', 'xmlcomment']
	});
	
	Panda.addLanguage('xml', {
		matchers: ['xmltag', 'xmlcomment']
	});
	
	Panda.addLanguage('css', {
		matchers: 'string comment2 cssselector cssproperty cssunit cssimportant'
	});
	
	Panda.addLanguage('js', {
		matchers : 'string templatestring comment1 comment2 JSglobal regexp extra operator',
		specials : 'Symbol Map Promise fetch Class Array RegExp Object Math String Number Date Function Boolean charAt charCodeAt concat fromCharCode indexOf lastIndexOf match replace search slice split substr substring toLowerCase toUpperCase valueOf join pop push reverse shift slice sort splice toString unshift getDate getDay getFullYear getHours getMilliseconds getMinutes getMonth getSeconds getTime getTimezoneOffset getUTCDate getUTCDay getUTCFullYear getUTCHours getUTCMilliseconds getUTCMinutes getUTCMonth getUTCSeconds getYear parse setDate setFullYear setHours setMilliseconds setMinutes setMonth setSeconds setTime setUTCDate setUTCFullYear setUTCHours setUTCMilliseconds setUTCMinutes setUTCMonth setUTCSeconds setYear toDateString toGMTString toISOString toJSON toLocaleDateString toLocaleTimeString toLocaleString toString toTimeString toUTCString UTC abs acos asin atan atan2 ceil cos exp floor log max min pow random round sin sqrt tan toExponential toFixed toPrecision compile exec test decodeURI decodeURIComponent encodeURI encodeURIComponent escape eval isFinite isNaN parseFloat parseInt String unescape',
		keywords : 'break case catch continue default delete do else finally for function if in instanceof new return switch this throw try typeof var void while with null true false let const async await require import export'
	})

})(window, document);

