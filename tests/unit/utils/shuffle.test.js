const shuffle = require('../../../utils/shuffle');

describe('shuffle', () => {
  it('should return a permutation of the original array', () => {
    const input = ['Alice', 'Bob', 'Connor', 'Diana'];
    const shuffled = shuffle(input);

    expect(shuffled.length).toBe(input.length);

    expect(shuffled.sort()).toStrictEqual(input.sort());
  });

  it('should not return the same order most of the time', () => {
    const input = ['Alice', 'Bob', 'Connor', 'Diana'];

    let differentOrderCount = 0;
    for (let i = 0; i < 10; i++) {
      const result = shuffle(input);
      if (result.join() !== input.join()) {
        differentOrderCount++;
      }
    }

    expect(differentOrderCount).toBeGreaterThanOrEqual(5);
  });

  it('should not mutate the original array', () => {
    const input = ['Alice', 'Bob', 'Connor', 'Diana'];
    const original = [...input];

    const result = shuffle(input);

    expect(input).toStrictEqual(original);
  });
});