const { createRuntime } = require('../../lib/runtime');
const r = createRuntime({wrap: fn => fn()});

describe("r.insert", () => {
  // <div>before<!-- insert -->after</div>
  const container = document.createElement("div");

  it("inserts nothing for null", () => {
    const res = insert(null);
    expect(res.innerHTML).toBe("");
    expect(res.childNodes.length).toBe(0);
  });

  it("inserts nothing for undefined", () => {
    const res = insert(undefined);
    expect(res.innerHTML).toBe("");
    expect(res.childNodes.length).toBe(0);
  });

  it("inserts nothing for false", () => {
    const res = insert(false);
    expect(res.innerHTML).toBe("");
    expect(res.childNodes.length).toBe(0);
  });

  it("inserts nothing for true", () => {
    const res = insert(true);
    expect(res.innerHTML).toBe("");
    expect(res.childNodes.length).toBe(0);
  });

  it("inserts nothing for null in array", () => {
    const res = insert(["a", null, "b"]);
    expect(res.innerHTML).toBe("ab");
    expect(res.childNodes.length).toBe(2);
  });

  it("inserts nothing for undefined in array", () => {
    const res = insert(["a", undefined, "b"]);
    expect(res.innerHTML).toBe("ab");
    expect(res.childNodes.length).toBe(2);
  });

  it("inserts nothing for false in array", () => {
    const res = insert(["a", false, "b"]);
    expect(res.innerHTML).toBe("ab");
    expect(res.childNodes.length).toBe(2);
  });

  it("inserts nothing for true in array", () => {
    const res = insert(["a", true, "b"]);
    expect(res.innerHTML).toBe("ab");
    expect(res.childNodes.length).toBe(2);
  });

  it("can insert strings", () => {
    const res = insert("foo");
    expect(res.innerHTML).toBe("foo");
    expect(res.childNodes.length).toBe(1);
  });

  it("can insert a node", () => {
    const node = document.createElement("span");
    node.textContent = "foo";
    expect(insert(node).innerHTML).toBe("<span>foo</span>");
  });

  it("can re-insert a node, thereby moving it", () => {
    const node = document.createElement("span");
    node.textContent = "foo";

    const first = insert(node),
      second = insert(node);

    expect(first.innerHTML).toBe("");
    expect(second.innerHTML).toBe("<span>foo</span>");
  });

  it('can spread over element', () => {
    const node = document.createElement("span");
    r.spread(node, () => ({href: '/', for: 'id', classList: {danger: true}, events: {custom: e => e}, style: {color: 'red'}, something: 'good'}))
    expect(node.getAttribute('href')).toBe('/');
    expect(node.htmlFor).toBe('id');
    expect(node.className).toBe('danger');
    expect(node.style.color).toBe('red');
    expect(node.something).toBe('good');
  })

  it("can insert an array of strings", () => {
    expect(insert(["foo", "bar"]).innerHTML).toBe("foobar", "array of strings");
  });

  it("can insert an array of nodes", () => {
    const nodes = [ document.createElement("span"), document.createElement("div")];
    nodes[0].textContent = "foo";
    nodes[1].textContent = "bar";
    expect(insert(nodes).innerHTML).toBe("<span>foo</span><div>bar</div>");
  });

  it("can insert a changing array of nodes", () => {
    var parent = document.createElement("div"),
      current = "",
      n1 = document.createElement("span"),
      n2 = document.createElement("div"),
      n3 = document.createElement("span"),
      n4 = document.createElement("div");
      orig = [n1, n2, n3, n4];

    n1.textContent = "1";
    n2.textContent = "2";
    n3.textContent = "3"
    n4.textContent = "4";

    var origExpected = expected(orig)

    // identity
    test([n1, n2, n3, n4]);

    // 1 missing
    test([    n2, n3, n4]);
    test([n1,     n3, n4]);
    test([n1, n2,     n4]);
    test([n1, n2, n3    ]);

    // 2 missing
    test([        n3, n4]);
    test([    n2,     n4]);
    test([    n2, n3    ]);
    test([n1,         n4]);
    test([n1,     n3    ]);
    test([n1, n2,       ]);

    // 3 missing
    test([n1            ]);
    test([    n2        ]);
    test([        n3    ]);
    test([            n4]);

    // all missing
    test([              ]);

    // swaps
    test([n2, n1, n3, n4]);
    test([n3, n2, n1, n4]);
    test([n4, n2, n3, n1]);

    // rotations
    test([n2, n3, n4, n1]);
    test([n3, n4, n1, n2]);
    test([n4, n1, n2, n3]);

    // reversal
    test([n4, n3, n2, n1]);

    function test(array) {
      current = r.insert(parent, array, current);
      expect(parent.innerHTML).toBe(expected(array));
      current = r.insert(parent, orig, current);
      expect(parent.innerHTML).toBe(origExpected);
    }

    function expected(array) {
      return array.map(n => n.outerHTML).join("");
    }
  });

  it("can insert nested arrays", () => {
    expect(insert(["foo", ["bar", "blech"]]).innerHTML)
    .toBe("foobarblech", "array of array of strings");
  });

  function insert(val) {
    const parent = container.cloneNode(true);
    r.insert(parent, val);
    return parent;
  }
});

describe("r.insert with Markers", () => {
  // <div>before<!-- insert -->after</div>
  var container = document.createElement("div");
  container.appendChild(document.createTextNode("before"));
  container.appendChild(document.createTextNode(""));
  container.appendChild(document.createTextNode("after"));

  it("inserts nothing for null", () => {
    const res = insert(null);
    expect(res.innerHTML).toBe("beforeafter");
    expect(res.childNodes.length).toBe(3);
  });

  it("inserts nothing for undefined", () => {
    const res = insert(undefined);
    expect(res.innerHTML).toBe("beforeafter");
    expect(res.childNodes.length).toBe(3);
  });

  it("inserts nothing for false", () => {
    const res = insert(false);
    expect(res.innerHTML).toBe("beforeafter");
    expect(res.childNodes.length).toBe(3);
  });

  it("inserts nothing for true", () => {
    const res = insert(true);
    expect(res.innerHTML).toBe("beforeafter");
    expect(res.childNodes.length).toBe(3);
  });

  it("inserts nothing for null in array", () => {
    const res = insert(["a", null, "b"]);
    expect(res.innerHTML).toBe("beforeabafter");
    expect(res.childNodes.length).toBe(5);
  });

  it("inserts nothing for undefined in array", () => {
    const res = insert(["a", undefined, "b"]);
    expect(res.innerHTML).toBe("beforeabafter");
    expect(res.childNodes.length).toBe(5);
  });

  it("inserts nothing for false in array", () => {
    const res = insert(["a", false, "b"]);
    expect(res.innerHTML).toBe("beforeabafter");
    expect(res.childNodes.length).toBe(5);
  });

  it("inserts nothing for true in array", () => {
    const res = insert(["a", true, "b"]);
    expect(res.innerHTML).toBe("beforeabafter");
    expect(res.childNodes.length).toBe(5);
  });

  it("can insert strings", () => {
    const res = insert("foo");
    expect(res.innerHTML).toBe("beforefooafter");
    expect(res.childNodes.length).toBe(4);
  });

  it("can insert a node", () => {
    const node = document.createElement("span");
    node.textContent = "foo";
    expect(insert(node).innerHTML).toBe("before<span>foo</span>after");
  });

  it("can re-insert a node, thereby moving it", () => {
    var node = document.createElement("span");
    node.textContent = "foo";

    const first = insert(node),
      second = insert(node);

    expect(first.innerHTML).toBe("beforeafter");
    expect(second.innerHTML).toBe("before<span>foo</span>after");
  });

  it("can insert an array of strings", () => {
    expect(insert(["foo", "bar"]).innerHTML)
      .toBe("beforefoobarafter", "array of strings");
  });

  it("can insert an array of nodes", () => {
    const nodes = [ document.createElement("span"), document.createElement("div")];
    nodes[0].textContent = "foo";
    nodes[1].textContent = "bar";
    expect(insert(nodes).innerHTML).toBe("before<span>foo</span><div>bar</div>after");
  });

  it("can insert a changing array of nodes", () => {
    let container = document.createElement("div"),
      marker = container.appendChild(document.createTextNode("")),
      span1 = document.createElement("span"),
      div2 = document.createElement("div"),
      span3 = document.createElement("span"),
      current;
    span1.textContent = "1";
    div2.textContent = "2";
    span3.textContent = "3"

    current = r.insert(container, [], current, marker);
    expect(container.innerHTML).toBe("");

    current = r.insert(container, [span1, div2, span3], current, marker);
    expect(container.innerHTML)
      .toBe("<span>1</span><div>2</div><span>3</span>");

    current = r.insert(container, [div2, span3], current, marker);
    expect(container.innerHTML)
      .toBe("<div>2</div><span>3</span>");

    current = r.insert(container, [div2, span3], current, marker);
    expect(container.innerHTML)
      .toBe("<div>2</div><span>3</span>");

    current = r.insert(container, [span3, div2], current, marker);
    expect(container.innerHTML)
      .toBe("<span>3</span><div>2</div>");

    current = r.insert(container, [], current, marker);
    expect(container.innerHTML)
      .toBe("");

    current = r.insert(container, [span3], current, marker);
    expect(container.innerHTML)
      .toBe("<span>3</span>");

    current = r.insert(container, [div2], current, marker);
    expect(container.innerHTML)
      .toBe("<div>2</div>");
  });

  it("can insert nested arrays", () => {
    expect(insert(["foo", ["bar", "blech"]]).innerHTML)
      .toBe("beforefoobarblechafter", "array of array of strings");
  });

  function insert(val) {
    const parent = container.cloneNode(true);
    r.insert(parent, val, undefined, parent.childNodes[1]);
    return parent;
  }
});