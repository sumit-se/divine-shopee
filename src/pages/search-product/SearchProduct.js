import PropTypes from "prop-types";
import React, { Fragment, useState, useEffect } from 'react';
import MetaTags from 'react-meta-tags';
import { BreadcrumbsItem } from 'react-breadcrumbs-dynamic';
import { connect } from 'react-redux';
import ReactPaginate from 'react-paginate';
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
import { PRICE_BANDS, bandById, bandParams, inBand } from "../../helpers/priceBands";

// Products per page — matches the category page limit.
const PAGE_SIZE = 15;

const SearchProduct = ({ strings, location, defaultStore, currentLanguageCode, setLoader, searchID, setCategoryID, merchant }) => {
    const [layout, setLayout] = useState('grid three-column');
    const [productData, setProductData] = useState([]);
    const [totalProduct, setTotalProduct] = useState(0);
    // pageIndex: 0-based current page (matches ReactPaginate's `selected`)
    const [pageIndex, setPageIndex] = useState(0);
    const [activePriceBand, setActivePriceBand] = useState(null);
    // Counts from 5 parallel count=1 probes — same pattern as Category.js
    const [priceBandCounts, setPriceBandCounts] = useState({});

    const { pathname } = location;
    const getLayout = (layout) => { setLayout(layout); };

    const getPriceParams = (bandId) => {
        setActivePriceBand(prev => (prev === bandId ? null : bandId));
        setPageIndex(0);
    };

    // Reset pagination + filter when the search term changes. Both resets and
    // the fetch below depend on [searchID, …], so they run in the same pass;
    // the fetch starts with the old pageIndex/activePriceBand, but its cleanup
    // fires immediately on the re-render caused by the state updates here,
    // cancelling the stale request before it can write state.
    useEffect(() => {
        setPageIndex(0);
        setActivePriceBand(null);
        setProductData([]);
        setTotalProduct(0);
        setPriceBandCounts({});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchID, defaultStore, currentLanguageCode]);

    // Paginated product fetch. Re-runs when term, page, or price filter changes.
    useEffect(() => {
        if (!searchID) return;
        let cancelled = false;
        const doFetch = async () => {
            setLoader(true);
            const band = bandById(activePriceBand);
            // Shopizer's POST /search requires OpenSearch which is not running
            // (search.noindex=true). /products?name= hits the database directly
            // and does a case-insensitive partial match on the product name.
            const action = `${constant.ACTION.PRODUCTS}?store=${defaultStore}` +
                `&lang=${currentLanguageCode}&count=${PAGE_SIZE}&page=${pageIndex}` +
                `&name=${encodeURIComponent(searchID)}${bandParams(band)}`;
            try {
                const response = await WebService.get(action);
                if (!cancelled) {
                    const band = bandById(activePriceBand);
                    const products = ((response && response.products) || []).filter(p => !band || inBand(p, band));
                    setProductData(products);
                    setTotalProduct((response && response.recordsTotal) || 0);
                }
            } catch {
                if (!cancelled) { setProductData([]); setTotalProduct(0); }
            } finally {
                if (!cancelled) setLoader(false);
            }
        };
        doFetch();
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchID, defaultStore, currentLanguageCode, pageIndex, activePriceBand]);

    // Price band availability: 5 parallel count=1 probes, re-run when term changes.
    // Does not re-run on price filter change — the band list stays stable while
    // on one term, same as on the category page.
    useEffect(() => {
        if (!searchID) return;
        let cancelled = false;
        const loadCounts = async () => {
            const counts = {};
            await Promise.all(PRICE_BANDS.map(async band => {
                const action = `${constant.ACTION.PRODUCTS}?store=${defaultStore}` +
                    `&lang=${currentLanguageCode}&count=1&page=0` +
                    `&name=${encodeURIComponent(searchID)}${bandParams(band)}`;
                try {
                    const res = await WebService.get(action);
                    counts[band.id] = (res && res.recordsTotal) || 0;
                } catch { counts[band.id] = 0; }
            }));
            if (!cancelled) setPriceBandCounts(counts);
        };
        loadCounts();
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchID, defaultStore, currentLanguageCode]);

    // Only show bands that have matching products (or the currently active one).
    const priceBands = PRICE_BANDS
        .filter(band => (priceBandCounts[band.id] || 0) > 0 || band.id === activePriceBand);

    const pageCount = Math.ceil(totalProduct / PAGE_SIZE);

    const handlePageChange = ({ selected }) => {
        setPageIndex(selected);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

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
                <Breadcrumb />

                <div className="shop-area pt-95 pb-100">
                    <div className="container">
                        <div className="row">
                            <div className="col-lg-3 order-2 order-lg-1">
                                <ShopSidebar
                                    string={strings}
                                    getCategoryParams={() => {}}
                                    uniqueCategories={[]}
                                    activeCategoryId={null}
                                    priceBands={priceBands}
                                    activePriceBandId={activePriceBand}
                                    getPriceParams={getPriceParams}
                                    uniqueColors={[]}
                                    uniqueSizes={[]}
                                    uniqueManufacture={[]}
                                    sideSpaceClass="mr-30"
                                />
                            </div>
                            <div className="col-lg-9 order-1 order-lg-2">
                                <ShopTopbar
                                    strings={strings}
                                    getLayout={getLayout}
                                    productCount={totalProduct}
                                    offset={pageIndex + 1}
                                    pageLimit={PAGE_SIZE}
                                    sortedProductCount={productData.length}
                                />

                                <ShopProducts strings={strings} layout={layout} products={productData} />

                                {pageCount > 1 && (
                                    <div className="pro-pagination-style text-center mt-30">
                                        <ReactPaginate
                                            previousLabel={'«'}
                                            nextLabel={'»'}
                                            breakLabel={'...'}
                                            breakClassName={'break-me'}
                                            pageCount={pageCount}
                                            forcePage={pageIndex}
                                            onPageChange={handlePageChange}
                                            containerClassName={'mb-0 mt-0'}
                                            activeClassName={'page-item active'}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </Layout>
        </Fragment>
    );
};

SearchProduct.propTypes = {
    location: PropTypes.object,
    products: PropTypes.array
};

const mapStateToProps = (state, ownProps) => {
    const searchID = ownProps.match.params.id;
    return {
        currentLanguageCode: state.multilanguage.currentLanguageCode,
        // redux has not resolved the merchant on a cold load and an empty
        // store= silently returns nothing
        defaultStore: state.merchantData.defaultStore || window._env_.APP_MERCHANT,
        searchID: searchID,
        merchant: state.merchantData.merchant
    };
};

const mapDispatchToProps = dispatch => ({
    setLoader: (value) => { dispatch(setLoader(value)); },
    setCategoryID: (value) => { dispatch(setCategoryID(value)); }
});

export default connect(mapStateToProps, mapDispatchToProps)(multilanguage(SearchProduct));