import PropTypes from "prop-types";
import React, { Fragment, useState, useEffect } from 'react';
import MetaTags from 'react-meta-tags';
import { BreadcrumbsItem } from 'react-breadcrumbs-dynamic';
import { connect } from 'react-redux';
import Layout from '../../layouts/Layout';
import Breadcrumb from '../../wrappers/breadcrumb/Breadcrumb';
import ShopSidebar from '../../wrappers/product/ShopSidebar';
import ShopTopbar from '../../wrappers/product/ShopTopbar';
import ShopProducts from '../../wrappers/product/ShopProducts';
import WebService from '../../util/webService';
import constant from '../../util/constant';
import { setLoader } from "../../redux/actions/loaderActions";
import { setCategoryID } from "../../redux/actions/productActions";
import { multilanguage } from "redux-multilanguage";
import { PRICE_BANDS, inBand } from "../../helpers/priceBands";

// No pagination on this page, so take one generous page of matches.
const SEARCH_RESULT_LIMIT = 100;


const SearchProduct = ({ strings, location, defaultStore, currentLanguageCode, setLoader, searchID, setCategoryID, merchant }) => {
    const [layout, setLayout] = useState('grid three-column');

    // Everything the term matched. The facet narrows what is shown without
    // going back to the server, and the facet list itself is built from this
    // rather than from the narrowed set -- otherwise picking a category would
    // collapse the list to the one just picked, with no way back to the others.
    const [allProducts, setAllProducts] = useState([]);
    const [totalProduct, setTotalProduct] = useState(0);
    const [activeCategory, setActiveCategory] = useState(null);
    const [activePriceBand, setActivePriceBand] = useState(null);

    const { pathname } = location;
    const getLayout = (layout) => {
        setLayout(layout)
    }

    /**
     * Narrow the results to one category, or clear it by picking it again.
     *
     * This used to push /category/:slug, which read as a filter and behaved as
     * an exit: searching "rudraksha" and choosing 5 Mukhi abandoned the search
     * and showed the whole 5 Mukhi category instead -- more products than the
     * search had found, and none of them matched on the term any more.
     */
    const getCategoryParams = (sortType, sortValue) => {
        setActiveCategory(prev => (prev && prev === sortValue.id ? null : sortValue.id));
    }

    const getPriceParams = (bandId) => {
        setActivePriceBand(prev => (prev === bandId ? null : bandId));
    }

    // Re-runs when the term changes: searching again from the header while
    // already on /search/:id previously left the old results on screen,
    // because this only ever fired on mount.
    useEffect(() => {
        getProductList()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchID, defaultStore, currentLanguageCode]);

    /**
     * Distinct categories across the result set, so the sidebar facet still has
     * something to show. POST /search used to return categoryFacets; the
     * products endpoint does not, but every product carries its categories
     * (with sortOrder), which is enough to rebuild the same list.
     */
    const categoriesFrom = (products) => {
        const seen = new Map();
        (products || []).forEach(product => {
            (product.categories || []).forEach(category => {
                // a hidden category is not offered as a filter: its page is
                // gone, so filtering by it would strand the shopper
                if (category && category.visible === false) return;
                if (category && category.id && !seen.has(category.id)) {
                    seen.set(category.id, category);
                }
            });
        });
        return [...seen.values()];
    }

    // Derived below categoriesFrom rather than beside the other handlers: it
    // is a const arrow function, so reading it higher up is a dead-zone
    // ReferenceError rather than a hoisted call.
    const matchesCategory = product => !activeCategory
        || (product.categories || []).some(category => category.id === activeCategory);
    const band = PRICE_BANDS.find(b => b.id === activePriceBand);
    const matchesPrice = product => !band || inBand(product, band);

    // Each facet is counted against the results the *other* facet leaves, so
    // the number beside a band is what picking it would actually give you.
    // Counting both against the raw result set instead would promise 12
    // products in a band and then show 2 once a category was also on.
    const priceBands = PRICE_BANDS
        .map(b => ({ ...b, count: allProducts.filter(p => matchesCategory(p) && inBand(p, b)).length }))
        .filter(b => b.count > 0 || b.id === activePriceBand);

    // and the mirror of that: the categories offered are the ones still
    // represented once the price band is applied
    const subCategory = categoriesFrom(allProducts.filter(matchesPrice));

    const productData = allProducts.filter(p => matchesCategory(p) && matchesPrice(p));

    const getProductList = async () => {
        if (!searchID) return;
        setLoader(true)
        // Shopizer's POST /search is backed by OpenSearch. There is no search
        // node running (and search.noindex=true is set to dodge the
        // ResourceUtils.getFile() bug reading search/MAPPINGS.json out of a
        // jar), so it failed with "searchClient is null" and this page showed
        // 0 results for every term -- including terms that plainly match the
        // catalogue. /products?name= is answered from the database and does a
        // case-insensitive partial match on the product name.
        let action = `${constant.ACTION.PRODUCTS}?store=${defaultStore}` +
            `&lang=${currentLanguageCode}&count=${SEARCH_RESULT_LIMIT}` +
            `&name=${encodeURIComponent(searchID)}`;
        try {
            let response = await WebService.get(action);
            const products = (response && response.products) || [];
            setAllProducts(products);
            setTotalProduct((response && response.recordsTotal) || products.length);
            // a facet from the previous term almost certainly does not apply
            // to this one, and leaving it on would show an empty page
            setActiveCategory(null);
            setActivePriceBand(null);
            setLoader(false)
        } catch (error) {
            setAllProducts([]);
            setTotalProduct(0);
            setActiveCategory(null);
            setActivePriceBand(null);
            setLoader(false)
        }
    }

    return (
        <Fragment>
            <MetaTags>
                <title>{merchant.name} | {strings["Search"]}</title>
                <meta name="description" content="" />
            </MetaTags>

            <BreadcrumbsItem to={process.env.PUBLIC_URL + '/'}>{strings["Home"]}</BreadcrumbsItem>
            <BreadcrumbsItem to={process.env.PUBLIC_URL + pathname}>{strings["Search"]}</BreadcrumbsItem>

            <Layout headerContainerClass="container-fluid"
                headerPaddingClass="header-padding-2"
                headerTop="visible">
                {/* breadcrumb */}
                <Breadcrumb />

                <div className="shop-area pt-95 pb-100">
                    <div className="container">
                        <div className="row">
                            <div className="col-lg-3 order-2 order-lg-1">

                                <ShopSidebar string={strings} getCategoryParams={getCategoryParams} uniqueCategories={subCategory} activeCategoryId={activeCategory} priceBands={priceBands} activePriceBandId={activePriceBand} getPriceParams={getPriceParams} uniqueColors={[]} uniqueSizes={[]} uniqueManufacture={[]} sideSpaceClass="mr-30" />
                            </div>
                            <div className="col-lg-9 order-1 order-lg-2">

                                <ShopTopbar strings={strings} getLayout={getLayout} productCount={totalProduct} offset={1} sortedProductCount={productData.length} />

                                {/* shop page content default */}
                                <ShopProducts strings={strings} layout={layout} products={productData} />


                            </div>
                        </div>
                    </div>
                </div>
            </Layout>
        </Fragment>
    )
}

SearchProduct.propTypes = {
    location: PropTypes.object,
    products: PropTypes.array
}

const mapStateToProps = (state, ownProps) => {
    const searchID = ownProps.match.params.id;
    return {
        currentLanguageCode: state.multilanguage.currentLanguageCode,
        // redux has not resolved the merchant on a cold load and an empty
        // store= silently returns nothing
        defaultStore: state.merchantData.defaultStore || window._env_.APP_MERCHANT,
        searchID: searchID,
        merchant: state.merchantData.merchant
    }
}
const mapDispatchToProps = dispatch => {
    return {
        setLoader: (value) => {
            dispatch(setLoader(value));
        },
        setCategoryID: (value) => {
            dispatch(setCategoryID(value));
        }
    };
};
export default connect(mapStateToProps, mapDispatchToProps)(multilanguage(SearchProduct));