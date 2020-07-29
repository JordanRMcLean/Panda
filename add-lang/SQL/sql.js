//Panda Syntax Highlighter - SQL Language Add- on
(function(p){
	if(!p) return;
	p.addLanguage('sql', {
		keywords : 'select SELECT DELETE delete UPDATE update SET set FROM from WHERE where AND and OR or INSERT INTO insert into DROP CREATE INDEX drop create index ALTER alter AS as',
		specials : 'DISTINCT distinct ASC asc DESC desc DATABASE database TABLE table LIMIT',
		matchers : 'comment3 string sqlstring operator',
		regex : {
			sqlstring : /`[^`]+`/g
		}
	});
	
	//add these manually due to the space.
	p.languages.sql.keywords.concat(['GROUP BY', 'group by', 'ORDER BY', 'order by']);
	
})(window.Panda);
