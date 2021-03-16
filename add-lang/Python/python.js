// Panda Syntax Highlighter  - Python Language add on.
(function(p) {
    if(!p) return;

    var obj = {
        matchers : 'comment3 longstring string prompts operator',
        keywords : 'for while if else elif and or def not return del True true False false in class dict self None NotImplemented Elipsis as assert break continue finally exec from global except lambda is import pass raise try with yield',
        specials : 'abs dict help min setattr all dir hex next slice any divmod id object sorted ascii enumerate input oct staticmethod bin eval int open str bool exec isinstance ord sum bytearray filter issubclass pow super bytes float iter print tuple callable format len property type chr frozenset list range vars classmethod getattr locals repr zip compile globals map reversed __import__ complex hasattr max round delattr hash memoryview set',
        regex : {
            prompts : /\b(?:(?:&gt;){3}|\.{3})\b/g,
            longstring : /('''|""")(?:.|[\n\r])*?\1/gm
        }
    };

    p.addLanguage('py', obj);
})(window.Panda);
