<!DOCTYPE html>
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta name="viewport" content="width=device-width" />
<title>${PRODUCT_NAME} is available</title>
</head>
<!-- "notify me when available" (StockAlertService). Inline styles only: mail clients drop <style>. -->
<body style="margin:0;padding:0;background:#f6f1e7;font-family:Helvetica,Arial,sans-serif;color:#333;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f6f1e7;padding:24px 0;">
  <tr>
    <td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:10px;overflow:hidden;border:1px solid #ecdcc0;">
        <tr>
          <td style="background:#7f0000;padding:18px 24px;color:#ffffff;font-size:20px;font-weight:bold;">
            ${EMAIL_STORE_NAME}
          </td>
        </tr>
        <tr>
          <td style="padding:28px 24px 8px 24px;">
            <p style="margin:0 0 6px 0;font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#b36b00;font-weight:bold;">Good news</p>
            <h1 style="margin:0 0 12px 0;font-size:22px;line-height:1.3;color:#7f0000;">${PRODUCT_NAME} is available again</h1>
            <p style="margin:0 0 20px 0;font-size:15px;line-height:1.6;">
              You asked us to let you know when this was back. Our beads are one of a kind and
              tend to go quickly, so have a look while it is there.
            </p>
          </td>
        </tr>
        <#if PRODUCT_IMAGE?has_content>
        <tr>
          <td align="center" style="padding:0 24px 20px 24px;">
            <a href="${PRODUCT_URL}"><img src="${PRODUCT_IMAGE}" alt="${PRODUCT_NAME}" width="280" style="max-width:280px;width:100%;border-radius:8px;border:1px solid #eee;" /></a>
          </td>
        </tr>
        </#if>
        <tr>
          <td align="center" style="padding:0 24px 28px 24px;">
            <a href="${PRODUCT_URL}" style="display:inline-block;background:#7f0000;color:#ffffff;text-decoration:none;font-weight:bold;font-size:15px;padding:12px 28px;border-radius:24px;border:2px solid #ffa900;">View and buy</a>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 24px;background:#fbf6ec;font-size:12px;line-height:1.6;color:#888;">
            You received this one-time message because you asked to be notified about this product.
            <a href="${UNSUBSCRIBE_URL}" style="color:#888;">Cancel this alert</a>.
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>
