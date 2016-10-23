// Algorithms
import shiftByN = require('../algorithms/shift-by-n');
import simpleSubstitution = require('../algorithms/simple-substitution');
import codebookCypher = require('../algorithms/codebook-cypher');
import doubleTransposition = require('../algorithms/double-transposition');
import electionCipher = require('../algorithms/election-cipher');

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

  describe(`Permutate Rows`, () => {
    it(`should work for 1×1 matrix`, () => {
      expect(util.permutateRows([['a']], [0])).toEqual([['a']]);
    });
    it(`should work for 2×2 matrix`, () => {
      // permutate first and second row
      expect(util.permutateRows([['a', 'b'], ['c', 'd']], [1, 0]))
        .toEqual([['c', 'd'], ['a', 'b']]);
      // do not permutate anything
      expect(util.permutateRows([['a', 'b'], ['c', 'd']], [0, 1]))
        .toEqual([['a', 'b'], ['c', 'd']]);
    });
    it(`should work for 3×3 matrix`, () => {
      expect(util.permutateRows([
        ['a', 'b', 'c'],
        ['d', 'e', 'f'],
        ['g', 'h', 'i'],
      ], [1, 2, 0])).toEqual([
        ['d', 'e', 'f'],
        ['g', 'h', 'i'],
        ['a', 'b', 'c'],
      ]);
    });
  });

  describe('Permutate Columns', () => {
    it(`should work for 1×1 matrix`, () => {
      expect(util.permutateColumns([['a']], [0])).toEqual([['a']]);
    });
    it(`should work for 2×2 matrix`, () => {
      // permutate first and second row
      expect(util.permutateColumns([['a', 'b'], ['c', 'd']], [1, 0]))
        .toEqual([['b', 'a'], ['d', 'c']]);
      // do not permutate anything
      expect(util.permutateColumns([['a', 'b'], ['c', 'd']], [0, 1]))
        .toEqual([['a', 'b'], ['c', 'd']]);
    });
    it(`should work for 3×3 matrix`, () => {
      expect(util.permutateColumns([
        ['a', 'b', 'c'],
        ['d', 'e', 'f'],
        ['g', 'h', 'i'],
      ], [1, 2, 0])).toEqual([
        ['b', 'c', 'a'],
        ['e', 'f', 'd'],
        ['h', 'i', 'g'],
      ]);
    });
  });

  describe(`Right Pad`, () => {
    it(`should add padding of a single character`, () => {
      expect(util.rightPad('foo', 10, '.')).toBe('foo.......');
    });
    it(`should add padding of more characters (fits)`, () => {
      expect(util.rightPad('foo', 7, '!?')).toBe('foo!?!?');
    });
    it(`should add padding of more characters (doesn't fit)`, () => {
      expect(util.rightPad('foo', 8, '!?')).toBe('foo!?!?!');
    });
  });

  describe(`String to Matrix`, () => {
    it(`should work when divisible`, () => {
      expect(util.stringToMatrix('abcd', 2))
        .toEqual([['a', 'b'], ['c', 'd']]);
      expect(util.stringToMatrix('abcd', 1))
        .toEqual([['a'], ['b'], ['c'], ['d']]);
      expect(util.stringToMatrix('abcd', 4))
        .toEqual([['a', 'b', 'c', 'd']]);
    });
    it(`should work when not divisible`, () => {
      expect(util.stringToMatrix('abcd', 3))
        .toEqual([['a', 'b', 'c'], ['d', 'a', 'b']]);
    });
  });

  describe(`Matrix to String`, () => {
    it(`should work with one-row matrix`, () => {
      expect(util.matrixToString([['a', 'b', 'c']])).toBe('abc');
    });
    it(`should work with one-column matrix`, () => {
      expect(util.matrixToString([['a'], ['b'], ['c']])).toBe('abc');
    });
    it(`should work with 2×2 matrix`, () => {
      expect(util.matrixToString([['a', 'b'], ['c', 'd']])).toBe('abcd');
    });
  });

  describe(`Permutate`, () => {
    it(`should work on a single-element array`, () => {
      expect(util.permutate(['foo'], [0])).toEqual(['foo']);
    })
    it(`should work on small array`, () => {
      expect(util.permutate(['foo', 'bar', 'baz'], [1, 0, 2]))
        .toEqual(['bar', 'foo', 'baz'])
    });
    it(`should work on larger array`, () => {
      expect(util.permutate(
        ['foo', 'bar', 'baz', 'FOO', 'BAR', 'BAZ'],
        [1, 3, 5, 0, 2, 4]
      )).toEqual(['bar', 'FOO', 'BAZ', 'foo', 'baz', 'BAR'])
    });
    it(`should throw if invalid permutation`, () => {
      expect(() => util.permutate(['foo', 'bar'], [0, 2])).toThrow();
      expect(() => util.permutate(['foo', 'bar'], [-1, 0])).toThrow();
      expect(() => util.permutate(['foo'], [0, 1])).toThrow();
      expect(() => util.permutate(['foo', 'bar'], [0, 1])).not.toThrow();
    });
  });

  describe(`Split Carefully`, () => {
    it(`should split on spaces`, () => {
      expect(util.splitCarefully('a b c'))
        .toEqual(['a', 'b', 'c']);
    });
    it(`should split carefully given a single prefix`, () => {
      expect(util.splitCarefully('a los b los c los d', new Set(['los'])))
        .toEqual(['a', 'los b', 'los c', 'los d']);
      expect(util.splitCarefully('a b c los b los c los d', new Set(['los'])))
        .toEqual(['a', 'b', 'c', 'los b', 'los c', 'los d']);
    });
    it(`should split carefully with multiple prefixes`, () => {
      expect(
        util.splitCarefully('a los b san c st d',
        new Set(['los', 'san', 'st']))
      )
        .toEqual(['a', 'los b', 'san c', 'st d']);
    });
    it(`should split carefully when string starts with prefix`, () => {
      expect(util.splitCarefully('los a b c', new Set(['los'])))
        .toEqual(['los a', 'b', 'c']);
    });
    it(`should split carefully when string ends with prefix`, () => {
      expect(util.splitCarefully('los a los', new Set(['los'])))
        .toEqual(['los a', 'los']);
    });
    it(`should split carefully when string is just a prefix`, () => {
      expect(util.splitCarefully('los', new Set(['los'])))
        .toEqual(['los']);
    });
    it(`should split carefully around commas, etc`, () => {
      expect(util.splitCarefully(
        'los A, los B c, los, los! Los a; los B?',
        new Set(['los'])))
          .toEqual(
            ['los A,', 'los B', 'c,', 'los,', 'los!', 'Los a;', 'los B?']
          );
    });
  });

  describe(`Add Right Padding`, () => {
    it(`should do nothing if already fits`, () => {
      expect(util.addRightPadding(['a', 'b', 'c'], 3))
        .toEqual(['a', 'b', 'c']);
      expect(util.addRightPadding(['a', 'b', 'c', 'd'], 2))
        .toEqual(['a', 'b', 'c', 'd']);
    });
    it(`should padding when missing`, () => {
      expect(util.addRightPadding(['a', 'b', 'c', 'd'], 3))
        .toEqual(['a', 'b', 'c', 'd', 'a', 'b']);
      expect(util.addRightPadding(['a', 'b', 'c', 'd', 'e'], 2))
        .toEqual(['a', 'b', 'c', 'd', 'e', 'a']);
      expect(util.addRightPadding(['a', 'b'], 3))
        .toEqual(['a', 'b', 'a']);
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

  describe(`Codebook Cypher`, () => {
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

  describe(`Double Transposition`, () => {
    it(`should work for one letter`, () => {
      expect(doubleTransposition(
        'a',
        {col: 1, columnFirst: true, per1: [0], per2: [0]}
      )).toBe('a');
    });
    it(`should work for attackatdawn example`, () => {
      expect(doubleTransposition(
        'attackatdawn',
        {col: 4, columnFirst: true, per1: [1, 3, 0, 2], per2: [2, 0, 1]}
      )).toBe('andwtaatktca');
    });
    it(`should work when the size is not perfect`, () => {
      expect(doubleTransposition(
        'abcd',
        {col: 3, columnFirst: false, per1: [1, 0], per2: [2, 1, 0]}
      )).toBe('badcba');
    });
    it(`should work a more complex example when size is not perfect`, () => {
      expect(doubleTransposition(
        'attackatdawn',
        {col: 5, columnFirst: true, per1: [1, 3, 4, 0, 2], per2: [0, 2, 1]}
      )).toBe('tacatnttwaadakt')
    });
  });

  describe(`Election 1876 Cypher`, () => {
    describe(`Encryption`, () => {
      it(`should work without prefixes with correct multipliers`, () => {
        expect(electionCipher.encrypt('hello world', [0, 1]))
          .toBe('hello world');
        expect(electionCipher.encrypt('hello world', [1, 0]))
          .toBe('world hello');
        expect(electionCipher.encrypt(
          'hello world please attack at dawn',
          [1, 0]
        ))
          .toBe('world hello attack please dawn at');
      });
      it(`should work without prefixes with padding`, () => {
        expect(electionCipher.encrypt('attack at dawn', [1, 0]))
          .toBe('at attack attack dawn');
        expect(electionCipher.encrypt('a b c d e f g h i', [3, 2, 1, 0]))
          .toBe('d c b a h g f e c b a i');
      });
      it(`should work with a prefix with correct multipliers`, () => {
        expect(electionCipher.encrypt(
          `Hey, welcome to San Francisco!`,
          [1, 0],
          new Set(['san'])
        ))
          .toBe(`welcome Hey, San Francisco! to`);
      });
      it(`should work with multiple prefixes`, () => {
        expect(electionCipher.encrypt(`a B c D`, [1, 0], new Set(['a', 'c'])))
          .toBe(`c D a B`);
      });
      it(`should work with multiple prefixes and added padding`, () => {
        expect(electionCipher.encrypt(
          `San Francisco will burn!`,
          [1, 0],
          new Set(['san'])
        )).toBe(`will San Francisco San Francisco burn!`);
      });
    });

    describe(`Inverse Key`, () => {
      it(`should work`, () => {
        expect(electionCipher.inverseKey([0, 1, 2])).toEqual([0, 1, 2]);
        expect(electionCipher.inverseKey([4, 0, 1, 3, 2]))
          .toEqual([1, 2, 4, 3, 0]);
      });
    });

    describe(`Decryption`, () => {
      it(`should work without prefixes or padding`, () => {
        const plaintext = 'hello world';
        const permutation = [1, 0];
        const ciphertext = electionCipher.encrypt(plaintext, permutation);
        expect(electionCipher.decrypt(ciphertext, permutation))
          .toBe(plaintext);
      });
      it(`should work without prefixes but with padding`, () => {
        const plaintext = 'hello world holla';
        const permutation = [1, 0];
        const ciphertext = electionCipher.encrypt(plaintext, permutation);
        expect(electionCipher.decrypt(ciphertext, permutation))
          .toBe(plaintext + ' hello');
      });
      it(`should work with prefixes but no padding`, () => {
        const plaintext = 'hello world attack at dawn';
        const permutation = [1, 0];
        const prefixes = new Set(['at']);
        const ciphertext =
          electionCipher.encrypt(plaintext, permutation, prefixes);
        expect(electionCipher.decrypt(ciphertext, permutation, prefixes))
          .toBe(plaintext);
      });
      it(`should work with prefixes and padding`, () => {
        const plaintext = 'hello world please attack at dawn';
        const permutation = [1, 0];
        const prefixes = new Set(['at']);
        const ciphertext =
          electionCipher.encrypt(plaintext, permutation, prefixes);
        expect(electionCipher.decrypt(ciphertext, permutation, prefixes))
          .toBe(plaintext + ' hello');
      });
    });
  });

  xdescribe(`One-Time-Pad`, () => {
    // TODO
  });

  xdescribe(`A5/1`, () => {

  });
});
