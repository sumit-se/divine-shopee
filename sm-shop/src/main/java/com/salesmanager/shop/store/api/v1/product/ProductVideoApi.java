package com.salesmanager.shop.store.api.v1.product;

import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import javax.inject.Inject;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.salesmanager.core.business.exception.ServiceException;
import com.salesmanager.core.business.services.catalog.product.ProductService;
import com.salesmanager.core.business.services.catalog.product.image.ProductImageService;
import com.salesmanager.core.model.catalog.product.Product;
import com.salesmanager.core.model.catalog.product.image.ProductImage;
import com.salesmanager.core.model.merchant.MerchantStore;
import com.salesmanager.shop.constants.Constants;
import com.salesmanager.shop.model.entity.Entity;
import com.salesmanager.shop.store.api.exception.OperationNotAllowedException;
import com.salesmanager.shop.store.api.exception.ResourceNotFoundException;
import com.salesmanager.shop.store.api.exception.ServiceRuntimeException;
import com.salesmanager.shop.store.api.exception.UnauthorizedException;
import com.salesmanager.shop.store.controller.user.facade.UserFacade;
import com.salesmanager.shop.utils.YouTubeVideos;

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiImplicitParam;
import io.swagger.annotations.ApiImplicitParams;
import io.swagger.annotations.ApiOperation;
import springfox.documentation.annotations.ApiIgnore;

/**
 * Adds a YouTube video to a product.
 *
 * A video is kept the way Shopizer already models one: a product image of type
 * 1 whose PRODUCT_IMAGE_URL is the video's address, and no file. It is listed,
 * reordered and removed with the product's images through ProductImageApi;
 * readers get it back with `videoUrl` set and a YouTube still as `imageUrl`.
 */
@RestController
@RequestMapping("/api/v1")
@Api(tags = { "Product videos" })
public class ProductVideoApi {

	@Inject
	private ProductService productService;

	@Inject
	private ProductImageService productImageService;

	@Inject
	private UserFacade userFacade;

	@ResponseStatus(HttpStatus.CREATED)
	@PostMapping("/private/product/{id}/video")
	@ApiOperation(httpMethod = "POST", value = "Add a YouTube video to a product; body {\"url\": \"https://youtu.be/...\"}")
	@ApiImplicitParams({ @ApiImplicitParam(name = "store", dataType = "string", defaultValue = "DEFAULT") })
	public Entity addVideo(@PathVariable Long id, @RequestBody Map<String, String> body,
			@ApiIgnore MerchantStore merchantStore) {

		String user = userFacade.authenticatedUser();
		if (user == null) {
			throw new UnauthorizedException();
		}
		userFacade.authorizedGroup(user, Stream.of(Constants.GROUP_SUPERADMIN, Constants.GROUP_ADMIN,
				Constants.GROUP_ADMIN_CATALOGUE, Constants.GROUP_ADMIN_RETAIL).collect(Collectors.toList()));

		String videoId = YouTubeVideos.videoId(body == null ? null : body.get("url"));
		if (videoId == null) {
			throw new OperationNotAllowedException("Not a YouTube video link: use a youtube.com or youtu.be address");
		}

		Product product = productService.getById(id);
		if (product == null || !product.getMerchantStore().getId().equals(merchantStore.getId())) {
			throw new ResourceNotFoundException("Product [" + id + "] not found for store [" + merchantStore.getCode() + "]");
		}

		String watchUrl = YouTubeVideos.watchUrl(videoId);
		boolean exists = product.getImages().stream()
				.anyMatch(i -> i.getImageType() == YouTubeVideos.IMAGE_TYPE_VIDEO && watchUrl.equals(i.getProductImageUrl()));
		if (exists) {
			throw new OperationNotAllowedException("This video is already on the product");
		}

		// after everything already in the gallery
		int last = product.getImages().stream()
				.mapToInt(i -> i.getSortOrder() == null ? 0 : i.getSortOrder()).max().orElse(-1);

		ProductImage video = new ProductImage();
		video.setProduct(product);
		video.setImageType(YouTubeVideos.IMAGE_TYPE_VIDEO);
		video.setProductImageUrl(watchUrl);
		// the listing image of a product is its default one; a video never is
		video.setDefaultImage(false);
		video.setSortOrder(last + 1);
		try {
			video = productImageService.saveOrUpdate(video);
		} catch (ServiceException e) {
			throw new ServiceRuntimeException("Error while adding video to product [" + id + "]", e);
		}
		return new Entity(video.getId());
	}

}
