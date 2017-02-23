## :SMART-PARSER

For the parsing of the possiblities, patterns, and compounds of our digital-communications-world.
***

##### :example-contrivance-case-claim

```javascript

var dictionary = (function Dictionary(){

  var terms = this; // for the functions with the need for the back-reference.

  this.digit = new SmartParserTerm({ selector: /^[0-9]/ }, 'DIGIT');
  this['decimal-point'] = new SmartParserTerm('.', 'DECIMAL-POINT'),
  this.plus = new SmartParserTerm('+', 'PLUS');
  this.minus = new SmartParserTerm('-', 'MINUS');
  this.sign = new SmartParserSequence(this, 'possible: plus or minus', 'SIGN');
  this.digits = new SmartParserSequence(this, 'join: collate: digit', 'DIGITS');
  this.fraction = new SmartParserSequence(this, 'possible: decimal-point and digits', 'FRACTION');
  this.number = new SmartParserSequence(this, 'join: sign, digits and fraction', 'NUMBER');
  
  // :simple-list-creation
  this.fruit = SmartParserTerm.withList(/^[a-z]+/i, // :selector
    0, // for this value with the zero is for the match-group within the selector[=must be a head-match-group]
    ['APPLE', 'ORANGE', 'PEAR', 'PINEAPPLE'], 'i', // for the list as the compound-claim: /^(1|2|3|4)$/i
    'FRUIT'
  );

  this['opening-square-bracket'] = new SmartParserTerm('[', 'OPENING-SQUARE-BRACKET');
  this['closing-square-bracket'] = new SmartParserTerm(']', 'CLOSING-SQUARE-BRACKET');
  this['double-quotation-marking'] = new SmartParserTerm('"', 'DOUBLE-QUOTATION-MARKING');

this.shadowBox = function(data, start, finish, singleLine) {
    var part, closure;
    if (data[0] !== start.claim) return false;
    search: for (closure = 1; closure < data.length; closure++) {
      part = data[closure];
      if (part === finish.claim) {
        this.tokenize(++closure); return true;
      } else if (part === '\\') closure++;
      else if (singleLine && part === '\n') break search;
    }
    this.tokenize(closure);
    this.parse(finish); // [bang, you're dead]
    return false;  
  }

  // for the showing of the use-case-flexibility with the shadowBox-function
  this.box = new SmartParserTerm(function(data) {
    return terms.shadowBox.call(this, data, terms['opening-square-bracket'], terms['closing-square-bracket']);
  }, 'BOXING');

  this.quotation = new SmartParserTerm(function(data) {
    return terms.shadowBox.call(this, data, terms['double-quotation-marking'], terms['double-quotation-marking'], true);
  }, 'QUOTATION');
  
  return this;
  
}).call({});

parser = new SmartParser('-123.321');
parser.parse(dictionary.number)
console.log(parser.token);

// for the example of the selection-validation-list-creation
parser = new SmartParser('pineapple');
parser.parse(dictionary.fruit)
console.log(parser.token);

// for the example of the boxing with the quotes and line-breaking-fault
parser = new SmartParser('"123\n321"');
parser.parse(dictionary.quotation); // :dead-man's-curve

```

***
For the best-usage-testing of this example is with the script-examination-tool of your web-browser. [Tip: Firefox: Ctrl+Shift+K]
