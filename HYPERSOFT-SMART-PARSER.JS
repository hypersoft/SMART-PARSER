var smartParserVoidClaim = undefined;
var smartParserFunctionFailure = null;
var smartParserEndOfSource = 'END-OF-SOURCE';

function SmartParserFault(message) { // for the claiming of a parsing-fault
  this.message = String(message);
  this.stack = (new Error()).stack;
}

SmartParserFault.prototype = new Error;
SmartParserFault.prototype.constructor = SmartParserFault;
SmartParserFault.prototype.name = 'SMART-PARSER-FAULT';

function SmartParserState() {
  this.sourcePosition = 0, this.line = 1, this.column = 1,  this.claim = [],
  this.token = [];
}

SmartParserState.prototype = {
  constructor: SmartParserState,
	get clone() {
	  var clone = Object.create(SmartParserState.prototype);
	  clone.sourcePosition = this.sourcePosition, clone.line = this.line,
	  clone.column = this.column, clone.claim = this.claim.slice(0),
	  clone.token = this.token.slice(0);
	  return clone;
	},
	get term() { return this.claim[this.claim.length - 1]; }
}

function SmartParser(source, tabColumnWidth) {
  this.source = source, this.tabColumnWidth = tabColumnWidth || 4;
  this.state = [new SmartParserState()];
}

SmartParser.prototype = {
  constructor: SmartParser, possiblity: 0,
  beginParsingWith: function(term) {
    if (term.possible) this.possiblity++;
    this.state.push(this.currentState.clone);
    this.currentState.claim.push(term);
	  delete this.failure;
  },
  finishParsingWith: function(term, synchronize) {
    if (this.currentState.term != term)
      throw new ReferenceError('SmartParser: Finish-Parsing-Term: WRONG-STATE-CLAIM');
    if (synchronize !== true && this.possiblity === 0) {
      if (! this.failure || term.method === 'OR') this.failure = this.fault;
    }
    if (term.possible) this.possiblity--;
    var state = this.state.pop();
    if (synchronize) {
      state.claim.pop(); this.state.pop(); this.state.push(state);
    }
  },
  get currentState() { return this.state[this.state.length - 1]; },
  get endOfSource() {
		return this.currentState.sourcePosition === this.source.length;
	},
	get sourcePosition() { return this.currentState.sourcePosition; },
	get data() { return this.source.substr(this.currentState.sourcePosition); },
	slice: function(length) {
	  return this.source.substr(this.currentState.sourcePosition, length);
	},
	get line() { return this.currentState.line; },
	get column() { return this.currentState.column; },
	computeStateMetricsWith: function(token) {
		var state = this.currentState, length = token.value.length;
		do { var char = this.source[state.sourcePosition++];
			if (char === '\n') state.line++, state.column = 1;
			else if (char === '\t') state.column += this.tabColumnWidth;
			else state.column++;
		} while (--length);
	},
	get metrics() { return "LINE: "+this.line+", COLUMN: "+this.column; },
	get claim() {
	  var claim = [];
	  this.currentState.claim.forEach(function(term) {
	    claim.push(String(term));
	  });
	  return claim.join(': ');
	},
	get fault() {
	  var snapshot = { term: this.currentState.term,
	    position: this.sourcePosition, line: this.line, column: this.column,
	    claim: this.claim, toString: SmartParser.faultToString
	  }
	  if (this.selection) snapshot.selection = this.selection;
	  else {
	    if (this.endOfSource) snapshot.selection = smartParserEndOfSource;
	    else snapshot.selection = /^(\s+|[a-z]+|[0-9]+|[^\s-~`:,;\.\?\!\='"+|\\\/\^\@#<>\$\%\&()\[\]{}]+|[^\s])/im.exec(this.data)[0]
	  }
	  delete this.selection;
	  return snapshot;
	},
	get snapshot() {
	  var snapshot = {
	    position: this.sourcePosition, line: this.line, column: this.column,
	    claim: this.claim, toString: SmartParser.snapshotToString
	  }
	  return snapshot;
	},
	get token() { return this.currentState.token; },
	parse: function(item) {
	  var status = item.match(this);
	  if (! status && ! item.possible) {
	    throw new SmartParserFault(this.failure);
	  }
	  return status;
	},
	check: function(item) {
	  var theClaim = 'parser: match: check';
	  this.beginParsingWith(theClaim);
    var status = item.match(this);	  
	  this.finishParsingWith(theClaim);
	  return status;
	},
	try: function(item) {
    var status = item.match(this);	  
    return status;
	}

}

SmartParser.faultToString = function() {
  return "LINE: "+this.line+", COLUMN: "+this.column + '; WITH THE PARSING: ' + this.claim + (this.selection?" AND FINDING: "+((this.selection===smartParserEndOfSource)?this.selection:"`"+this.selection+"'"):'');
}

SmartParser.snapshotToString = function() {
  return "LINE: "+this.line+", COLUMN: "+this.column + '; ' + this.claim;
}

function SmartParserToken(parser, length) {
  this.value = parser.slice(length), this.term = parser.currentState.term,
  this.snapshot = parser.snapshot;
  parser.token.push(this); parser.computeStateMetricsWith(this);
}

SmartParserToken.prototype = {
  constructor: SmartParserToken,
  toString: function(){ return this.value; },
  join: function() { // token, ...
    var argv = Array.from(arguments);
    this.joinAs(this.term, this.snapshot.claim, argv);
  },
  joinAs: function(term, claim, stack) { // term, claim, [tokens]
    var self = this;
    this.term = term;
    this.snapshot.claim = claim;
    stack.forEach(function(token){
      self.value += token.value;
    });
  }
}

function SmartParserTerm(claim, name) {
  this.name = name, this.type = typeof claim, this.claim = claim;
}

SmartParserTerm.sanitize = function(string) {
  return string.replace(/[\\.*+?^${}()|[\]]/g, '\\$&');
}

SmartParserTerm.withList = function(selector, group, list, mode, name) {
  var body = {selector: selector, group: group};
  var items = list.map(function(item){
    return SmartParserTerm.sanitize(item);
  });
  body.validator = RegExp('^('+items.join('|')+')$', mode);
  return new SmartParserTerm(body, name);
}

SmartParserTerm.prototype = {
  constructor: SmartParserTerm,
  match: function(parser) {
    var match = false;
    parser.beginParsingWith(this);
    if (this.type === 'function') {
        match = this.claim.call(parser, parser.data); // Boolean: create-own-tokens
    } else if (this.type === 'string') {
      var length = this.claim.length;
      match = (parser.slice(length) === (this.claim));
      if (match) new SmartParserToken(parser, length);
    } else if (this.type === 'object') {
      var sx = this.claim.selector, vx = this.claim.validator, nx = this.claim.group || 0;
      var selection = sx.exec(parser.data);
      if (selection) {
        var capture = selection[nx];
        if (vx) selection = vx.exec(capture), nx = 0;
        match = (selection != null);
        if (! match ) this.selection = capture;
      }
      if (match) new SmartParserToken(parser, selection[nx].length);
    }
    parser.finishParsingWith(this, match);
    return match;
  },
  toString: function() { return this.name; }
}

function SmartParserSequence(dictionary, claim, name) {
  var sequence = claim.replace(/,/g, '').split(' ');
  while(check = /^(possible|join|collate)\:$/i.exec(sequence[0])) {
    this[check[1]] = true; sequence.shift();
  }
  this.source = claim;
  var method = sequence.length - 2;
  if (sequence.length > 2 && /^(and|or)/i.exec(sequence[method])) {
    this.method = String.toUpperCase(sequence.splice(method, 1)[0]);
  }
  this.sequence = sequence, this.dictionary = dictionary, this.name = name;
  sequence.forEach(function(term){
    if (! dictionary[term] )
      throw new ReferenceError('SmartParserSequence: MISSING-DICTIONARY-KEY: `'+term+"'");
  });
}

SmartParserSequence.prototype = {
  constructor: SmartParserSequence,
  match: function(parser, iteration) {
    var start = parser.token.length, status = false, length = this.sequence.length;
    var or = (this.method === 'OR'), claim;
    if (! iteration ) iteration = 1;
    else iteration++;
    parser.beginParsingWith(this);
    if (this.join && iteration === 1) { claim = parser.claim; }
    var i = 0, term = this.dictionary[this.sequence[i++]];
    matching: do {
      status = term.match(parser);
      if (! status ) {
        if (or) continue matching; else break matching;
      } else if (or) break matching;
    } while (term = this.dictionary[this.sequence[i++]]);
    parser.finishParsingWith(this, status);
    if (this.collate && status) this.match(parser, iteration);
    if (this.join && status && iteration === 1) {
      var token = parser.token[start], tokens = parser.token.splice(start+1);
      token.joinAs(this, claim, tokens);
    }
    if (this.possible) status = true;
    return status;
  },
  toString: function() { return this.name; }
}