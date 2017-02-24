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
  finishParsingWith: function(term, synchronize, justify) {
    if (this.currentState.term != term)
      throw new ReferenceError('SmartParser: Finish-Parsing-Term: WRONG-STATE-CLAIM');
    if (synchronize !== true && this.possiblity === 0) {
      if (! this.failure || justify) this.failure = this.fault;
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
	    var data = String(term);
	    if (data !== 'undefined') claim.push(String(term));
	  });
	  return claim.join('-');
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
	tokenize: function(length) { return new SmartParserToken(this, length); },
	get token() { return this.currentState.token; },
	get lastToken() { var theToken = this.currentState.token,
	  claim = theToken.length -1; return theToken[claim];
  },
	parse: function(dictionary, item) {
	  if (item) {
	    var script = item; item = dictionary[item];
	    if (! item && /[ :]/g.exec(script))
	      item = new SmartParserSequence(dictionary, script);
	  } else item = dictionary;
	  var status = item.match(this);
	  if (! status && ! item.possible) {
	    throw new SmartParserFault(this.failure);
	  }
	  return status;
	},
	check: function(dictionary, item) {
	  if (item) {
	    var script = item; item = dictionary[item];
	    if (! item && /[ :]/g.exec(script))
	      item = new SmartParserSequence(dictionary, script);
	  } else item = dictionary;
	  var theClaim = 'parser-match-check';
	  this.beginParsingWith(theClaim);
    var status = item.match(this);	  
	  this.finishParsingWith(theClaim);
	  return status;
	},
	try: function(dictionary, item) {
	  if (item) {
	    var script = item; item = dictionary[item];
	    if (! item && /[ :]/g.exec(script))
	      item = new SmartParserSequence(dictionary, script);
	  } else item = dictionary;
    var status = item.match(this);	  
    return status;
	}

}

SmartParser.faultToString = function() {
  return "LINE: "+this.line+", COLUMN: "+this.column + '; WITH THE PARSING OF THE ' + this.claim + (this.selection?" AND FINDING: "+((this.selection===smartParserEndOfSource)?this.selection:"`"+this.selection+"'"):'');
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
    var self = this, claims = [this.snapshot.claim];
    this.term = term;
    stack.forEach(function(token){
      self.value += token.value;
      claims.push(token.snapshot.claim);
    });
    var rootMatch = new RegExp(claim+'-', 'g'), final = claims.pop();
    this.snapshot.claim = (claim+': '+claims.join(', ').replace(rootMatch, '')+' AND '+final.replace(rootMatch, ''));
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
      var sx = this.claim.selector, vx = this.claim.validator, nx = this.claim.group || 0,
      fx = (typeof vx === 'function');
      var selection = sx.exec(parser.data);
      if (selection) {
        var capture = selection[nx];
        if (vx) { // with a validator
          if ( fx ) match = vx.call(parser, capture); // of a boolean-function-creating-own-tokens
          else { // of a compound-claim
            selection = vx.exec(capture); match = (selection != null);
            if (match) new SmartParserToken(parser, selection[0].length)
          } 
          if (! match ) this.selection = capture; // for the logging of the false-capture
        } else { // with the selection-only
          match = true;
          new SmartParserToken(parser, capture.length)
        }
      } // selection-failure
    }
    parser.finishParsingWith(this, match);
    return match;
  },
  toString: function() { return this.name; }
}

function SmartParserSequence(dictionary, claim, name) {
  this.dictionary = dictionary;
  this.configureAs(claim, name);
}

SmartParserSequence.prototype = {
  constructor: SmartParserSequence,
  configureAs: function(claim, name) { // for the creation and modification.
    delete this.possible, this.join, this.collate, this.method;
    var sequence = claim.replace(/,/g, '').split(' ');
    while(check = /^(possible|join|collate)\:$/i.exec(sequence[0])) {
      this[check[1]] = true; sequence.shift();
    }
    this.source = claim;
    var method = sequence.length - 2;
    if (sequence.length > 2 && /^(and|or)/i.exec(sequence[method])) {
      this.method = String.toUpperCase(sequence.splice(method, 1)[0]);
    }
    this.sequence = sequence, this.name = name;
    var self = this;
    sequence.forEach(function(term){
      if (! self.dictionary[term] )
        throw new ReferenceError('SmartParserSequence: MISSING-DICTIONARY-KEY: `'+term+"'");
    });  
  },
  match: function(parser, iteration) {
    var start = parser.token.length, status = false, length = this.sequence.length;
    var or = (this.method === 'OR'), claim;
    if (! iteration ) iteration = 1;
    else iteration++;
    parser.beginParsingWith(this);
    if (this.join && iteration === 1) { claim = parser.claim; }
    var i = 0, term;
    matching: for (i = 0; i < length; i++) {
      term = this.dictionary[this.sequence[i]]
      status = term.match(parser);
      if (! status ) {
        if (or) continue matching; else break matching;
      } else if (or) break matching;
    }
    var correction = (i === length && term.constructor !== SmartParserSequence);
    parser.finishParsingWith(this, status, correction);
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

SmartParserSymbols = (function SmartParserSymbols(){

  // :ZERO-SEQUENCING: PURE-SYMBOLOGY FOR YOUR USAGE AS A DICTIONARY-MODEL[=PROTOTYPE].
  // FOR THE VOID OF THE [RE]CREATING OF A "WHEEL"=CONSTANT.

  // :EXAMPLE: yourModel = Object.create(SmartParserSymbols);
  
  this['at-sign'] = new SmartParserTerm('@', 'AT-SIGN');
  this['ampersand'] = new SmartParserTerm('&', 'AMPERSAND');  
  this['and-sign'] = new SmartParserTerm('&', 'AND-SIGN');
  this['star-sign'] = new SmartParserTerm('*', 'STAR-SIGN');
  this['dollar-currency-sign'] = new SmartParserTerm('$', 'DOLLAR-CURRENCY-SIGN');
  this['percent-sign'] = new SmartParserTerm('%', 'PERCENT-SIGN');
  this['vertical-bar'] = new SmartParserTerm('|', 'VERTICAL-BAR');
  this['circumflex'] = new SmartParserTerm('^', 'CIRCUMFLEX');
  this['section-mark'] = new SmartParserTerm('§', 'SECTION-MARK');
  this['copyright-sign'] = new SmartParserTerm('©', 'COPYRIGHT-SIGN');
  this['registration-mark'] = new SmartParserTerm('®', 'REGISTRATION-MARK');
  this['degree-sign'] = new SmartParserTerm('°', 'DEGREE-SIGN');
  this['cent-sign'] = new SmartParserTerm('¢', 'CENT-SIGN');
  this['hash-mark'] = new SmartParserTerm('#', 'HASH-MARK');
  this['service-mark'] = new SmartParserTerm('℠', 'SERVICE-MARK');
  this['trade-mark'] = new SmartParserTerm('™', 'TRADE-MARK');
  this['degrees-celsius-mark'] = new SmartParserTerm('℃', 'DEGREES-CELSIUS-MARK');
  this['degrees-fahrenheit-mark'] = new SmartParserTerm('℉', 'DEGREES-FAHRENHEIT-MARK');
  this['care-of-mark'] = new SmartParserTerm('℅', 'CARE-OF-MARK');
  this['horizontal-ellipsis'] = new SmartParserTerm('…', 'HORIZONTAL-ELLIPSIS');
  this['vertical-ellipsis'] = new SmartParserTerm('⋮', 'VERTICAL-ELLIPSIS');
  this['telephone-sign'] = new SmartParserTerm('℡', 'TELEPHONE-SIGN');
  this['fax-sign'] = new SmartParserTerm('℻', 'FAX-SIGN');
  this['numero-sign'] = new SmartParserTerm('№', 'NUMERO-SIGN');
  this['phonorecord-sign'] = new SmartParserTerm('℗', 'PHONORECORD-SIGN');
  this['middle-dot'] = new SmartParserTerm('·', 'MIDDLE-DOT');

  this.apostrophe = new SmartParserTerm("'", 'APOSTROPHE');
  this.comma = new SmartParserTerm(',', 'COMMA');
  this['full-colon'] = new SmartParserTerm(':', 'FULL-COLON');
  this['semi-colon'] = new SmartParserTerm(';', 'SEMI-COLON');
  this.tilde = new SmartParserTerm('~', 'TILDE');
  this.hyphen = new SmartParserTerm('-', 'HYPHEN');
  this['bang-mark'] = new SmartParserTerm('!', 'BANG-MARK');
  this['question-mark'] = new SmartParserTerm('?', 'QUESTION-MARK');
  this['quotation-mark'] = new SmartParserTerm('"', 'QUESTION-MARK');
  this['full-stop'] = new SmartParserTerm('.', 'FULL-STOP');

  this['less-than-bracket'] = new SmartParserTerm('<', 'LESS-THAN-BRACKET');
  this['more-than-bracket'] = new SmartParserTerm('>', 'MORE-THAN-BRACKET');
  this['low-line'] = new SmartParserTerm('_', 'LOW-LINE');
  this['opening-curly-bracket'] = new SmartParserTerm('{', 'OPENING-CURLY-BRACKET');
  this['closing-curly-bracket'] = new SmartParserTerm('}', 'CLOSING-CURLY-BRACKET');
  this['double-quotation-marking'] = new SmartParserTerm('"', 'DOUBLE-QUOTATION-MARKING');
  this['opening-parenthesis'] = new SmartParserTerm('(', 'OPENING-PARENTHESIS');
  this['closing-parenthesis'] = new SmartParserTerm(')', 'CLOSING-PARENTHESIS');
  this['opening-square-bracket'] = new SmartParserTerm('[', 'OPENING-SQUARE-BRACKET');
  this['closing-square-bracket'] = new SmartParserTerm(']', 'CLOSING-SQUARE-BRACKET');

  this['forward-solidus'] = new SmartParserTerm('/', 'FORWARD-SOLIDUS');
  this['backward-solidus'] = new SmartParserTerm('\\', 'BACKWARD-SOLIDUS');

  this['lower-case-letter'] = new SmartParserTerm({ selector: /^[a-z]/ }, 'LOWER-CASE-LETTER');
  this['upper-case-letter'] = new SmartParserTerm({ selector: /^[A-Z]/ }, 'UPPER-CASE-LETTER');
  
  this['numeric-digit'] = new SmartParserTerm({ selector: /^[0-9]/ }, 'DIGIT');
  this['decimal-point'] = new SmartParserTerm('.', 'DECIMAL-POINT'),
  this['plus-sign'] = new SmartParserTerm('+', 'PLUS-SIGN');
  this['minus-sign'] = new SmartParserTerm('-', 'MINUS-SIGN');
  this['equals-sign'] = new SmartParserTerm('=', 'EQUALS-SIGN');
  this['division-sign'] = new SmartParserTerm('÷', 'DIVISION-SIGN');
  this['multiplication-sign'] = new SmartParserTerm('×', 'MULTIPLICATION-SIGN');
  
  this['single-space'] = new SmartParserTerm(' ', 'SINGLE-SPACE');
  this['horizontal-tab'] = new SmartParserTerm('\t', 'HORIZONTAL-TAB');
  this['vertical-tab'] = new SmartParserTerm('\v', 'VERTICAL-TAB');
  this['end-line'] = new SmartParserTerm('\r', 'END-LINE');
  this['start-line'] = new SmartParserTerm('\n', 'START-LINE');
  this['form-feed'] = new SmartParserTerm('\f', 'FORM-FEED');

  this.classify = function(data) {
    var parser = new SmartParser(data), terms = [];
    for (key in this) {
      if (parser.check(this, key)) terms.push(this[key]);
    }
    return terms.length?terms:null;
  }

  return this;
    
}).call({});
