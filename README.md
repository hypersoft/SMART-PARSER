## :SMART-PARSER

### for these examples of this contrivance-case-claim are for your learning of the basic-usage with the technology.

```javascript
var term = SmartParserRule(/^[a-z0-9]+/i, 'TERM')
var wordSpace = SmartParserRule(' ', 'WORD-BREAKING-SPACE');
var hyphen = SmartParserRule('-', 'HYPHEN');
var softSentenceBreakSymbols = SmartParserRule(/^([\;\,\:])/, 'SOFT-SENTENCE-BREAK');
var hardSentenceBreakSymbols = SmartParserRule(/^([\!\.\?]+)/, 'HARD-SENTENCE-BREAK');
var otherSymbols = SmartParserRule(/^[^a-z0-9]/i, 'OTHER-SYMBOL'); // for the final-claim-only

var symbol = new SmartParserSequence([hyphen, wordSpace, softSentenceBreakSymbols, hardSentenceBreakSymbols, OR, otherSymbols], "SYMBOL")
var speech = new SmartParserSequence([term, OR, symbol], "SPEECH");

var stack = [], parser = new SmartParser("FOR THIS CLAIM OF THE SMART-SPEECH-PARSING IS WITH THIS TEXT AS AN EXAMPLE.");

while (! parser.endOfStream) {
	parser.parse(speech, stack);
	console.log(stack[stack.length-1]);
}
```

### :second-example

```javascript
// for this example: possibility-sequence [optional-sequence-claim]
var NOTHING = SmartParserRule('', 'VOID');
var wordSpace = SmartParserRule(' ', 'WORD-BREAKING-SPACE');
var term = SmartParserRule(/^[^\s]+/, 'TERM')
var wordBreak = new SmartParserSequence([wordSpace, OR, NOTHING], 'WORD-BREAK');
var neverFails = new SmartParserSequence([term, AND, wordBreak], "SPEECH");

var stack = [], parser = new SmartParser("FOR THIS CLAIM OF THE TOO-BIG FOR THE FAILURE WITH THE MISSING-SPACE-SEQUENCE-CLAIM");

while (! parser.endOfStream) {
	parser.parse(neverFails, stack);
	console.log(stack[stack.length-2]);
	console.log(stack[stack.length-1]);
}

```

### :third-example

```javascript
// for this example: token-certification: tokenization with a validation-match
var NOTHING = SmartParserRule('', 'VOID');
var wordSpace = SmartParserRule(' ', 'WORD-SPACE');
var fullColon = SmartParserRule(':', 'FULL-COLON');

var position = SmartParserRule([
	/^[^\s]+/, // for the keyword-tokenization with the automatic-token-fault-tracking
	/^(BY|FOR|OF|WITHIN|WITH|AS|AFTER|BEFORE|ON|IN|OUT|THROUGH)$/i // for the validation
], 'POSITION');

var lodial = SmartParserRule([
	/^[^\s]+/, // for the keyword-tokenization with the automatic-token-fault-tracking
	/^(ANY|AN|A|MY|YOUR|HER|HIS|OUR|THEIR|THIS|THAT|THESE|THE|THOSE|OTHER)$/i // for the validation
], 'LODIAL');

var fact = SmartParserRule(/^[^\s:]+/, 'FACT-TERM'); // for the tokenization-only

var possibleWordSpace = new SmartParserSequence([wordSpace, OR, NOTHING], 'WORD-BREAK');

var continuingFactPhrase = new SmartParserSequence([fullColon, wordSpace, fact, AND, possibleWordSpace], 'CONTINUING-FACT-PHRASE');
var semiFactPhrase = SmartParserSequence([fullColon, fact, AND, possibleWordSpace], 'SEMI-FACT-PHRASE'); // for the tokenization-only
var fullFactPhrase = new SmartParserSequence([position, wordSpace, lodial, wordSpace, fact, AND, possibleWordSpace], "FACT-PHRASE");

var factPhrase = new SmartParserSequence([continuingFactPhrase, semiFactPhrase, OR, fullFactPhrase])

var stack = [], parser = new SmartParser(":EXAMPLE: CLAIM: GOING OFF THIS CLIFF");

// ":[FOR THIS ]EXAMPLE"
parser.parse(factPhrase, stack);
console.log(stack);
stack = []; // :clearing-stack

// ":[OF/WITH THE/THIS] CLAIM"
parser.parse(factPhrase, stack);
console.log(stack);
stack = []; // :clearing-stack

// ":[OF THE/THIS] GOING"
parser.parse(factPhrase, stack);
console.log(stack);
stack = []; // :clearing-stack

// "OFF THIS CLIFF"
parser.parse(factPhrase, stack);
// :fault: for the tokenization of the 'OFF' is with the lack of the position-term-certification.
```

### :fourth-example

```javascript
// for this example: sequence-collation [repeating sequence: see "var factPhrase": sequence-rules]
var NOTHING = SmartParserRule('', 'VOID');
var wordSpace = SmartParserRule(' ', 'WORD-SPACE');
var fullColon = SmartParserRule(':', 'FULL-COLON');

var position = SmartParserRule([
	/^[^\s]+/, // for the keyword-tokenization with the automatic-token-fault-tracking
	/^(BY|FOR|OF|WITHIN|WITH|AS|AFTER|BEFORE|ON|IN|OUT|THROUGH)$/i // for the validation
], 'POSITION');

var lodial = SmartParserRule([
	/^[^\s]+/, // for the keyword-tokenization with the automatic-token-fault-tracking
	/^(ANY|AN|A|MY|YOUR|HER|HIS|OUR|THEIR|THIS|THAT|THESE|THE|THOSE|OTHER)$/i // for the validation
], 'LODIAL');

var fact = SmartParserRule(/^[^\s:]+/, 'FACT-TERM'); // for the tokenization-only

var possibleWordSpace = new SmartParserSequence([wordSpace, OR, NOTHING], 'WORD-BREAK');

var continuingFactPhrase = new SmartParserSequence([fullColon, wordSpace, fact, AND, possibleWordSpace], 'CONTINUING-FACT-PHRASE');
var semiFactPhrase = SmartParserSequence([fullColon, fact, AND, possibleWordSpace], 'SEMI-FACT-PHRASE'); // for the tokenization-only
var fullFactPhrase = new SmartParserSequence([position, wordSpace, lodial, wordSpace, fact, AND, possibleWordSpace]);
var factPhrase = new SmartParserSequence([continuingFactPhrase, semiFactPhrase, OR, fullFactPhrase, COLLATING], 'FACT-PHRASE');

var stack = [], parser = new SmartParser("FOR THIS MATCH OF THE MATCHING");

parser.parse(factPhrase, stack);
console.log(stack);
```
