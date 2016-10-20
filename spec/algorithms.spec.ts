// Algorithms
import shiftByN = require('../algorithms/shift-by-n');
import simpleSubstitution = require('../algorithms/simple-substitution');
import codebookCypher = require('../algorithms/codebook-cypher');

import util = require('../util/util');

describe(`Util`, () => {
  describe(`Positive Mod`, () => {
    it(`should work just like % for positive numbers`, () => {
      expect(util.positiveMod(3, 2)).toBe(1);
      expect(util.positiveMod(1234, 123)).toBe(1234 % 123);
    });
    it(`should give positive results for negative numbers`, () => {
      expect(util.positiveMod(-3, 2)).toBe(1);
      expect(util.positiveMod(-2, 5)).toBe(3);
    });
  });

  describe(`Strip whitespace`, () => {
    it(`should strip spaces`, () => {
      expect(util.stripWhitespace('a b')).toBe('ab')
    });
    it(`should strip tabs`, () => {
      expect(util.stripWhitespace('a\tb')).toBe('ab');
    });
    it(`should strip new lines`, () => {
      expect(util.stripWhitespace('a\nb')).toBe('ab');
    });
    it(`should strip multiple whitespace characters`, () => {
      expect(util.stripWhitespace('a b c\td\te\nf\ng')).toBe('abcdefg');
    });
  });
});

describe(`Algorithm`, () => {
  describe(`Shift By N`, () => {
    it(`should work for a single letter`, () => {
      expect(shiftByN('a', 1)).toBe('b');
    });
    it(`should work for negative offset`,() => {
      expect(shiftByN('b', -1)).toBe('a');
    });
    it(`should wrap around last letter`, () => {
      expect(shiftByN('z', 1)).toBe('a');
    });
    it(`should wrap around first letter`, () => {
      expect(shiftByN('a', -1)).toBe('z');
    });
    it(`should work for more than one letter`, () => {
      expect(shiftByN('abcd', 2)).toBe('cdef');
      expect(shiftByN('lazar', 1)).toBe('mbabs');
      expect(shiftByN('lazar', -1)).toBe('kzyzq');
    });
    it(`should wrap only for some letters`, () => {
      expect(shiftByN('abyz', 1)).toBe('bcza');
      expect(shiftByN('abyz', -1)).toBe('zaxy');
    });
    it(`should strip all whitespace characters`, () => {
      expect(shiftByN('a b\tc\nd', 1)).toBe('bcde');
    });
  });

  describe(`Simple Substitution`, () => {
    // mapping first keyboard row to the second
    const map = new Map([
      ['q', 'a'],
      ['w', 's'],
      ['e', 'd'],
      ['r', 'f'],
      ['t', 'g'],
      ['y', 'h'],
      ['u', 'j'],
      ['i', 'k'],
      ['o', 'l'],
      ['p', ';'],
    ]);
    it(`should map a character`, () => {
      expect(simpleSubstitution('q', map)).toBe('a');
    });
    it(`should keep a character if its mapping is not defined`, () => {
      expect(simpleSubstitution('a', map)).toBe('a');
    });
    it(`should code a word`, () => {
      // a word using only first row of the keyboard!
      expect(simpleSubstitution('typewriter', map)).toBe('gh;dsfkgdf');
    });
    it(`should code a word when some letters are not mapped`, () => {
      expect(simpleSubstitution('instrumental', map)).toBe('knsgfjmdngal');
    });
  });

  xdescribe(`Codebook Cypher`, () => {
    const codebook = new Map([
      ['februar', '12a69e'],
      ['finansija', '247'],
    ]);
    it(`should look a word up`, () => {
      expect(codebookCypher('februar', codebook)).toBe('12a69e');
    });
    it(`should ignore words not in the codebook`, () => {
      expect(codebookCypher('foo', codebook)).toBe('foo');
    });
    it(`should work for multiple words`, () => {
      expect(codebookCypher('februar je mesec finansija', codebook))
        .toBe('12a69e je mesec 247');
    });
    it(`should ignore case`, () => {
      expect(codebookCypher('Februar je mesec FiNaNsIjA', codebook))
        .toBe('12a69e je mesec 247');
    });
  });

  xdescribe(`Double Transposition`, () => {
    // TODO
  });

  xdescribe(`Election 1896 Cypher`, () => {
    // TODO
  });

  xdescribe(`One-Time-Pad`, () => {
    // TODO
  });

  xdescribe(`A5/1`, () => {

  });
});
