## :SMART-PARSER

### for this example of this contrivance-case-claim is for your learning of the basic-usage with the technology.

```javascript

var dictionary = (function Dictionary(){

  this.digit = new SmartParserTerm({ selector: /^[0-9]/ }, 'DIGIT');
  this['decimal-point'] = new SmartParserTerm('.', 'DECIMAL-POINT'),
  this.plus = new SmartParserTerm('+', 'PLUS');
  this.minus = new SmartParserTerm('-', 'MINUS');
  this.sign = new SmartParserSequence(this, 'possible: plus or minus', 'SIGN');
  this.digits = new SmartParserSequence(this, 'join: collate: digit', 'DIGITS');
  this.fraction = new SmartParserSequence(this, 'possible: decimal-point and digits', 'FRACTION');
  this.number = new SmartParserSequence(this, 'join: sign, digits and fraction', 'NUMBER');
  return this;
  
}).call({});

parser = new SmartParser('-123.321');

parser.parse(dictionary.number)

console.log(parser.token);

```
