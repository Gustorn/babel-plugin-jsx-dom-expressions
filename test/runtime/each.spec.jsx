const S = require('s-js');
const { createRuntime } = require('../../lib/runtime');

const r = createRuntime({wrap: S.makeComputationNode, root: S.root, cleanup: S.cleanup, sample: S.sample});

describe('Testing an only child each control flow', () => {
  let div, disposer;
  const n1 = 'a',
    n2 = 'b',
    n3 = 'c',
    n4 = 'd';
  const list = S.data([n1, n2, n3, n4]);
  const Component = () =>
    <div ref={div}><$ each={list()}>{ item => item}</$></div>

  function apply(array) {
    list(array);
    expect(div.innerHTML).toBe(array.join(''));
    list([n1, n2, n3, n4])
    expect(div.innerHTML).toBe('abcd');
  }

  test('Create each control flow', () => {
    S.root(dispose => {
      disposer = dispose;
      <Component />
    });

    expect(div.innerHTML).toBe('abcd');
  });

  test('1 missing', () => {
    apply([    n2, n3, n4]);
    apply([n1,     n3, n4]);
    apply([n1, n2,     n4]);
    apply([n1, n2, n3    ]);
  });

  test('2 missing', () => {
    apply([        n3, n4]);
    apply([    n2,     n4]);
    apply([    n2, n3    ]);
    apply([n1,         n4]);
    apply([n1,     n3    ]);
    apply([n1, n2,       ]);
  });

  test('3 missing', () => {
    apply([n1            ]);
    apply([    n2        ]);
    apply([        n3    ]);
    apply([            n4]);
  });

  test('all missing', () => {
    apply([              ]);
  });

  test('swaps', () => {
    apply([n2, n1, n3, n4]);
    apply([n3, n2, n1, n4]);
    apply([n4, n2, n3, n1]);
  });

  test('rotations', () => {
    apply([n2, n3, n4, n1]);
    apply([n3, n4, n1, n2]);
    apply([n4, n1, n2, n3]);
  });

  test('reversal', () => {
    apply([n4, n3, n2, n1]);
  });

  test('full replace', () => {
    apply(['e', 'f', 'g', 'h']);
  });

  test('dispose', () => disposer());
});

describe('Testing an multi child each control flow', () => {
  const div = document.createElement('div');
  const n1 = 'a',
    n2 = 'b',
    n3 = 'c',
    n4 = 'd';
  const list = S.data([n1, n2, n3, n4]);
  const Component = () => <$ each={list()}>{ item => item}</$>
  let disposer;

  function apply(array) {
    list(array);
    expect(div.innerHTML).toBe(array.join(''));
    list([n1, n2, n3, n4])
    expect(div.innerHTML).toBe('abcd');
  }

  test('Create each control flow', () => {
    S.root(dispose => {
      disposer = dispose;
      div.appendChild(<Component />)
    });

    expect(div.innerHTML).toBe('abcd');
  });

  test('1 missing', () => {
    apply([    n2, n3, n4]);
    apply([n1,     n3, n4]);
    apply([n1, n2,     n4]);
    apply([n1, n2, n3    ]);
  });

  test('2 missing', () => {
    apply([        n3, n4]);
    apply([    n2,     n4]);
    apply([    n2, n3    ]);
    apply([n1,         n4]);
    apply([n1,     n3    ]);
    apply([n1, n2,       ]);
  });

  test('3 missing', () => {
    apply([n1            ]);
    apply([    n2        ]);
    apply([        n3    ]);
    apply([            n4]);
  });

  test('all missing', () => {
    apply([              ]);
  });

  test('swaps', () => {
    apply([n2, n1, n3, n4]);
    apply([n3, n2, n1, n4]);
    apply([n4, n2, n3, n1]);
  });

  test('rotations', () => {
    apply([n2, n3, n4, n1]);
    apply([n3, n4, n1, n2]);
    apply([n4, n1, n2, n3]);
  });

  test('reversal', () => {
    apply([n4, n3, n2, n1]);
  });

  test('full replace', () => {
    apply(['e', 'f', 'g', 'h']);
  });

  test('dispose', () => disposer());
});

describe('Testing an only child each control flow with fragment children', () => {
  let div, disposer;
  const n1 = 'a',
    n2 = 'b',
    n3 = 'c',
    n4 = 'd';
  const list = S.data([n1, n2, n3, n4]);
  const Component = () =>
    <div ref={div}><$ each={list()}>{ item => <>{item}{item}</>}</$></div>

  function apply(array) {
    list(array);
    expect(div.innerHTML).toBe(array.map(p => `${p}${p}`).join(''));
    list([n1, n2, n3, n4])
    expect(div.innerHTML).toBe('aabbccdd');
  }

  test('Create each control flow', () => {
    S.root(dispose => {
      disposer = dispose;
      <Component />
    });

    expect(div.innerHTML).toBe('aabbccdd');
  });

  test('1 missing', () => {
    apply([    n2, n3, n4]);
    apply([n1,     n3, n4]);
    apply([n1, n2,     n4]);
    apply([n1, n2, n3    ]);
  });

  test('2 missing', () => {
    apply([        n3, n4]);
    apply([    n2,     n4]);
    apply([    n2, n3    ]);
    apply([n1,         n4]);
    apply([n1,     n3    ]);
    apply([n1, n2,       ]);
  });

  test('3 missing', () => {
    apply([n1            ]);
    apply([    n2        ]);
    apply([        n3    ]);
    apply([            n4]);
  });

  test('all missing', () => {
    apply([              ]);
  });

  test('swaps', () => {
    apply([n2, n1, n3, n4]);
    apply([n3, n2, n1, n4]);
    apply([n4, n2, n3, n1]);
  });

  test('rotations', () => {
    apply([n2, n3, n4, n1]);
    apply([n3, n4, n1, n2]);
    apply([n4, n1, n2, n3]);
  });

  test('reversal', () => {
    apply([n4, n3, n2, n1]);
  });

  test('full replace', () => {
    apply(['e', 'f', 'g', 'h']);
  });

  test('dispose', () => disposer());
});

describe('Testing an only child each control flow with array children', () => {
  let div, disposer;
  const n1 = 'a',
    n2 = 'b',
    n3 = 'c',
    n4 = 'd';
  const list = S.data([n1, n2, n3, n4]);
  const Component = () =>
    <div ref={div}><$ each={list()}>{ item => [item, item] }</$></div>

  function apply(array) {
    list(array);
    expect(div.innerHTML).toBe(array.map(p => `${p}${p}`).join(''));
    list([n1, n2, n3, n4])
    expect(div.innerHTML).toBe('aabbccdd');
  }

  test('Create each control flow', () => {
    S.root(dispose => {
      disposer = dispose;
      <Component />
    });

    expect(div.innerHTML).toBe('aabbccdd');
  });

  test('1 missing', () => {
    apply([    n2, n3, n4]);
    apply([n1,     n3, n4]);
    apply([n1, n2,     n4]);
    apply([n1, n2, n3    ]);
  });

  test('2 missing', () => {
    apply([        n3, n4]);
    apply([    n2,     n4]);
    apply([    n2, n3    ]);
    apply([n1,         n4]);
    apply([n1,     n3    ]);
    apply([n1, n2,       ]);
  });

  test('3 missing', () => {
    apply([n1            ]);
    apply([    n2        ]);
    apply([        n3    ]);
    apply([            n4]);
  });

  test('all missing', () => {
    apply([              ]);
  });

  test('swaps', () => {
    apply([n2, n1, n3, n4]);
    apply([n3, n2, n1, n4]);
    apply([n4, n2, n3, n1]);
  });

  test('rotations', () => {
    apply([n2, n3, n4, n1]);
    apply([n3, n4, n1, n2]);
    apply([n4, n1, n2, n3]);
  });

  test('reversal', () => {
    apply([n4, n3, n2, n1]);
  });

  test('full replace', () => {
    apply(['e', 'f', 'g', 'h']);
  });

  test('dispose', () => disposer());
});