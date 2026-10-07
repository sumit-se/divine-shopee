package com.salesmanager.shop.model.shoppingcart;

import java.util.ArrayList;
import java.util.List;
import com.salesmanager.shop.model.entity.ReadableList;

public class ReadableCartSummaryList extends ReadableList {

	private static final long serialVersionUID = 1L;

	private List<ReadableCartSummary> carts = new ArrayList<ReadableCartSummary>();

	public List<ReadableCartSummary> getCarts() {
		return carts;
	}

	public void setCarts(List<ReadableCartSummary> carts) {
		this.carts = carts;
	}

}
