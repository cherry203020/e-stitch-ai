/**
 * Google Maps integration for tailor location display.
 * Set VITE_GOOGLE_MAPS_API_KEY in .env to enable.
 */
import { useEffect, useRef } from 'react';

interface MapProps {
  latitude: number;
  longitude: number;
  label?: string;
  className?: string;
}

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

export default function Map({ latitude, longitude, label, className }: MapProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!API_KEY || !ref.current) return;

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}`;
    script.async = true;
    script.onload = () => {
      const map = new (window as unknown as { google: { maps: { Map: new (el: HTMLElement, opts: object) => void; LatLng: new (lat: number, lng: number) => object; Marker: new (opts: object) => void } }).google.maps.Map(ref.current!, {
        center: { lat: latitude, lng: longitude },
        zoom: 15,
      });
      new (window as unknown as { google: { maps: { Marker: new (opts: object) => void } }).google.maps.Marker({
        position: { lat: latitude, lng: longitude },
        map,
        title: label || 'Location',
      });
    };
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, [latitude, longitude, label]);

  if (!API_KEY) {
    return (
      <div className={className} style={{ padding: '1rem', background: 'var(--color-border)', borderRadius: 8 }}>
        <a
          href={`https://www.google.com/maps?q=${latitude},${longitude}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          View on Google Maps ({latitude.toFixed(4)}, {longitude.toFixed(4)})
        </a>
      </div>
    );
  }

  return <div ref={ref} className={className} style={{ height: 200, borderRadius: 8 }} />;
}
