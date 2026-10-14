package com.salesmanager.shop.store.api.v2.product;

import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import javax.inject.Inject;

import org.apache.commons.io.FilenameUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.salesmanager.core.business.exception.ServiceException;
import com.salesmanager.core.business.services.catalog.product.variant.ProductVariantGroupService;
import com.salesmanager.core.business.services.catalog.product.variant.ProductVariantService;
import com.salesmanager.core.model.catalog.product.variant.ProductVariant;
import com.salesmanager.core.model.catalog.product.variant.ProductVariantGroup;
import com.salesmanager.core.model.catalog.product.variant.ProductVariantImage;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.ImageOutputStream;
import com.salesmanager.core.business.utils.ProductImageSizeUtils;
import com.salesmanager.core.model.content.FileContentType;
import com.salesmanager.core.model.content.InputContentFile;
import com.salesmanager.core.model.merchant.MerchantStore;
import com.salesmanager.core.model.reference.language.Language;
import com.salesmanager.shop.constants.Constants;
import com.salesmanager.shop.model.catalog.product.ReadableImage;
import com.salesmanager.shop.store.api.exception.OperationNotAllowedException;
import com.salesmanager.shop.store.api.exception.ResourceNotFoundException;
import com.salesmanager.shop.store.api.exception.ServiceRuntimeException;
import com.salesmanager.shop.store.api.exception.UnauthorizedException;
import com.salesmanager.shop.store.controller.user.facade.UserFacade;
import com.salesmanager.shop.utils.ImageFilePath;

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiImplicitParam;
import io.swagger.annotations.ApiImplicitParams;
import io.swagger.annotations.ApiOperation;
import springfox.documentation.annotations.ApiIgnore;

/**
 * Images of a single variant. Shopizer keeps variant images on a variant group;
 * a variant that has none is given a group of its own on its first image, so
 * callers only ever deal with the variant. Every call answers with the
 * variant's images, main image first.
 */
@RestController
@RequestMapping("/api/v2")
@Api(tags = { "Product variant images" })
public class ProductVariantImageApi {

	private static final List<String> EXTENSIONS = List.of("jpg", "jpeg", "png", "gif", "webp");

	@Autowired
	private ProductVariantService productVariantService;

	@Autowired
	private ProductVariantGroupService productVariantGroupService;

	@Inject
	private UserFacade userFacade;

	@Autowired
	@Qualifier("img")
	private ImageFilePath imageUtils;

	@GetMapping("/private/product/{productId}/variant/{variantId}/images")
	@ApiOperation(httpMethod = "GET", value = "List a variant's images, main image first")
	@ApiImplicitParams({ @ApiImplicitParam(name = "store", dataType = "string", defaultValue = "DEFAULT"),
			@ApiImplicitParam(name = "lang", dataType = "string", defaultValue = "en") })
	public List<ReadableImage> list(@PathVariable Long productId, @PathVariable Long variantId,
			@ApiIgnore MerchantStore merchantStore, @ApiIgnore Language language) {
		authorize();
		return images(variant(productId, variantId, merchantStore), merchantStore);
	}

	@ResponseStatus(HttpStatus.CREATED)
	@PostMapping(value = "/private/product/{productId}/variant/{variantId}/image", consumes = {
			MediaType.MULTIPART_FORM_DATA_VALUE })
	@ApiOperation(httpMethod = "POST", value = "Add an image to a variant")
	@ApiImplicitParams({ @ApiImplicitParam(name = "store", dataType = "string", defaultValue = "DEFAULT"),
			@ApiImplicitParam(name = "lang", dataType = "string", defaultValue = "en") })
	public List<ReadableImage> add(@PathVariable Long productId, @PathVariable Long variantId,
			@RequestParam(value = "file", required = true) MultipartFile file,
			@ApiIgnore MerchantStore merchantStore, @ApiIgnore Language language) {
		authorize();
		ProductVariant variant = variant(productId, variantId, merchantStore);

		String extension = FilenameUtils.getExtension(file.getOriginalFilename()).toLowerCase(Locale.ROOT);
		if (file.isEmpty() || !EXTENSIONS.contains(extension)) {
			throw new OperationNotAllowedException("Variant images must be one of " + EXTENSIONS);
		}

		try {
			InputContentFile content = new InputContentFile();
			// files are keyed by store and type only, so the name alone has to be unique.
			// Always .jpg: the name is ours to choose and everything that comes out of
			// scaleForWeb is a JPEG.
			content.setFileName("variant-" + variantId + "-" + System.currentTimeMillis() + ".jpg");
			content.setMimeType(MediaType.IMAGE_JPEG_VALUE);
			content.setFile(new ByteArrayInputStream(scaleForWeb(file)));
			content.setFileContentType(FileContentType.VARIANT);
			productVariantGroupService.addVariantImage(variant, content, merchantStore);
		} catch (Exception e) {
			throw new ServiceRuntimeException("Error while adding image to variant [" + variantId + "]", e);
		}
		return images(variant(productId, variantId, merchantStore), merchantStore);
	}

	@DeleteMapping("/private/product/{productId}/variant/{variantId}/image/{imageId}")
	@ApiOperation(httpMethod = "DELETE", value = "Remove one of a variant's images")
	@ApiImplicitParams({ @ApiImplicitParam(name = "store", dataType = "string", defaultValue = "DEFAULT"),
			@ApiImplicitParam(name = "lang", dataType = "string", defaultValue = "en") })
	public List<ReadableImage> remove(@PathVariable Long productId, @PathVariable Long variantId,
			@PathVariable Long imageId, @ApiIgnore MerchantStore merchantStore, @ApiIgnore Language language) {
		authorize();
		try {
			if (!productVariantGroupService.removeVariantImage(variant(productId, variantId, merchantStore), imageId,
					merchantStore)) {
				throw new ResourceNotFoundException("Image [" + imageId + "] not found on variant [" + variantId + "]");
			}
		} catch (ServiceException e) {
			throw new ServiceRuntimeException("Error while removing image [" + imageId + "]", e);
		}
		return images(variant(productId, variantId, merchantStore), merchantStore);
	}

	@PutMapping("/private/product/{productId}/variant/{variantId}/image/{imageId}/default")
	@ApiOperation(httpMethod = "PUT", value = "Make one of a variant's images its main image")
	@ApiImplicitParams({ @ApiImplicitParam(name = "store", dataType = "string", defaultValue = "DEFAULT"),
			@ApiImplicitParam(name = "lang", dataType = "string", defaultValue = "en") })
	public List<ReadableImage> setDefault(@PathVariable Long productId, @PathVariable Long variantId,
			@PathVariable Long imageId, @ApiIgnore MerchantStore merchantStore, @ApiIgnore Language language) {
		authorize();
		try {
			if (!productVariantGroupService.setDefaultVariantImage(variant(productId, variantId, merchantStore),
					imageId, merchantStore)) {
				throw new ResourceNotFoundException("Image [" + imageId + "] not found on variant [" + variantId + "]");
			}
		} catch (ServiceException e) {
			throw new ServiceRuntimeException("Error while updating image [" + imageId + "]", e);
		}
		return images(variant(productId, variantId, merchantStore), merchantStore);
	}

	private void authorize() {
		String authenticatedUser = userFacade.authenticatedUser();
		if (authenticatedUser == null) {
			throw new UnauthorizedException();
		}
		userFacade.authorizedGroup(authenticatedUser, Stream.of(Constants.GROUP_SUPERADMIN, Constants.GROUP_ADMIN,
				Constants.GROUP_ADMIN_CATALOGUE, Constants.GROUP_ADMIN_RETAIL).collect(Collectors.toList()));
	}

	private ProductVariant variant(Long productId, Long variantId, MerchantStore store) {
		return productVariantService.getById(variantId, productId, store).orElseThrow(
				() -> new ResourceNotFoundException("Variant [" + variantId + "] not found for product [" + productId + "]"));
	}

	private List<ReadableImage> images(ProductVariant variant, MerchantStore store) {
		// looked up by query: a group created during this request was attached with
		// a bulk update, which the variant entity already loaded does not see
		ProductVariantGroup group = productVariantGroupService.getByProductVariant(variant.getId(), store, null)
				.orElse(null);
		if (group == null) {
			return List.of();
		}
		return group.getImages().stream()
				.sorted(Comparator.comparing(ProductVariantImage::isDefaultImage).reversed()
						.thenComparing(ProductVariantImage::getId))
				.map(i -> {
					ReadableImage img = new ReadableImage();
					img.setId(i.getId());
					img.setImageName(i.getProductImage());
					img.setDefaultImage(i.isDefaultImage());
					img.setImageUrl(imageUtils.buildCustomTypeImageUtils(store, i.getProductImage(), FileContentType.VARIANT));
					return img;
				}).collect(Collectors.toList());
	}


	/**
	 * The longest edge a stored bead photo is allowed. These arrive straight off
	 * a camera or a scanner -- 3900px and 2.5MB is typical -- and every one of
	 * them is downloaded in full by any shopper who opens the product, because
	 * the shop has no smaller copy of a variant image to fall back on. 1600
	 * keeps a lab report's small print readable in the full-screen viewer, which
	 * is the most demanding thing these are used for.
	 */
	private static final int VARIANT_MAX_EDGE = 1600;

	/** JPEG quality for the stored copy; 0.85 is visually clean on photographs. */
	private static final float VARIANT_JPEG_QUALITY = 0.85f;

	/**
	 * The uploaded image, scaled to {@link #VARIANT_MAX_EDGE} if it is larger and
	 * encoded as JPEG.
	 *
	 * Product images already get this treatment -- Shopizer resizes them on the
	 * way in and keeps the original beside them -- but variant images are filed
	 * as plain content, which stores whatever it is handed. That is why a bead
	 * photo was costing a page several megabytes while the product photo beside
	 * it cost a hundred kilobytes.
	 */
	private byte[] scaleForWeb(MultipartFile file) throws IOException {
		byte[] original = file.getBytes();
		BufferedImage source = ImageIO.read(new ByteArrayInputStream(original));
		if (source == null) {
			// not something ImageIO can decode: store it untouched rather than lose it
			return original;
		}
		BufferedImage scaled = source;
		if (source.getWidth() > VARIANT_MAX_EDGE || source.getHeight() > VARIANT_MAX_EDGE) {
			scaled = ProductImageSizeUtils.resizeWithRatio(source, VARIANT_MAX_EDGE, VARIANT_MAX_EDGE);
		}
		// JPEG has no alpha; anything with transparency is flattened onto white
		// first, or the transparent areas come out black
		BufferedImage opaque = new BufferedImage(scaled.getWidth(), scaled.getHeight(), BufferedImage.TYPE_INT_RGB);
		Graphics2D g = opaque.createGraphics();
		g.setColor(Color.WHITE);
		g.fillRect(0, 0, opaque.getWidth(), opaque.getHeight());
		g.drawImage(scaled, 0, 0, null);
		g.dispose();

		ImageWriter writer = ImageIO.getImageWritersByFormatName("jpeg").next();
		ImageWriteParam params = writer.getDefaultWriteParam();
		params.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
		params.setCompressionQuality(VARIANT_JPEG_QUALITY);
		ByteArrayOutputStream out = new ByteArrayOutputStream();
		try (ImageOutputStream ios = ImageIO.createImageOutputStream(out)) {
			writer.setOutput(ios);
			writer.write(null, new IIOImage(opaque, null, null), params);
		} finally {
			writer.dispose();
		}
		return out.toByteArray();
	}
}
