## SMART-PARSER

### for these examples of this contrivance-case-claim are for your learning of the basic-usage with the technology.

```javascript
var term = SmartParserRule(/^[a-z0-9]+/i, 'TERM')
var wordSpace = SmartParserRule(' ', 'WORD-BREAKING-SPACE');
var hyphen = SmartParserRule('-', 'HYPHEN');
var softSentenceBreakSymbols = SmartParserRule(/^([\;\,\:])/, 'SOFT-SENTENCE-BREAK');
var hardSentenceBreakSymbols = SmartParserRule(/^([\!\.\?]+)/, 'HARD-SENTENCE-BREAK');
var otherSymbols = SmartParserRule(/^[^a-z0-9]/i, 'OTHER-SYMBOL'); // for the final-claim-only

var symbol = new SmartParserSequence([wordSpace, softSentenceBreakSymbols, hardSentenceBreakSymbols, OR, otherSymbols], "SPEECH")
var speech = new SmartParserSequence([term, OR, symbol], "SPEECH");

var stack = [], parser = new SmartParser("FOR THIS CLAIM OF THE SMART-SPEECH-PARSING IS WITH THIS TEXT AS AN EXAMPLE.");

while (! parser.endOfStream) {
	parser.parse(speech, stack);
	console.log(stack[stack.length-1]);
}

// for this example: optional-sequence
var NOTHING = SmartParserRule('', 'NOTHING');
var wordBreak = new SmartParserSequence([wordSpace, OR, NOTHING], 'WORD-SPACE');
var speech = new SmartParserSequence([term, AND, wordBreak], "SPEECH");

stack = [], parser.load("TOO BIG TOO FAIL");

while (! parser.endOfStream) {
	parser.parse(speech, stack);
	console.log(stack[stack.length-2]);
	console.log(stack[stack.length-1]);
}

```
