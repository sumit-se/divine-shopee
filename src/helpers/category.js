/**
 * Drop the categories the store has hidden.
 *
 * The catalogue API serves the whole tree with a `visible` flag on each node
 * rather than leaving the hidden ones out -- it has to, because the admin
 * console reads the same endpoint and would otherwise lose any category it had
 * hidden, with no way to find it again and put it back. So honouring the flag
 * is the shopfront's job, and this is where it happens: once, on the tree the
 * header nav, the mobile menu and the category carousel all share.
 *
 * Hiding a parent hides what is under it. A category the shopper cannot reach
 * is not a route to the ones below it, and a sub-category promoted into the
 * menu on its own would read as a top-level section it is not.
 *
 * `visible` missing is treated as visible: that is how the API reports a
 * category it has no flag for, and a blank should not empty the menu.
 */
export const visibleCategories = (categories) =>
  (categories || [])
    .filter(category => category.visible !== false)
    .map(category => ({
      ...category,
      children: visibleCategories(category.children)
    }));

/**
 * The same tree as a flat list, each category immediately followed by its own
 * children, and otherwise in the order the API gave them.
 *
 * "Show in Shop by Category" is a flag on every category, not only on the
 * roots, but the catalogue API nests children inside their parent rather than
 * returning them alongside. Reading only the top-level array therefore ignored
 * a flagged sub-category entirely -- Shankh was ticked and visible and still
 * never appeared, because it was never a candidate.
 *
 * Run this over the output of `visibleCategories` rather than the raw tree: a
 * hidden parent is dropped there with everything under it, so a child cannot
 * be lifted out of a branch the store has taken down.
 *
 * `children` is kept on each entry, because the strip counts them to print
 * "23 categories" under a hub.
 */
export const flattenCategories = (categories) =>
  (categories || []).reduce(
    (flat, category) => flat.concat(category, flattenCategories(category.children)),
    []
  );
