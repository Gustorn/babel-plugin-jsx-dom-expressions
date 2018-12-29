const GROUPING = '__recGroup',
  FORWARD = 'nextSibling',
  BACKWARD = 'previousSibling';

function step(node, direction) {
  const key = node[GROUPING];
  if (key) {
    while(node[direction] && node[direction][GROUPING] === key) node = node[direction];
  }
  return node[direction];
}

// This is almost straightforward implementation of reconcillation algorithm
// based on ivi documentation:
// https://github.com/localvoid/ivi/blob/2c81ead934b9128e092cc2a5ef2d3cabc73cb5dd/packages/ivi/src/vdom/implementation.ts#L1366
// With some fast paths from Surplus implementation:
// https://github.com/adamhaile/surplus/blob/master/src/runtime/content.ts#L86
// And working with data directly from Stage0:
// https://github.com/Freak613/stage0/blob/master/reconcile.js
// This implementation is tailored for fine grained change detection and adds suupport for fragments
export default function reconcile(parent, accessor, mapFn, afterRenderFn, options, beforeNode, afterNode) {
  const { wrap, cleanup, root, sample } = options;
  let disposables = [], counter = 0;

  function prepNodes(node) {
    if (node.nodeType === 11) {
      let mark = node.firstChild;
      counter++;
      while(mark) {
        mark[GROUPING] = counter;
        mark = mark.nextSibling
      }
    }
    return node;
  }

  function createFn(item, i) {
    return root(disposer => (disposables[i] = disposer, prepNodes(mapFn(item, i))));
  }

  function afterRender() {
    afterRenderFn && afterRenderFn(
      beforeNode ? beforeNode.nextSibling : parent.firstChild, afterNode
    );
  }

  cleanup(function dispose() { for (let i = 0; i < disposables.length; i++) disposables[i](); });
  wrap((renderedValues = []) => {
    const data = accessor();
    parent = (beforeNode && beforeNode.parentNode) || parent;
    return sample(() => {
      // Fast path for clear
      const length = data.length;
      if (length === 0) {
        if (beforeNode !== undefined || afterNode !== undefined) {
          let node = beforeNode !== undefined ? beforeNode.nextSibling : parent.firstChild,
            newAfterNode = afterNode, tmp;

          if (newAfterNode === undefined) newAfterNode = null;

          while(node !== newAfterNode) {
            tmp = node.nextSibling;
            parent.removeChild(node);
            node = tmp;
          }
        } else parent.textContent = "";
        for (let i = 0; i < renderedValues.length; i++) disposables[i]();
        disposables = [];
        afterRender();
        return [];
      }

      // Fast path for create
      if (renderedValues.length === 0) {
        let node, mode = (afterNode !== undefined), nextData = new Array(length);
        for (let i = 0; i < length; i++) {
          node = createFn(nextData[i] = data[i], i);
          mode ? parent.insertBefore(node, afterNode) : parent.appendChild(node);
        }
        afterRender();
        return nextData;
      }

      let prevStart = 0,
        newStart = 0,
        loop = true,
        prevEnd = renderedValues.length-1, newEnd = length-1,
        a, b,
        prevStartNode = beforeNode ? beforeNode.nextSibling : parent.firstChild,
        newStartNode = prevStartNode,
        prevEndNode = afterNode ? afterNode.previousSibling : parent.lastChild,
        newAfterNode = afterNode;

      fixes: while(loop) {
        loop = false;
        let _node;

        // Skip prefix
        a = renderedValues[prevStart], b = data[newStart];
        while(a === b) {
          prevStart++;
          newStart++;
          newStartNode = prevStartNode = step(prevStartNode, FORWARD);
          if (prevEnd < prevStart || newEnd < newStart) break fixes;
          a = renderedValues[prevStart];
          b = data[newStart];
        }

        // Skip suffix
        a = renderedValues[prevEnd], b = data[newEnd];
        while(a === b) {
          prevEnd--;
          newEnd--;
          newAfterNode = prevEndNode;
          prevEndNode = step(prevEndNode, BACKWARD);
          if (prevEnd < prevStart || newEnd < newStart) break fixes;
          a = renderedValues[prevEnd];
          b = data[newEnd];
        }

        // Fast path to swap backward
        a = renderedValues[prevEnd], b = data[newStart];
        while(a === b) {
          loop = true;
          _node = step(prevEndNode, BACKWARD);
          let mark = _node.nextSibling;
          if (newStartNode !== mark) {
            while (mark !== prevEndNode) {
              let tmp = mark.nextSibling;
              parent.insertBefore(mark, newStartNode);
              mark = tmp;
            }
            parent.insertBefore(mark, newStartNode);
            prevEndNode = _node;
            disposables.splice(newStart, 0, disposables.splice(prevEnd, 1)[0]);
          }
          newStart++;
          prevEnd--;
          if (prevEnd < prevStart || newEnd < newStart) break fixes;
          a = renderedValues[prevEnd];
          b = data[newStart];
        }

        // Fast path to swap forward
        a = renderedValues[prevStart], b = data[newEnd];
        while(a === b) {
          loop = true;
          _node = step(prevStartNode, FORWARD);
          let mark = prevStartNode, tmp;
          if (mark !== newAfterNode) {
            while (mark.nextSibling !== _node) {
              tmp = mark.nextSibling;
              parent.insertBefore(mark, newAfterNode);
              mark = tmp;
            }
            parent.insertBefore(mark, newAfterNode);
            disposables.splice(newEnd, 0, disposables.splice(prevStart, 1)[0]);
            newAfterNode = mark;
            prevStartNode = _node;
          }
          prevStart++;
          newEnd--;
          if (prevEnd < prevStart || newEnd < newStart) break fixes;
          a = renderedValues[prevStart];
          b = data[newEnd];
        }
      }

      // Fast path for shrink
      if (newEnd < newStart) {
        if (prevStart <= prevEnd) {
          let next, mark, tmp;
          while(prevStart <= prevEnd) {
            next = step(prevEndNode, BACKWARD);
            mark = prevEndNode;
            while (mark !== next) {
              tmp = mark.previousSibling
              parent.removeChild(mark);
              mark = tmp;
            }
            prevEndNode = next;
            disposables[prevEnd]();
            prevEnd--;
          }
        }
        disposables.length = length;
        afterRender();
        return data.slice(0);
      }

      // Fast path for add
      if (prevEnd < prevStart) {
        if (newStart <= newEnd) {
          let node, mode = newAfterNode ? 1 : 0;
          while(newStart <= newEnd) {
            node = createFn(data[newStart], newStart);
            mode ? parent.insertBefore(node, newAfterNode) : parent.appendChild(node);
            newStart++;
          }
        }
        afterRender();
        return data.slice(0);
      }

      // Positions for reusing nodes from current DOM state
      const P = new Array(newEnd + 1 - newStart);
      for(let i = newStart; i <= newEnd; i++) P[i] = -1;

      // Index to resolve position from current to new
      const I = new Map();
      for(let i = newStart; i <= newEnd; i++) I.set(data[i], i);

      let reusingNodes = 0, toRemove = [];
      for(let i = prevStart; i <= prevEnd; i++) {
        if (I.has(renderedValues[i])) {
          P[I.get(renderedValues[i])] = i;
          reusingNodes++;
        } else {
          toRemove.push(i);
        }
      }

      // Fast path for full replace
      if (reusingNodes === 0) {
        if (prevStartNode !== parent.firstChild || prevEndNode !== parent.lastChild) {
          let node = prevStartNode, tmp, mark;
          newAfterNode = prevEndNode.nextSibling;
          while(node !== newAfterNode) {
            mark = step(node, FORWARD);
            while (node !== mark) {
              tmp = node.nextSibling;
              parent.removeChild(node);
              node = tmp;
            }
            disposables[prevStart]();
            prevStart++;
          }
        } else {
          while(prevStart <= prevEnd) {
            disposables[prevStart]();
            prevStart++;
          }
          parent.textContent = "";
        }

        let node, mode = newAfterNode ? 1 : 0;
        for(let i = newStart; i <= newEnd; i++) {
          node = createFn(data[i], i);
          mode ? parent.insertBefore(node, newAfterNode) : parent.appendChild(node);
        }

        afterRender();
        return data.slice(0);
      }

      // What else?
      const longestSeq = longestPositiveIncreasingSubsequence(P, newStart)

      // Collect nodes to work with them
      const nodes = [];
      let tmpC = prevStartNode;
      for(let i = prevStart; i <= prevEnd; i++) {
        nodes[i] = tmpC;
        tmpC = step(tmpC, FORWARD);
      }

      for(let i = 0; i < toRemove.length; i++) {
        const index = toRemove[i];
        let node = nodes[index], end = nodes[index + 1], tmp;
        while(node !== end) {
          tmp = node.nextSibling
          parent.removeChild(node);
          node = tmp;
        }
        disposables[index]();
      }

      let lisIdx = longestSeq.length - 1, tmpD;
      for(let i = newEnd; i >= newStart; i--) {
        if(longestSeq[lisIdx] === i) {
          newAfterNode = nodes[P[longestSeq[lisIdx]]];
          lisIdx--;
        } else {
          if (P[i] === -1) {
            tmpD = createFn(data[i], i);
            parent.insertBefore(tmpD, newAfterNode);
          } else {
            tmpD = nodes[P[i]];
            let mark = tmpD, end = nodes[P[i] + 1], tmp;
            while (mark !== end) {
              tmp = mark.nextSibling;
              parent.insertBefore(mark, newAfterNode);
              mark = tmp;
            }
          }
          newAfterNode = tmpD;
        }
      }

      disposables.length = length;
      afterRender();
      return data.slice(0);
    });
  });
}

// Picked from
// https://github.com/adamhaile/surplus/blob/master/src/runtime/content.ts#L368

// return an array of the indices of ns that comprise the longest increasing subsequence within ns
function longestPositiveIncreasingSubsequence(ns, newStart) {
  var seq = [],
    is  = [],
    l   = -1,
    pre = new Array(ns.length);

  for (var i = newStart, len = ns.length; i < len; i++) {
    var n = ns[i];
    if (n < 0) continue;
    var j = findGreatestIndexLEQ(seq, n);
    if (j !== -1) pre[i] = is[j];
    if (j === l) {
      l++;
      seq[l] = n;
      is[l]  = i;
    } else if (n < seq[j + 1]) {
      seq[j + 1] = n;
      is[j + 1] = i;
    }
  }

  for (i = is[l]; l >= 0; i = pre[i], l--) {
    seq[l] = i;
  }

  return seq;
}

function findGreatestIndexLEQ(seq, n) {
  // invariant: lo is guaranteed to be index of a value <= n, hi to be >
  // therefore, they actually start out of range: (-1, last + 1)
  var lo = -1,
    hi = seq.length;

  // fast path for simple increasing sequences
  if (hi > 0 && seq[hi - 1] <= n) return hi - 1;

  while (hi - lo > 1) {
    var mid = Math.floor((lo + hi) / 2);
    if (seq[mid] > n) {
      hi = mid;
    } else {
      lo = mid;
    }
  }

  return lo;
}