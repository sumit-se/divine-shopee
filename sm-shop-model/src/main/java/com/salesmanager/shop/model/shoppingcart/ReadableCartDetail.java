package com.salesmanager.shop.model.shoppingcart;

import java.util.ArrayList;
import java.util.List;

/**
 * Admin view of a single cart with its priced lines.
 */
public class ReadableCartDetail extends ReadableCartSummary {

	private static final long serialVersionUID = 1L;

	private List<ReadableCartDetailItem> items = new ArrayList<ReadableCartDetailItem>();
	private String displayTotal;

	public List<ReadableCartDetailItem> getItems() {
		return items;
	}

	public void setItems(List<ReadableCartDetailItem> items) {
		this.items = items;
	}

	public String getDisplayTotal() {
		return displayTotal;
	}

	public void setDisplayTotal(String displayTotal) {
		this.displayTotal = displayTotal;
	}

}
