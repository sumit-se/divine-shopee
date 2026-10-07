package com.salesmanager.shop.utils;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Product videos are YouTube links, stored as a product image of type 1 whose
 * PRODUCT_IMAGE_URL is the watch address. These turn any YouTube address a
 * shopkeeper might paste into that one form, and give the picture that stands
 * in for the video in galleries and listings.
 */
public final class YouTubeVideos {

	public static final int IMAGE_TYPE_VIDEO = 1;

	// the 11-character id in watch?v=, youtu.be/, /shorts/, /embed/ and /live/ links
	private static final Pattern ID = Pattern.compile(
			"(?:youtube(?:-nocookie)?\\.com/(?:watch\\?(?:.*&)?v=|shorts/|embed/|live/|v/)|youtu\\.be/)([A-Za-z0-9_-]{11})");

	private YouTubeVideos() {
	}

	/** The video id in a YouTube address, or null when it is not one. */
	public static String videoId(String url) {
		if (url == null) {
			return null;
		}
		Matcher m = ID.matcher(url.trim());
		return m.find() ? m.group(1) : null;
	}

	public static String watchUrl(String id) {
		return "https://www.youtube.com/watch?v=" + id;
	}

	/** YouTube's own still for the video, shown where the gallery expects a picture. */
	public static String thumbnailUrl(String url) {
		String id = videoId(url);
		return id == null ? url : "https://img.youtube.com/vi/" + id + "/hqdefault.jpg";
	}

}
