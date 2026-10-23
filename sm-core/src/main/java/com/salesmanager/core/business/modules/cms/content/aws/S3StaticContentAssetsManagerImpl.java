package com.salesmanager.core.business.modules.cms.content.aws;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.IOException;
import java.io.ByteArrayInputStream;
import java.net.URLConnection;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.apache.commons.collections4.CollectionUtils;
import org.apache.commons.io.IOUtils;
import org.apache.commons.io.FilenameUtils;
import java.util.Locale;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.amazonaws.client.builder.AwsClientBuilder;
import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.AmazonS3ClientBuilder;
import com.amazonaws.services.s3.model.AmazonS3Exception;
import com.amazonaws.services.s3.model.Bucket;
import com.amazonaws.services.s3.model.CannedAccessControlList;
import com.amazonaws.services.s3.model.ListObjectsV2Request;
import com.amazonaws.services.s3.model.ListObjectsV2Result;
import com.amazonaws.services.s3.model.ObjectMetadata;
import com.amazonaws.services.s3.model.PutObjectRequest;
import com.amazonaws.services.s3.model.S3Object;
import com.amazonaws.services.s3.model.S3ObjectSummary;
import com.salesmanager.core.business.exception.ServiceException;
import com.salesmanager.core.business.modules.cms.content.ContentAssetsManager;
import com.salesmanager.core.business.modules.cms.impl.CMSManager;
import com.salesmanager.core.model.content.FileContentType;
import com.salesmanager.core.model.content.InputContentFile;
import com.salesmanager.core.model.content.OutputContentFile;

/**
 * Static content management with S3
 * 
 * @author carlsamson
 *
 */
public class S3StaticContentAssetsManagerImpl implements ContentAssetsManager {

	private static final long serialVersionUID = 1L;

	private static final Logger LOGGER = LoggerFactory.getLogger(S3StaticContentAssetsManagerImpl.class);

	private static final String DEFAULT_REGION_NAME = "us-east-1";

	private static S3StaticContentAssetsManagerImpl fileManager = null;

	private CMSManager cmsManager;

	public static S3StaticContentAssetsManagerImpl getInstance() {

		if (fileManager == null) {
			fileManager = new S3StaticContentAssetsManagerImpl();
		}

		return fileManager;

	}

	@Override
	public OutputContentFile getFile(String merchantStoreCode, Optional<String> folderPath, FileContentType fileContentType, String contentName)
			throws ServiceException {
		try {
			// get buckets
			String bucketName = bucketName();

			final AmazonS3 s3 = s3Client();

			S3Object o = s3.getObject(bucketName, nodePath(merchantStoreCode, fileContentType) + contentName);

			LOGGER.info("Content getFile");
			return getOutputContentFile(IOUtils.toByteArray(o.getObjectContent()));
		} catch (final Exception e) {
			LOGGER.error("Error while getting file", e);
			throw new ServiceException(e);

		}
	}

	@Override
	public List<String> getFileNames(String merchantStoreCode, Optional<String> folderPath, FileContentType fileContentType)
			throws ServiceException {
		try {
			// get buckets
			String bucketName = bucketName();

			ListObjectsV2Request listObjectsRequest = new ListObjectsV2Request().withBucketName(bucketName)
					.withPrefix(nodePath(merchantStoreCode, fileContentType));

			List<String> fileNames = null;

			final AmazonS3 s3 = s3Client();
			ListObjectsV2Result results = s3.listObjectsV2(listObjectsRequest);
			List<S3ObjectSummary> objects = results.getObjectSummaries();
			for (S3ObjectSummary os : objects) {
				if (isInsideSubFolder(os.getKey())) {
					continue;
				}
				if (fileNames == null) {
					fileNames = new ArrayList<String>();
				}
				String mimetype = URLConnection.guessContentTypeFromName(os.getKey());
				if (!StringUtils.isBlank(mimetype)) {
					fileNames.add(getName(os.getKey()));
				}
			}

			LOGGER.info("Content get file names");
			return fileNames;
		} catch (final Exception e) {
			LOGGER.error("Error while getting file names", e);
			throw new ServiceException(e);

		}
	}

	@Override
	public List<OutputContentFile> getFiles(String merchantStoreCode, Optional<String> folderPath, FileContentType fileContentType)
			throws ServiceException {
		try {
			// get buckets
			String bucketName = bucketName();

			ListObjectsV2Request listObjectsRequest = new ListObjectsV2Request().withBucketName(bucketName)
					.withPrefix(nodePath(merchantStoreCode, fileContentType));

			List<OutputContentFile> files = null;
			final AmazonS3 s3 = s3Client();
			ListObjectsV2Result results = s3.listObjectsV2(listObjectsRequest);
			List<S3ObjectSummary> objects = results.getObjectSummaries();
			for (S3ObjectSummary os : objects) {
				if (files == null) {
					files = new ArrayList<OutputContentFile>();
				}
				String mimetype = URLConnection.guessContentTypeFromName(os.getKey());
				if (!StringUtils.isBlank(mimetype)) {
					S3Object o = s3.getObject(bucketName, os.getKey());
					byte[] byteArray = IOUtils.toByteArray(o.getObjectContent());
					ByteArrayOutputStream baos = new ByteArrayOutputStream(byteArray.length);
					baos.write(byteArray, 0, byteArray.length);
					OutputContentFile ct = new OutputContentFile();
					ct.setFile(baos);
					files.add(ct);
				}
			}

			LOGGER.info("Content getFiles");
			return files;
		} catch (final Exception e) {
			LOGGER.error("Error while getting files", e);
			throw new ServiceException(e);

		}
	}

	@Override
	public void addFile(String merchantStoreCode, Optional<String> folderPath, InputContentFile inputStaticContentData) throws ServiceException {

		try {
			// get buckets
			String bucketName = bucketName();

			String nodePath = nodePath(merchantStoreCode, inputStaticContentData.getFileContentType());

			final AmazonS3 s3 = s3Client();

			PutObjectRequest request = sizedRequest(bucketName,
					nodePath + inputStaticContentData.getFileName(),
					inputStaticContentData.getFile(), inputStaticContentData.getMimeType(),
					cacheControl(inputStaticContentData.getFileContentType()));

			s3.putObject(request);

			LOGGER.info("Content add file");
		} catch (final Exception e) {
			LOGGER.error("Error while adding file", e);
			throw new ServiceException(e);

		}

	}

	@Override
	public void addFiles(String merchantStoreCode, Optional<String> folderPath, List<InputContentFile> inputStaticContentDataList)
			throws ServiceException {

		if (CollectionUtils.isNotEmpty(inputStaticContentDataList)) {
			for (InputContentFile inputFile : inputStaticContentDataList) {
				this.addFile(merchantStoreCode, folderPath, inputFile);
			}

		}

	}

	@Override
	public void removeFile(String merchantStoreCode, FileContentType staticContentType, String fileName, Optional<String> folderPath)
			throws ServiceException {

		try {
			// get buckets
			String bucketName = bucketName();

			final AmazonS3 s3 = s3Client();
			s3.deleteObject(bucketName, nodePath(merchantStoreCode, staticContentType) + fileName);

			LOGGER.info("Remove file");
		} catch (final Exception e) {
			LOGGER.error("Error while removing file", e);
			throw new ServiceException(e);

		}

	}

	@Override
	public void removeFiles(String merchantStoreCode, Optional<String> folderPath) throws ServiceException {

		try {
			// get buckets
			String bucketName = bucketName();

			final AmazonS3 s3 = s3Client();
			s3.deleteObject(bucketName, nodePath(merchantStoreCode));

			LOGGER.info("Remove folder");
		} catch (final Exception e) {
			LOGGER.error("Error while removing folder", e);
			throw new ServiceException(e);

		}

	}

	private Bucket getBucket(String bucket_name) {
		final AmazonS3 s3 = s3Client();
		Bucket named_bucket = null;
		List<Bucket> buckets = s3.listBuckets();
		for (Bucket b : buckets) {
			if (b.getName().equals(bucket_name)) {
				named_bucket = b;
			}
		}

		if (named_bucket == null) {
			named_bucket = createBucket(bucket_name);
		}

		return named_bucket;
	}

	private Bucket createBucket(String bucket_name) {
		final AmazonS3 s3 = s3Client();
		Bucket b = null;
		if (s3.doesBucketExistV2(bucket_name)) {
			System.out.format("Bucket %s already exists.\n", bucket_name);
			b = getBucket(bucket_name);
		} else {
			try {
				b = s3.createBucket(bucket_name);
			} catch (AmazonS3Exception e) {
				System.err.println(e.getErrorMessage());
			}
		}
		return b;
	}

	private AmazonS3 s3Client() {
		String region = regionName();
		String endpoint = getCmsManager().getEndpoint();
		LOGGER.debug("AWS CMS Using region " + region);
		if (!org.apache.commons.lang3.StringUtils.isBlank(endpoint)) {
			return AmazonS3ClientBuilder.standard()
					.withEndpointConfiguration(new AwsClientBuilder.EndpointConfiguration(endpoint, region))
					.withPathStyleAccessEnabled(true)
					.build();
		}
		return AmazonS3ClientBuilder.standard().withRegion(region).build();
	}

	private String regionName() {
		String regionName = getCmsManager().getLocation();
		if (StringUtils.isBlank(regionName)) {
			regionName = DEFAULT_REGION_NAME;
		}
		return regionName;
	}

	public CMSManager getCmsManager() {
		return cmsManager;
	}

	public void setCmsManager(CMSManager cmsManager) {
		this.cmsManager = cmsManager;
	}

	@Override
	public void addFolder(String merchantStoreCode, String folderName, Optional<String> folderPath) throws ServiceException {
		// TODO Auto-generated method stub

	}

	@Override
	public void removeFolder(String merchantStoreCode, String folderName, Optional<String> folderPath) throws ServiceException {
		// TODO Auto-generated method stub

	}


	@Override
	public List<String> listFolders(String merchantStoreCode, Optional<String> path) throws ServiceException {
		// TODO Auto-generated method stub
		return null;
	}


	/**
	 * The metadata carried no content length, which leaves the SDK to work the
	 * length out from the stream and, when it cannot, to send the body chunked
	 * under a streaming signature. Cloudflare R2 does not accept that signature
	 * and answers "InvalidArgument: Authorization", which is what an upload here
	 * died of -- not every time, since whether the length can be worked out
	 * depends on the kind of stream the request arrived on, which made it look
	 * intermittent. Reading the bytes first and declaring the length always
	 * sends an ordinary signed PUT.
	 */
	private PutObjectRequest sizedRequest(String bucketName, String key, InputStream content, String mimeType,
			String cacheControl) throws IOException {
		ByteArrayOutputStream buffer = new ByteArrayOutputStream();
		IOUtils.copy(content, buffer);
		byte[] bytes = buffer.toByteArray();
		ObjectMetadata metadata = new ObjectMetadata();
		metadata.setContentType(contentType(mimeType, key));
		metadata.setContentLength(bytes.length);
		metadata.setCacheControl(cacheControl);
		return new PutObjectRequest(bucketName, key, new ByteArrayInputStream(bytes), metadata);
	}

	/*
	 * Nothing written here carried a Cache-Control, so browsers fell back to
	 * guessing freshness from the object's age -- which caches a file least
	 * when it is new and most when it is old, the opposite of what is wanted.
	 *
	 * How long we can promise depends on whether the key can ever come back
	 * with different bytes behind it. A variant image cannot: ProductVariantImageApi
	 * names it variant-<id>-<millis>.jpg, so every upload is its own key and the
	 * old one is simply abandoned. A logo or a content file is stored under
	 * whatever name the caller chose, and re-uploading an edited logo keeps that
	 * name, so those only get a day -- long enough to be worth caching, short
	 * enough that a replacement is not stuck behind it.
	 */
	private static final String DEFAULT_CONTENT_TYPE = "application/octet-stream";

	/*
	 * A null mime type used to mean no Content-Type header at all, and S3 then
	 * stores the object as application/octet-stream. ProductImageApi never sets
	 * one -- it only hands over the stream and the filename -- so product images
	 * uploaded through it were served as a download rather than a picture. Thirteen
	 * objects in the bucket were found that way and corrected by hand; deriving the
	 * type from the key here is what stops the next upload recreating them.
	 */
	private String contentType(String mimeType, String key) {
		if (!StringUtils.isBlank(mimeType)) {
			return mimeType;
		}
		String extension = FilenameUtils.getExtension(key);
		if (extension == null) {
			return DEFAULT_CONTENT_TYPE;
		}
		switch (extension.toLowerCase(Locale.ROOT)) {
		case "jpg":
		case "jpeg":
			return "image/jpeg";
		case "png":
			return "image/png";
		case "gif":
			return "image/gif";
		case "webp":
			return "image/webp";
		case "svg":
			return "image/svg+xml";
		default:
			return DEFAULT_CONTENT_TYPE;
		}
	}

	private String cacheControl(FileContentType fileContentType) {
		return FileContentType.VARIANT.equals(fileContentType)
				? "public, max-age=31536000, immutable"
				: "public, max-age=86400";
	}
}
