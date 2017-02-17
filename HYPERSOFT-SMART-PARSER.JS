// of the quantum-communications-technology: smart

var smartParserParsingClaim = '; WITH THE PARSING OF THE ';

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

var jsNumberType = 'number';

SmartParserState.prototype = {
	constructor: SmartParserState,
	synchronize: function(thing) { // for the synchronization of this state's-metrics
		// :number-type-synchronization-only: voiding: "undefined" and others [:SmartParserState.prototype.synchronize.call(): safety-measure]
		if (typeof this.location === jsNumberType) thing.location = this.location;
		if (typeof this.line === jsNumberType) thing.line = this.line;
		if (typeof this.column === jsNumberType) thing.column = this.column;
		return thing;
	},
	get clone() { // for the creation of a shadow-state for the examinations with the rules and sequences
		var clone = this.synchronize(new SmartParserState(this.data, this.tabSpaces));
		clone.path = this.path.slice(0);
		return clone;
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
		if (length < 1) return; // for the scanning of the positive-values-only
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

	// :argument(1): stack: [Function, Object]: for the function-rule with a parent-"object".	
	if (typeof rule === smartParserCompoundRule && rule.constructor === Array && rule.length === 2 && typeof rule[0] === smartParserFunctionRule && typeof rule[1] === smartParserCompoundRule) {
		this.functionParent = rule[1];
		rule = rule[0];
	}
	
	this.method = typeof rule;
	
	this.rule = rule, this.name = name

	if (this.method == smartParserCompoundRule) {
		if (rule.constructor === Array) {
			// for the rule-type-validation: ["Regular Expression", AND "Regular Expression", OR Function]
			this.rule = rule[0];
			this.verification = typeof rule[1];
			this.verify = rule[1];
			if (this.verification != smartParserFunctionRule && this.verification != smartParserCompoundRule)
				throw new Error('CREATE: SMART-PARSER-RULE: WRONG-RULE-VERIFICATION-TYPE.');
			if (this.verification === smartParserCompoundRule && this.verify.constructor != RegExp)
				throw new Error('CREATE: SMART-PARSER-RULE: WRONG-RULE-VERIFICATION-TYPE.');
		}
	}
		
	// for the rule-type-validation: "Regular Expression", Function, OR String
	if (this.method == smartParserCompoundRule) {
		if (this.rule.constructor != RegExp) throw new Error('CREATE: SMART-PARSER-RULE: WRONG-RULE-TYPE.');
	} else if (this.method !== smartParserStringRule && this.method !== smartParserFunctionRule) {
		throw new Error('CREATE: SMART-PARSER-RULE: WRONG-RULE-TYPE.');
	}

}

SmartParserRule.prototype = {
	constructor: SmartParserRule,
	toString: function(){return this.name;},
	match: function(state, stack) { // for the matching of the rule with the current-state
		state.track(this.name);
		if (this.method === smartParserFunctionRule) { // for the function-type
			var match = this.rule.call(this.functionParent || this, state, stack, this);
			// :"returning": text: match or null; arguments: state, stack, rule;
			// with a parent-"object" for the calling of the function-rule as a method
			// of the parent-"object".
			if (match) {
				var token = new SmartParserToken(state, match, this);
				if (stack) { stack.push(token); return true; }
				return token;
			} else {
				if (this.faultTokenizer) {
					state.track(state.path.pop()+this.faultToken(state));
				}
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
				var text = match[0];
				if (this.verification) {
					if (this.verification === smartParserFunctionRule)
						match = this.verify.call(this.functionParent || this, state, stack, this, match);
						// :"returning": text: match or null; arguments: state, stack, rule, match[];
						// with a parent-"object" for the calling of the rule-verification-function as a method
						// of the parent-"object".
						if (! match) {
						  state.track(text);
							return null;
						}			
					else {
						match = this.verify.exec(text);
						if (! match) {
						  state.track(text);
							return null;
						}
						text = match[0];
					}
				}
				var token = new SmartParserToken(state, text, this);
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
	this.position = state.status; // for the knowledge-record of the where with this data for this selector
	this.claim = state.fault; // for the knowledge-record of the how with this data for this selector
	state.scan(data.length); // for the moving of the location of the stream-state
	state.track(); // for the voiding of the selector-blame
}

SmartParserToken.prototype = {
	constructor: SmartParserToken,
	get parsingFault() { // for the throwing of the token as a parsing-fault.
    return new ParsingFault(this.position+smartParserParsingClaim+this.claim+': `'+this.data+'\'.');
	},
	toString: function(){return this.data;}, // for the treatment of this compound as a string
	combine: function(stack, withTheClaim) { // for the lossy-compiling of a single-token with the multiple-tokens
		// for the claim of the lossy with this operation is for the loss
		// of the selector-field-data and sub-item-claim-field-data
		var location;
		if (withTheClaim) this.claim = withTheClaim; // for the modification of this claim.
		for (location = 0; location < stack.length; location++) {
			var element = stack[location];
			this.data += element.data;
			this.selector += ': '+element.selector;
		}
	}
}

var OR = 'OR',
	AND = 'AND',
	COLLATING = '...';

function SmartParserSequence(list, name) { // for the sequencing of the rules

	if (this.constructor != SmartParserSequence) return new SmartParserSequence(list, name);

	if (list.length < 3)
		throw new Error('CREATE: SMART-PARSER-SEQUENCE: MINIMUM-SEQUENCING: 2-RULES AND 1-METHOD.');
	
	if (list[list.length - 1] === COLLATING) {
		list.pop();
		this.collating = true;
		if (name === "" || name === undefined)
			throw new ReferenceError('CREATE: COLLATING-SMART-PARSER-SEQUENCE: MISSING-ITERATIVE-NAME-SPECIFICATION.')
	}
	
	this.method = list.splice(list.length-2, 1)[0];
	if (this.method != OR && this.method != AND)
		throw new Error('CREATE: SMART-PARSER-SEQUENCE: WRONG-METHOD-TYPE.');

	for (var location in list) {
		var element = list[location];
		if (! element )
			throw new Error('CREATE: SMART-PARSER-SEQUENCE: LIST-ELEMENT: '+location+': VOID-ELEMENT-CLAIM.');
		else if (element.constructor !== SmartParserSequence && element.constructor != SmartParserRule)
			throw new Error('CREATE: SMART-PARSER-SEQUENCE: LIST-ELEMENT: '+location+': WRONG-ELEMENT-TYPE.');
	}
		
	this.list = list,
	this.name = name;
	
}

SmartParserSequence.prototype = {
	constructor: SmartParserSequence,
	toString: function(){return this.name;}, // for the treatment of this compound as a string
	match: function(state, stack){ // for the matching of the rules
		if (this.name) state.track(this);
		if (this.method === AND) { // for the and-operations
			var iteration = 1, match = false;
			do {
				if (this.collating) {
					state.track('ITERATION('+iteration+')');
				}
				for (var item = 0; item < this.list.length; item++) {
					var rule = this.list[item];
					if (! (match = rule.match(state, stack))) {
						if (iteration === 1) throw new ParsingFault(state.status+smartParserParsingClaim+state.fault+'.');
						else {
							state.track();
							break;
						}	
					}
				}
				iteration++;
				if (this.collating) state.track();
			} while (this.collating && match);
		} else { // for the or-operations
			var iteration = 1, match = false;
			collating: do {
				if (this.collating) {
					state.track('ITERATION('+iteration+')');
				}
				var loop = 0, item = 0, length = this.list.length;
				var position = state.clone, trial = [];
				for (; item < length; item++) {
					var rule = this.list[item];
					try {
						if (match = rule.match(position, trial)) {
							position.synchronize(state);
							Array.prototype.push.apply(stack, trial);
							break;
						} else position.track();
					} catch (matchError) {
						if (item === (length - 1)){
							if (iteration > 1) {
								match = false;
								break;
							}
							position.synchronize(state);
							state.path = position.path.slice(0);
						} else {
							position = state.clone;
							trial = [];
							continue;
						}
					}
				}
				if (! match && iteration == 1) {
					throw new ParsingFault(state.status+smartParserParsingClaim+state.fault+'.');
				}
				iteration++;
				if (this.collating) state.track();
			} while (this.collating && match);
		}
		
		if (this.name) state.track() // for the voiding of the self-blaming
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
		this.state = new SmartParserState(String(data), tabSpaces);
	},
	synchronizeStateWith: function(thing, stack) { // for the forwards and backwards: synchronization of this state with a token or shadow-state
		/*
			for the synchronization of this state with a token is for the voiding
			of the state-modifications of the successful-parsing of the token.

			["COMMON-ENGLISH-THINKING" OF THE ABOVE-CLAIM]
			:"I tried it[=(rule/sequence)-match], but I didn't like/want it[=(rule/sequence)-match-success],
			so [re]turn to the start[=location] of it[=(rule/sequence)-match-token]".
			[it=pronoun=(supposition/opinion: void-of-fact: fiction), re=again (a+gain)=no-gain, turn=go]
			
			for the supplying of the stack is for the synchronization of the stack.	
		*/
		if (stack) {
			var location = stack.indexOf(thing);
			if (location === -1)
				throw new Error('SMART-PARSER: SYNCHRONIZE-STATE WITH THE STACK: FOREIGN-STACK-SYNCHRONIZATION-TOKEN.');
			else stack.splice(location);
		}
		SmartParserState.prototype.synchronize.call(thing, this.state);
		if (thing.path) { // for the synchronization of a possible-path.
			this.state.path = thing.path.slice(0);
		}
	},
	"parse": function(sequence, stack) { // for the verbose-matching with a sequence or rule
		// for the getting of the parsings is with the supplying of a stack
		var position = this.state.clone; // for the shadow-state
		if (sequence.match(position, (stack || []))) this.synchronizeStateWith(position);
		else throw new ParsingFault(position.status+smartParserParsingClaim+position.fault+'.');
		return true;
	},
	"try": function(sequence, stack) { // for the trying of a matching with a sequence or rule
		try {
			this.trial = []; // for the tracking of the samplings is with this stack for the trial
			var test = this.parse(sequence, this.trial);
			if (test && stack) this.merge(stack, this.trial); // for the merging of the trial-samplings with the caller's-stack
			return test;
		}
		catch (fault) { this.fault = fault; }
		return false;
	},
	merge: function(stack1, stack2) { // for the joining of the two-stacks as the one-stack
		Array.prototype.push.apply(stack1, stack2);
	},
	flatten: function(stack, withTheClaim) { // for the making of a single-smart-parser-token with the elements of a stack
		var root = stack[0], elements = stack.splice(1);
		root.combine(elements, withTheClaim);
		return root;
	}
}

