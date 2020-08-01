Panda Syntax Highlighter
===============================

Available Languages
-----------------------
* Javascript
* CSS
* HTML/XML
* PHP
* SQL
* Python
...and easily extendable


Intro
----------------
__Panda is a tiny and simple syntax highlighting tool with the ability to easily add new languages and themes. It can parse code blocks from DOM or be used to part raw text.

Panda is easily customizable with the use of classnames instead of inline styling and extendable with extra languages thrugh a simple API.
__

```javascript
panda.onload(); //color all code blocks.
```

To install Panda, simply include the Panda core Javascript on your site, and then add the languages you need from the languages directory.
Call the `panda.onload()` method in a DOMReady function, onload function or near the bottom of your page to color all code blocks.


Using Panda
----------------------------

#### Specifying a Language
Specify which language to part with a classname of `panda-lang`, where "lang" is the name given to the language. If no language is specified Panda will colour it using default.
* For a lanaguage given the name 'html' : 'panda-html'
* For a language named 'js' : 'panda-js'
* etc etc...


#### Parsing HTML
The `parse` method accepts raw text and returns a new text string with included HTML Span elements to provide colour.
This is used internally when colouring code blocks but can be used to parse raw text for whatever use.

Params: text language, text code
```javascript
panda.parse('css', '#select { display: none }');
```


Adding to Panda
---------------------------
Use the Panda.addLanguage() method to add a new language. First parameter should be the language name and second an object specifying what to highlight.

The object should contain Matchers, Keywords and Specials. Each of these properties should be an array, or optionally for ease, a space separated string.
* Matchers = Which regular expressions to use to match parts of the language (see below)
* Keywords = language keywords that are reserved. (let, if else, for ...)
* Specials = Certain special words you may want highlighted different. Eg for Javascript: window, document, etc..

The list below shows what "matchers" are available already in Panda:
* string - Strings wrapped in either double or single quotes.
* templatetring - Strings wrapped in backticks in languages that allow line breaks and variables in strings.
* operator - =, +, etc...
* extra - Includes:  {, }, [, ], (, )
* comment1 - A comment in the format: //comment
* comment2 - A comment in the format: /* multiple line comment */
* comment3 - A comment in the format: # comment

If the language your adding requires more Regular Expressions to be added to give yourself more of these "matcher" options, you should include a property in the object called 'regex', which should be an object containing a name for the key and a regex as the value. For example, if your adding ASP.net, you may need to add a RegExp for matching ASP tags. The key will be used to give the matching parts of the code a classname. In the example below a regex for asp tags is included with a key of 'aspTags', matching parts of the code will be given the className 'panda-aspTags'.
```javascript
Panda.addLanguage('asp', {
	matchers : 'comment1 string aspTags operators extra', //include aspTags in our matchers
	keywords : 'dim for if else while to', //keywords in the language
	specials : ['server', 'write', 'response', 'request'] //could be array instead
	regex : {
		aspTags : /((<|&lt;)%)|(%(>|&gt;))/g //our new regex and new matcher.
	}
});
```

![Panda SQL](http://i40.servimg.com/u/f40/17/20/25/96/captur37.png)
