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
import ReactGA from "react-ga4";

// Products per page — matches the category page limit.
const PAGE_SIZE = 15;

const SearchProduct = ({ strings, location, defaultStore, currentLanguageCode, setLoader, searchID, setCategoryID, merchant }) => {
    const [layout, setLayout] = useState('grid three-column');
    const [productData, setProductData] = useState([]);
    const [totalProduct, setTotalProduct] = useState(0);
    // pageIndex: 0-based current page (matches ReactPaginate's `selected`)
    const [pageIndex, setPageIndex] = useState(0);
    const { pathname } = location;
    const getLayout = (layout) => { setLayout(layout); };

    // Reset pagination when the search term changes.
    useEffect(() => {
        setPageIndex(0);
        setProductData([]);
        setTotalProduct(0);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchID, defaultStore, currentLanguageCode]);

    // Paginated product fetch. Re-runs when term or page changes.
    useEffect(() => {
        if (!searchID) return;
        let cancelled = false;
        const doFetch = async () => {
            setLoader(true);
            // Shopizer's POST /search requires OpenSearch which is not running
            // (search.noindex=true). /products?name= hits the database directly
            // and does a case-insensitive partial match on the product name.
            const action = `${constant.ACTION.PRODUCTS}?store=${defaultStore}` +
                `&lang=${currentLanguageCode}&count=${PAGE_SIZE}&page=${pageIndex}` +
                `&name=${encodeURIComponent(searchID)}`;
            try {
                const response = await WebService.get(action);
                if (!cancelled) {
                    setProductData((response && response.products) || []);
                    setTotalProduct((response && response.recordsTotal) || 0);
                    if (window._env_?.APP_GA_MEASUREMENT_ID) {
                      ReactGA.event("search", { search_term: searchID });
                    }
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
    }, [searchID, defaultStore, currentLanguageCode, pageIndex]);

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