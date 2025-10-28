import { Controller, Get, Param } from '@nestjs/common';
@Controller('track')
export class TrackingController {
  @Get(':orderId')
  page(@Param('orderId') orderId: string) {
    const html = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>تتبع الطلب ${orderId}</title><style>body{font-family:sans-serif;background:#0b0b0f;color:#fff;margin:0;padding:1rem}#map{height:80vh;border-radius:12px}</style><link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script></head><body><h2>تتبع الطلب #${orderId}</h2><div id="map"></div><script>var map=L.map('map').setView([24.7136,46.6753],12);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(map);var marker=L.marker([24.7136,46.6753]).addTo(map);</script></body></html>`;
    return html;
  }
}
