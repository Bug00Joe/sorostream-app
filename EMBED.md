# Embeddable Stream Widget

SoroStream provides a lightweight, embeddable stream widget that developers can use to display real-time live stream status directly on third-party websites.

The widget is available at:
```
https://<your-domain>/streams/[id]/embed
```

---

## Query Parameters

You can customize the appearance and displayed components of the embedded widget using the following query parameters:

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `theme` | `string` | `dark` | Visual theme of the widget. Options: `light` or `dark`. |
| `show_amounts` | `boolean` | `true` | Set to `false` to hide the stream balance, total deposit, and flow rate. |
| `show_addresses` | `boolean` | `true` | Set to `false` to hide the Sender and Recipient addresses. |

### Example URL
```
https://sorostream.app/streams/123/embed?theme=light&show_amounts=true&show_addresses=false
```

---

## Iframe Sizing Recommendations

For optimal rendering and mobile responsiveness, we recommend the following dimensions:

- **Standard Widget (Compact)**: Use a height of `350px` if you are hiding amounts or addresses.
- **Full Widget**: Use a height of `500px` to display all elements (addresses, amounts, progress bar, etc.) without vertical scrollbars.
- **Width**: `100%` (responsive) with a `max-width` container of `600px` is recommended.

```css
iframe {
  width: 100%;
  max-width: 600px;
  height: 500px;
  border: none;
  border-radius: 12px;
  background-color: transparent;
}
```

---

## CORS & Frame Options Policy

To ensure developers can easily embed SoroStream widgets on external domains:
1. **Frame Options**: The widget page `/streams/[id]/embed` does not return `X-Frame-Options: DENY` or restrictive `Content-Security-Policy: frame-ancestors 'none'` headers. This allows the widget to be framed on any origin.
2. **CORS Policy**: Public read-only endpoints (e.g. public RPC requests or mock stream data fetches used by the widget) support Cross-Origin Resource Sharing (CORS) with `Access-Control-Allow-Origin: *` to enable widget logic to retrieve live stream details.

---

## HTML Integration Example

Here is a complete, ready-to-use HTML snippet for integrating the widget into your website:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SoroStream Integration</title>
  <style>
    .widget-container {
      margin: 2rem auto;
      max-width: 600px;
      padding: 1rem;
      border: 1px solid #374151;
      border-radius: 16px;
      background: #111827;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }
    iframe {
      width: 100%;
      height: 500px;
      border: none;
      border-radius: 12px;
    }
  </style>
</head>
<body>

  <div class="widget-container">
    <iframe 
      src="https://sorostream.app/streams/1/embed?theme=dark&show_amounts=true&show_addresses=true"
      title="SoroStream Widget"
      allow="clipboard-write"
      loading="lazy">
    </iframe>
  </div>

</body>
</html>
```
