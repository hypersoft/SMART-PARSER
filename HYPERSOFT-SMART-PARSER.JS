// of the quantum-communications-technology: smart

function ParsingFault(message) { // for the claiming of a parsing-fault
  this.name = 'PARSING-FAULT';
  this.message = message || 'PARSING-FAULT';
  this.stack = (new Error()).stack;
}
ParsingFault.prototype = Object.create(Error.prototype);
ParsingFault.prototype.constructor = ParsingFault;

function SmartParserState(data, tabSpaces) { // for the tracking of the parsing-metrics

	this.data = data
	this.tabSpaces = tabSpaces || 4;
	this.location = 0, this.line = 1, this.column = 1;

	this.path = []; // for the fault-tracking of the rules and sequences;
}

SmartParserState.prototype = {
	constructor: SmartParserState,
	synchronize: function(thing) { // for the synchronization of this state's-metrics
		thing.location = this.location,
		thing.line = this.line,
		thing.column = this.column;
		return thing;
	},
	get clone() { // for the creation of a shadow-state for the examinations with the rules and sequences
		return this.synchronize(new SmartParserState(this.data, this.tabSpaces));
	},
	get stream() { // for the getting of the current-sequence
		return this.data.substr(this.location);
	},
	streamPart: function(length) { // for the examination of a known-sequence within the current-sequence
		return this.data.substr(this.location, length);	
	},
	get status(){ // for the visual-stream-examination-claim
		return 'LINE: '+this.line+', COLUMN: '+this.column;
	},
	scan: function(length) { // for the calculating of this state's-metrics
		do {
			if (this.location >= this.data.length) break;
			var char = this.data[this.location++];
			if (char === '\n') this.line++, this.column = 1;
			else if (char === '\t') this.column += this.tabSpaces;
			else this.column++;
		} while (--length);
	},
	track: function(rule) { // for the claiming/voiding of a rule or sequence of the parsing for the blaming of the faults
		if (rule) this.path.push(rule);
		else this.path.pop();
	},
	get fault() { // for the visual-fault-examination-claim
		return this.path.join(': ');
	}
}

var smartParserFunctionRule = 'function',
	smartParserStringRule = 'string',
	smartParserCompoundRule = 'object';

function SmartParserRule(rule, name) {

	if (this.constructor !== SmartParserRule) return new SmartParserRule(rule, name);
	
	this.rule = rule, this.name = name, this.method = typeof rule;

	// for the rule-type-validation: "Regular Expression", Function OR String
	if (this.method == smartParserCompoundRule) {
		 if (rule.constructor != RegExp) throw new Error('CREATE: SMART-PARSER-RULE: WRONG-RULE-TYPE.');
	} else if (this.method !== smartParserStringRule && this.method !== smartParserFunctionRule) {
		throw new Error('CREATE: SMART-PARSER-RULE: WRONG-RULE-TYPE.');
	}

}

SmartParserRule.prototype = {
	constructor: SmartParserRule,
	toString: function(){return this.name;},
	match: function(state, stack) { // for the matching of the rule with the curent-state
		state.track(this);
		if (this.method === smartParserFunctionRule) { // for the function-type
			var match = this.rule(state); // "returning": text: match or null
			if (match) {
				var token = new SmartParserToken(state, match, this);
				if (stack) { stack.push(token); return true; }
				return token;
			}
		} else if (this.method === smartParserStringRule) { // for the string-type
			var data = state.streamPart(this.rule.length);
			if (data === this.rule) {
				var token = new SmartParserToken(state, data, this);
				if (stack) { stack.push(token); return true; }
				return token;
			}
		} else { // for the logical/mathematical-compound-sequence-claim [regular expression]
			var match = this.rule.exec(state.stream);
			if (match) {
				var token = new SmartParserToken(state, match[0], this);
				if (stack) { stack.push(token); return true; }
				return token;
			}
		}
		return null;
	}
}

function SmartParserToken(state, data, selector) { // for the capturing of the data and metrics within the current-state
	state.synchronize(this); // for the copying of the state's-metrics
	this.data = data, this.selector = selector;
	state.scan(data.length); // for the moving of the location of the stream-state
	state.track(); // for the voiding of the selector-blame
}

SmartParserToken.prototype = {
	constructor: SmartParserToken,
	toString: function(){return this.data;}, // for the treatment of this compound as a string
	combine: function(stack) { // for the lossless-compiling of a single-token with the multiple-tokens
		var location;
		for (location = 0; location < stack.length; location++) {
			var element = stack[location];
			this.data += element.data;
			this.selector += ': '+element.selector;
		}	
	}
}

var OR = 'OR',
	AND = 'AND';

function SmartParserSequence(list, name) {

	if (this.constructor != SmartParserSequence) return new SmartParserSequence(method, list, name);

	if (list.length < 3)
		throw new Error('CREATE: SMART-PARSER-SEQUENCE: MINIMUM-SEQUENCING: 2-RULES AND 1-METHOD.');
		
	this.method = list.splice(list.length-2, 1)[0];
	if (this.method != OR && this.method != AND)
		throw new Error('CREATE: SMART-PARSER-SEQUENCE: WRONG-METHOD-TYPE.');

	for (var location in list) {
		var element = list[location];
		if (element.constructor !== SmartParserSequence && element.constructor != SmartParserRule)
			throw new Error('CREATE: SMART-PARSER-SEQUENCE: LIST-ELEMENT: '+location+': WRONG-ELEMENT-TYPE.');
	}
	
	this.list = list,
	this.name = name;
	
}

SmartParserSequence.prototype = {
	constructor: SmartParserSequence,
	toString: function(){return this.name;}, // for the treatment of this compound as a string
	match: function(state, stack){ // for the matching of the rules
		state.track(this);
		if (this.method === AND) { // for the and-operations
			for (var item = 0; item < this.list.length; item++) {
				var rule = this.list[item];
				if (! rule.match(state, stack)) throw new ParsingFault(state.status+'; WITH THE PARSING OF THE '+state.fault+'.');
			}
		} else { // for the or-operations
			var match;
			for (var item = 0; item < this.list.length; item++) {
				var rule = this.list[item];
				if (match = rule.match(state, stack)) break;
				else state.track(); // for the voiding of the trial-blaming
			}
			if (! match ) throw new ParsingFault(state.status+'; WITH THE PARSING OF THE '+state.fault+'.');
		}	
		state.track() // for the voiding of the self-blaming
		return true;
	}
}

function SmartParser(data, tabSpaces) { // for the creation of a parser-compound

	if (this.constructor != SmartParser) return new SmartParser(data, tabSpaces);
	this.load(data, tabSpaces);
	
}

SmartParser.prototype = {
	constructor: SmartParser,
	get endOfStream() { // for the checking of the operations-completion
		return this.state.location == this.state.data.length;
	},
	load: function(data, tabSpaces) { // for the taking of the new-data
		delete this.state;
		this.state = new SmartParserState(data, tabSpaces);
	},
	"parse": function(sequence, stack) { // for the verbose-matching with a sequence or rule
		// for the getting of the parsings is with the supplying of a stack
		var position = this.state.clone;
		if (sequence.match(position, (stack || []))) position.synchronize(this.state);
		else throw new ParsingFault(position.status+'; WITH THE PARSING OF THE '+position.fault+'.');
		return true;
	},
	"try": function(sequence, stack) { // for the trying of a matching with a sequence or rule
		// for the getting of the parsings is with the supplying of a stack
		try { return this.parse(sequence, stack); }
		catch (fault) { this.fault = fault; }
		return false;
	},
	merge: function(stack1, stack2) { // for the joining of the two-stacks
		Array.prototype.push.apply(stack1, stack2);
	},
	flatten: function(stack) { // for the making of a single-smart-parser-token with the elements of a stack
		var root = stack[0], elements = stack.splice(1);
		root.combine(elements);
		return root;
	}
}

/* for the customary: hello-world

var greeting = SmartParserRule(/^hello/i, 'GREETING');
var wordBreak = SmartParserRule(' ', 'WORD-BREAKING-SPACE');
var fact = SmartParserRule(/^[^\s]+$/, "FACT");

var standardGreeting = new SmartParserSequence([greeting, wordBreak, AND, fact], "STANDARD-GREETING");

var stack = []; // for the token-collection-stack
var parser = new SmartParser("HELLO WORLD");

parser.parse(standardGreeting, stack);

console.log('PARSINGS:');
console.log(stack);
console.log('STREAM-ENDING: '+parser.endOfStream);

*/
