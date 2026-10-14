// get products
export const getProducts = (products, category, type, limit) => {
  const finalProducts = category
    ? products.filter(
        product => product.category.filter(single => single === category)[0]
      )
    : products;

  if (type && type === "new") {
    const newProducts = finalProducts.filter(single => single.new);
    return newProducts.slice(0, limit ? limit : newProducts.length);
  }
  if (type && type === "bestSeller") {
    return finalProducts
      .sort((a, b) => {
        return b.saleCount - a.saleCount;
      })
      .slice(0, limit ? limit : finalProducts.length);
  }
  if (type && type === "saleItems") {
    const saleItems = finalProducts.filter(
      single => single.discount && single.discount > 0
    );
    return saleItems.slice(0, limit ? limit : saleItems.length);
  }
  return finalProducts.slice(0, limit ? limit : finalProducts.length);
};

// get product discount price
export const getDiscountPrice = (price, discount) => {
  return discount && discount > 0 ? price - price * (discount / 100) : null;
};

// get product cart quantity
export const getProductCartQuantity = (cartItems, product, color, size) => {
  let productInCart = cartItems.filter(
    single =>
      single.id === product.id &&
      (single.selectedProductColor
        ? single.selectedProductColor === color
        : true) &&
      (single.selectedProductSize ? single.selectedProductSize === size : true)
  )[0];
  if (cartItems.length >= 1 && productInCart) {
    if (product.variation) {
      return cartItems.filter(
        single =>
          single.id === product.id &&
          single.selectedProductColor === color &&
          single.selectedProductSize === size
      )[0].quantity;
    } else {
      return cartItems.filter(single => product.id === single.id)[0].quantity;
    }
  } else {
    return 0;
  }
};

//get products based on category
export const getSortedProducts = (products, sortType, sortValue) => {
  if (products && sortType && sortValue) {
    if (sortType === "category") {
      return products.filter(
        product => product.category.filter(single => single === sortValue)[0]
      );
    }
    if (sortType === "tag") {
      return products.filter(
        product => product.tag.filter(single => single === sortValue)[0]
      );
    }
    if (sortType === "color") {
      return products.filter(
        product =>
          product.variation &&
          product.variation.filter(single => single.color === sortValue)[0]
      );
    }
    if (sortType === "size") {
      return products.filter(
        product =>
          product.variation &&
          product.variation.filter(
            single => single.size.filter(single => single.name === sortValue)[0]
          )[0]
      );
    }
    if (sortType === "filterSort") {
      let sortProducts = [...products];
      if (sortValue === "default") {
        return sortProducts;
      }
      if (sortValue === "priceHighToLow") {
        return sortProducts.sort((a, b) => {
          return b.price - a.price;
        });
      }
      if (sortValue === "priceLowToHigh") {
        return sortProducts.sort((a, b) => {
          return a.price - b.price;
        });
      }
    }
  }
  return products;
};

// get individual element
const getIndividualItemArray = array => {
  let individualItemArray = array.filter(function(v, i, self) {
    return i === self.indexOf(v);
  });
  return individualItemArray;
};

// get individual categories
export const getIndividualCategories = products => {
  let productCategories = [];
  products &&
    products.map(product => {
      return (
        product.category &&
        product.category.map(single => {
          return productCategories.push(single);
        })
      );
    });
  const individualProductCategories = getIndividualItemArray(productCategories);
  return individualProductCategories;
};

// get individual tags
export const getIndividualTags = products => {
  let productTags = [];
  products &&
    products.map(product => {
      return (
        product.tag &&
        product.tag.map(single => {
          return productTags.push(single);
        })
      );
    });
  const individualProductTags = getIndividualItemArray(productTags);
  return individualProductTags;
};

// get individual colors
export const getIndividualColors = products => {
  let productColors = [];
  products &&
    products.map(product => {
      return (
        product.variation &&
        product.variation.map(single => {
          return productColors.push(single.color);
        })
      );
    });
  const individualProductColors = getIndividualItemArray(productColors);
  return individualProductColors;
};

// get individual sizes
export const getProductsIndividualSizes = products => {
  let productSizes = [];
  products &&
    products.map(product => {
      return (
        product.variation &&
        product.variation.map(single => {
          return single.size.map(single => {
            return productSizes.push(single.name);
          });
        })
      );
    });
  const individualProductSizes = getIndividualItemArray(productSizes);
  return individualProductSizes;
};

// get product individual sizes
export const getIndividualSizes = product => {
  let productSizes = [];
  product.variation &&
    product.variation.map(singleVariation => {
      return (
        singleVariation.size &&
        singleVariation.size.map(singleSize => {
          return productSizes.push(singleSize.name);
        })
      );
    });
  const individualSizes = getIndividualItemArray(productSizes);
  return individualSizes;
};

export const setActiveSort = e => {
  const filterButtons = document.querySelectorAll(
    ".sidebar-widget-list-left button, .sidebar-widget-tag button, .product-filter button"
  );
  filterButtons.forEach(item => {
    item.classList.remove("active");
  });
  e.currentTarget.classList.add("active");
};

export const setActiveLayout = e => {
  const gridSwitchBtn = document.querySelectorAll(".shop-tab button");
  gridSwitchBtn.forEach(item => {
    item.classList.remove("active");
  });
  e.currentTarget.classList.add("active");
};

export const toggleShopTopFilter = e => {
  const shopTopFilterWrapper = document.querySelector(
    "#product-filter-wrapper"
  );
  shopTopFilterWrapper.classList.toggle("active");
  if (shopTopFilterWrapper.style.height) {
    shopTopFilterWrapper.style.height = null;
  } else {
    shopTopFilterWrapper.style.height =
      shopTopFilterWrapper.scrollHeight + "px";
  }
  e.currentTarget.classList.toggle("active");
};

/**
 * Order a list of categories the way the store owner arranged them.
 *
 * Shopizer sorts ROOT categories by sortOrder but hands back CHILDREN in
 * alphabetical order, so "10 Mukhi Rudraksha" lands directly after "1 Mukhi
 * Rudraksha" and the real order (1..18, then the named ones) is lost. The
 * sortOrder values themselves are correct and are returned on every child --
 * they are simply not applied -- so re-sorting on the client is enough.
 *
 * sortOrder is only meaningful WITHIN a parent, so a flat list that mixes
 * levels (the search facet, built from the categories of every matching
 * product) cannot be sorted on it alone -- doing that interleaved roots and
 * children as "Rudraksha, 1 Mukhi, Mala / Jaap Mala, 2 Mukhi ...". Such lists
 * are grouped as each root followed by its own children instead. Note that the
 * `depth` field cannot be used to detect this: in this catalogue it mirrors
 * sortOrder (Rudraksha's children report depth 1..18), so `parent` -- null on
 * a root, {id, code} on a child -- is the reliable discriminator.
 *
 * Search facets from Shopizer's own POST /search carry no sortOrder at all,
 * hence the numeric-aware name fallback: plain alphabetical is exactly what
 * produces the 1, 10, 11, 2 sequence.
 */
export const sortCategoriesByOrder = categories => {
  const list = [...(categories || [])];
  if (list.length < 2) return list;

  const hasSortOrder = list.every(
    c => c && typeof c.sortOrder === "number" && !isNaN(c.sortOrder)
  );

  if (!hasSortOrder) {
    const nameOf = c =>
      (c && c.description && c.description.name) || (c && c.name) || "";
    const collator = new Intl.Collator(undefined, {
      numeric: true,
      sensitivity: "base"
    });
    return list.sort((a, b) => collator.compare(nameOf(a), nameOf(b)));
  }

  const parentIdOf = c => (c.parent && c.parent.id) || null;
  const byOrder = (a, b) => a.sortOrder - b.sortOrder;

  // Every item on the same level (nav submenu, category-page facet): the
  // sortOrder values are directly comparable.
  if (new Set(list.map(parentIdOf)).size === 1) return list.sort(byOrder);

  const roots = list.filter(c => !parentIdOf(c)).sort(byOrder);
  const childrenByParent = new Map();
  list.filter(parentIdOf).forEach(child => {
    const key = parentIdOf(child);
    if (!childrenByParent.has(key)) childrenByParent.set(key, []);
    childrenByParent.get(key).push(child);
  });
  childrenByParent.forEach(children => children.sort(byOrder));

  const ordered = [];
  roots.forEach(root => {
    ordered.push(root);
    (childrenByParent.get(root.id) || []).forEach(c => ordered.push(c));
    childrenByParent.delete(root.id);
  });
  // children whose parent did not appear in this list
  [...childrenByParent.values()].forEach(children =>
    children.forEach(c => ordered.push(c))
  );
  return ordered;
};
