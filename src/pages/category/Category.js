import PropTypes from "prop-types";
import React, { Fragment, useState, useEffect, useRef } from 'react';
import MetaTags from 'react-meta-tags';
import { useHistory } from "react-router-dom";
// import Paginator from 'react-hooks-paginator';
import { BreadcrumbsItem } from 'react-breadcrumbs-dynamic';
import { connect } from 'react-redux';
// import { getSortedProducts } from '../../helpers/product';
import Layout from '../../layouts/Layout';
import { canonicalUrl } from "../../util/seo";

import Breadcrumb from '../../wrappers/breadcrumb/Breadcrumb';
import CategoryBanner from '../../wrappers/category/CategoryBanner';
import ShopSidebar from '../../wrappers/product/ShopSidebar';
import { PRICE_BANDS, bandById, bandParams } from '../../helpers/priceBands';
import ShopTopbar from '../../wrappers/product/ShopTopbar';
import ShopProducts from '../../wrappers/product/ShopProducts';
import WebService from '../../util/webService';
import constant from '../../util/constant';
import { isCheckValueAndSetParams } from '../../util/helper';
import { setLoader } from "../../redux/actions/loaderActions";
import { multilanguage } from "redux-multilanguage";
import { setCategoryID } from "../../redux/actions/productActions";
import ReactPaginate from 'react-paginate';
import { visibleCategories } from '../../helpers/category';

const Category = ({ setCategoryID, isLoading, strings, location, defaultStore, currentLanguageCode, categoryID, routeSlug, setLoader, }) => {
    const [layout, setLayout] = useState('grid three-column');
    const history = useHistory();
    // const [sortType, setSortType] = useState('');
    const [categoryValue, setCategoryValue] = useState('');
    // const [filterSortType, setFilterSortType] = useState('');
    // const [filterSortValue, setFilterSortValue] = useState('');
    const [offset, setOffset] = useState(0);
    const latestProductRequest = useRef(0);
    // const [skip, setSkip] = useState(0);
    const [currentPage, setCurrentPage] = useState(0);
    const pageLimit = parseInt(window._env_.APP_PRODUCT_GRID_LIMIT) || 12;
    const [productData, setProductData] = useState([]);
    const [totalProduct, setTotalProduct] = useState(0);
    const [productDetails, setProductDetails] = useState('');
    const [subCategory, setSubCategory] = useState([]);
    // the chosen price band, and the per-band counts for this category
    const [activePriceBand, setActivePriceBand] = useState(null);
    const [priceBandCounts, setPriceBandCounts] = useState({});
    // id for the category named in the URL, once the slug has been resolved
    const [activeCategoryId, setActiveCategoryId] = useState(null);
    const [manufacture, setManufacture] = useState([]);
    const [color, setColor] = useState([]);
    const [size, setSize] = useState([]);
    const [selectedOption, setSelectedOption] = useState([]);
    const [selectedManufature, setSelectedManufature] = useState([]);
    // const [sortedProducts, setSortedProducts] = useState([]);

    const { pathname } = location;
    // the sidebar only has content when at least one facet is populated
    const hasSidebar =
        subCategory.length > 0 ||
        color.length > 0 ||
        size.length > 0 ||
        manufacture.length > 0;

    const getLayout = (layout) => {
        setLayout(layout)
    }

    const getSortParams = (sortType, sortValue) => {
        // console.log(sortType)
        let tempSelectedOption = selectedOption;
        let tempSelectedManufature = selectedManufature;
        if (sortType === 'size' || sortType === 'color') {
            let index = selectedOption.findIndex(a => a === sortValue);
            // console.log(index)
            if (index === -1) {
                tempSelectedOption = [...selectedOption, sortValue]
            } else {
                tempSelectedOption.splice(index, 1);
            }
            // console.log(tempSelectedSize)
            setSelectedOption(tempSelectedOption)
        }
        else if (sortType === 'manufacturer') {
            let index = selectedManufature.findIndex(a => a === sortValue);
            // console.log(index)
            if (index === -1) {
                tempSelectedManufature = [...selectedManufature, sortValue]
            } else {
                tempSelectedManufature.splice(index, 1);
            }
            // console.log(tempSelectedSize)
            setSelectedManufature(tempSelectedManufature)
        }
        // console.log(categoryValue, tempSelectedOption, selectedManufature)
        getProductList(categoryValue, tempSelectedOption, tempSelectedManufature)
    }

    const getCategoryParams = (sortType, sortValue) => {
        // console.log(sortType)
        // console.log(sortValue)
        // setCategoryValue(sortValue)
        setCategoryID(sortValue.id)
        history.push("/category/" + sortValue.description.friendlyUrl)
        // getProductList(categoryValue, selectedOption, selectedManufature)
    }

    // The route carries the SEO slug (/category/rudraksha) but this page only
    // ever read the id out of redux, which is set when a category is CLICKED.
    // A direct visit, a reload or an inbound search hit therefore ran with no
    // id at all: /category/undefined returned nothing (so the sidebar facet
    // never rendered) and the product call went out without &category=, which
    // quietly returns the entire catalogue under the right breadcrumb. Same
    // defect, and the same fix, as the product detail page.
    //
    // /category/friendly/{slug} answers with the category but with an empty
    // children array, so it is only used to resolve the id -- getCategoryDetails
    // still has to fetch /category/{id} to populate the sub-categories.
    useEffect(() => {
        if (!routeSlug) return;
        // Switching category keeps this component mounted, so the page number
        // from the previous category survived: page 2 of Rudraksha (41 items)
        // followed by a click on 5 Mukhi (6 items, one page) asked for a page
        // that does not exist and rendered an empty category. Start every
        // category on its first page, and drop the old id so nothing is
        // fetched for the previous category while the new slug resolves.
        setOffset(0);
        setActiveCategoryId(null);
        setProductData([]);
        setTotalProduct(0);
        setCurrentPage(0);
        let cancelled = false;
        const resolveSlug = async () => {
            const action = constant.ACTION.CATEGORY + 'friendly/' +
                encodeURIComponent(routeSlug) + '?store=' + defaultStore +
                '&lang=' + currentLanguageCode;
            try {
                const response = await WebService.get(action);
                if (cancelled || !response || !response.id) return;
                /*
                 * A category the store has hidden is not browsable, even by
                 * someone holding the link. The nav already leaves it out, but
                 * the page behind it stayed open -- and an open page is one a
                 * search engine can still index, which is the opposite of
                 * hidden. Its products keep their own pages and reach shoppers
                 * through whatever other category they sit in.
                 */
                if (response.visible === false) {
                    history.push('/not-found');
                    return;
                }
                setActiveCategoryId(response.id);
                // keep redux in step for everything else that reads categoryid
                if (response.id !== categoryID) setCategoryID(response.id);
            } catch (error) {
                setActiveCategoryId(null);
            }
        };
        resolveSlug();
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [routeSlug, defaultStore, currentLanguageCode]);

    // Keyed on the id resolved FROM THE URL, never on redux directly. Redux is
    // persisted to localStorage, so on a cold load of /category/12-mukhi it
    // still holds whatever was last clicked -- firing the fetch on that stale
    // value loaded the wrong category before the slug had resolved.
    useEffect(() => {
        if (!activeCategoryId) return;
        setCategoryValue(activeCategoryId)
        setSubCategory([])
        setColor([])
        setManufacture([])
        setSize([])
        setSelectedManufature([])
        setSelectedOption([])
        getProductList(activeCategoryId, [], [])
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeCategoryId, offset, activePriceBand]);
    /** Pick a band, or clear it by picking the one already on. */
    const getPriceParams = (bandId) => {
        setActivePriceBand(prev => (prev === bandId ? null : bandId));
        // the narrowed set is shorter, so page 4 of the old one may not exist
        setOffset(0);
    }

    /**
     * How many products each band holds in this category.
     *
     * One small request per band rather than one big one: this page never has
     * the whole category in hand -- the server pages it -- so the only honest
     * count is the one the server gives for that band. `count=1` is asked for
     * because only recordsTotal is read; the single product that comes back is
     * discarded.
     */
    useEffect(() => {
        if (!activeCategoryId) return;
        let cancelled = false;
        const load = async () => {
            const counts = {};
            await Promise.all(PRICE_BANDS.map(async band => {
                const action = `${constant.ACTION.PRODUCTS}?store=${defaultStore}&lang=${currentLanguageCode}`
                    + `&count=1&page=0&category=${activeCategoryId}${bandParams(band)}`;
                try {
                    const res = await WebService.get(action);
                    counts[band.id] = (res && res.recordsTotal) || 0;
                } catch (e) {
                    counts[band.id] = 0;
                }
            }));
            if (!cancelled) setPriceBandCounts(counts);
        };
        load();
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeCategoryId, defaultStore, currentLanguageCode]);

    const priceBands = PRICE_BANDS
        .map(band => ({ ...band, count: priceBandCounts[band.id] || 0 }))
        .filter(band => band.count > 0 || band.id === activePriceBand);

    const getProductList = async (categoryid, size, manufacture) => {
        // Product calls take ~2.5s, so two quick menu clicks can resolve out of
        // order; only the most recent request may write to the page.
        const requestId = ++latestProductRequest.current;
        setLoader(true)
        // setProductData([]);
        // let action = `${constant.ACTION.PRODUCTS} + '?store=' + defaultStore + '&lang=' + currentLanguageCode + '&start=' + offset + '&count=' + pageLimit + '&category=' + categoryID`;
        let action = `${constant.ACTION.PRODUCTS}?${isCheckValueAndSetParams('&store=', defaultStore)}${isCheckValueAndSetParams('&lang=', currentLanguageCode)}${isCheckValueAndSetParams('&page=', offset)}${isCheckValueAndSetParams('&count=', pageLimit)}${isCheckValueAndSetParams('&category=', categoryid)}${isCheckValueAndSetParams('&optionValues=', size.join())}${isCheckValueAndSetParams('&manufacturer=', manufacture.join())}${bandParams(bandById(activePriceBand))}`;
        try {
            let response = await WebService.get(action);
            if (requestId !== latestProductRequest.current) return;
            if (response) {
                setCurrentPage(response.totalPages)
                setProductData(response.products);
                setTotalProduct(response.recordsTotal)
            }
            setLoader(false)
        } catch (error) {
            setLoader(false)
        }

        getCategoryDetails(categoryid)
    }
    const getCategoryDetails = async (categoryid) => {
        let action = constant.ACTION.CATEGORY + categoryid + '?store=' + defaultStore + '&lang=' + currentLanguageCode;
        try {
            let response = await WebService.get(action);
            // console.log(response.children);
            if (response) {
                //console.log(response);
                // No history.push here. It used to rewrite the address bar to
                // response.description.friendlyUrl -- a bare slug, not a path,
                // so /category/rudraksha became /rudraksha -- and once the id
                // came from the URL it actively fought the slug resolution,
                // redirecting a cold load to whatever category redux had cached.
                // Clicks already push their own URL in getCategoryParams.
                setProductDetails(response);
                // let temp = response.children;
                // console.log(temp)
                // the sidebar lists these as filters, so a hidden one would
                // put the category back into the navigation by another door
                setSubCategory(visibleCategories(response.children));
            }
        } catch (error) {
        }
        getManufacturers(categoryid)
    }
    const getManufacturers = async (categoryid) => {
        let action = constant.ACTION.CATEGORY + categoryid + '/' + constant.ACTION.MANUFACTURERS + '?store=' + defaultStore + '&lang=' + currentLanguageCode
        try {
            let response = await WebService.get(action);
            //console.log(JSON.stringify(response));
            if (response) {
                setManufacture(response.sort())
            }
        } catch (error) {
        }
        getVariants(categoryid)
    }
    const getVariants = async (categoryid) => {
        let action = constant.ACTION.CATEGORY + categoryid + '/' + constant.ACTION.VARIANTS + '?store=' + defaultStore + '&lang=' + currentLanguageCode;
        try {
            let response = await WebService.get(action);
            // console.log(response);
            if (response) {
                response.forEach(variant => {
                    if (variant.code === 'color') {
                        setColor(variant.options);
                    } else if (variant.code === "size") {
                        setSize(variant.options.reverse());
                    }
                });

            }
        } catch (error) {
        }
    }
    return (
        <Fragment>
            <MetaTags>
          <link rel="canonical" href={canonicalUrl()} />
                <title>{productDetails && productDetails.description.title}</title>
                <meta name="description" content={productDetails && productDetails.description.metaDescription} />
            </MetaTags>

            <BreadcrumbsItem to={process.env.PUBLIC_URL + '/'}>{strings["Home"]}</BreadcrumbsItem>
            {/* the parent's name, not its code: a slug like "poojaproducts"
                has no place in a trail a shopper reads */}
            {productDetails && productDetails.parent !== null &&
              <BreadcrumbsItem
                onClick={() => setCategoryID(productDetails.parent.id)}
                to={"/category/" + ((productDetails.parent.description
                  && productDetails.parent.description.friendlyUrl) || productDetails.parent.code)}>
                {(productDetails.parent.description && productDetails.parent.description.name)
                  || productDetails.parent.code}
              </BreadcrumbsItem>}
            <BreadcrumbsItem to={process.env.PUBLIC_URL + pathname}>{productDetails && productDetails.description.name}</BreadcrumbsItem>

            <Layout headerContainerClass="container-fluid"
                headerPaddingClass="header-padding-2"
                headerTop="visible">
                {/* breadcrumb */}
                <Breadcrumb />
                {/* category hero + blurb, as on the previous site */}
                <CategoryBanner
                    name={productDetails && productDetails.description && productDetails.description.name}
                    description={productDetails && productDetails.description && productDetails.description.description}
                    code={productDetails && productDetails.code}
                    parentCode={productDetails && productDetails.parent && productDetails.parent.code}
                    strings={strings}
                />

                <div className="shop-area pt-95 pb-100">
                    <div className="container">
                        {
                            productData.length > 0 ?
                                (<div className="row">
                                    {/* Leaf categories have no sub-categories, and
                                        nothing in this catalogue carries colours,
                                        sizes or a manufacturer, so ShopSidebar
                                        renders nothing at all on them. The column
                                        itself stayed though -- 300px wide and
                                        ~1000px tall of empty space -- pushing the
                                        grid to x=355 while every other section on
                                        the page starts at 55. Drop the column when
                                        it has no facets and let the grid use the
                                        full width. */}
                                    {hasSidebar &&
                                    <div className="col-lg-3 order-2 order-lg-1">
                                        {/* shop sidebar */}
                                        {/* <ShopSidebar products={products} getSortParams={getSortParams} sideSpaceClass="mr-30" /> */}
                                        <ShopSidebar string={strings} getSortParams={getSortParams} getCategoryParams={getCategoryParams} uniqueCategories={subCategory} priceBands={priceBands} activePriceBandId={activePriceBand} getPriceParams={getPriceParams} uniqueColors={color} uniqueSizes={size} uniqueManufacture={manufacture} sideSpaceClass="mr-30" />
                                    </div>
                                    }
                                    <div className={`${hasSidebar ? "col-lg-9" : "col-lg-12"} order-1 order-lg-2`}>
                                        {/* shop topbar default */}
                                        {/* <ShopTopbar getLayout={getLayout} getFilterSortParams={getFilterSortParams} productCount={products.length} sortedProductCount={productData.length} /> */}
                                        <ShopTopbar strings={strings} getLayout={getLayout} productCount={totalProduct} offset={offset + 1} pageLimit={pageLimit} sortedProductCount={productData.length} />

                                        {/* shop page content default */}
                                        <ShopProducts strings={strings} layout={layout} products={productData} />

                                        {/* shop product pagination */}


                                        <div className="pro-pagination-style text-center mt-30">
                                            <ReactPaginate
                                                previousLabel={'«'}
                                                nextLabel={'»'}
                                                breakLabel={'...'}
                                                breakClassName={'break-me'}
                                                pageCount={currentPage}
                                                forcePage={offset}
                                                onPageChange={(e) => setOffset(e.selected)}
                                                containerClassName={'mb-0 mt-0'}
                                                activeClassName={'page-item active'}
                                            />
                                        </div>

                                    </div>
                                </div>)
                                :
                                (
                                    !isLoading && <div className="col-lg-12">
                                        <div className="item-empty-area text-center">
                                            <div className="item-empty-area__icon mb-30">
                                                <i className="pe-7s-shopbag"></i>
                                            </div>
                                            <div className="item-empty-area__text">
                                                {strings["No items found in category"]}<br />{" "}

                                            </div>
                                        </div>
                                    </div>)
                        }
                    </div>
                </div>
            </Layout>
        </Fragment>
    )
}

Category.propTypes = {
    location: PropTypes.object,
    products: PropTypes.array
}

const mapStateToProps = (state, ownProps) => {

    return {
        currentLanguageCode: state.multilanguage.currentLanguageCode,
        // redux has not resolved the merchant on a cold load and an empty
        // store= silently returns nothing
        defaultStore: state.merchantData.defaultStore || window._env_.APP_MERCHANT,
        categoryID: state.productData.categoryid,
        routeSlug: ownProps.match && ownProps.match.params ? ownProps.match.params.id : null,
        isLoading: state.loading.isLoading

    }
}
const mapDispatchToProps = dispatch => {
    return {
        setLoader: (value) => {
            dispatch(setLoader(value));
        },
        setCategoryID: (value) => {
            dispatch(setCategoryID(value));
        },
    };
};
export default connect(mapStateToProps, mapDispatchToProps)(multilanguage(Category));