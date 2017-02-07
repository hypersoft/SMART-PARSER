# SMART-PARSER

## for the customary: hello-world

```javascript
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
```
