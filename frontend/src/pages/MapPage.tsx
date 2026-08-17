    import { useEffect, useRef } from "react";

    declare global {
    interface Window {
        naver: any;
    }
    }

    export default function MapPage() {
    const mapRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const createMap = () => {
        if (!mapRef.current) return;
        new window.naver.maps.Map(mapRef.current, {
            center: new window.naver.maps.LatLng(37.5665, 126.978),
            zoom: 15,
        });
        };

        if (window.naver) {
        createMap();
        return;
        }

        const script = document.createElement("script");
        script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${import.meta.env.VITE_NAVER_MAP_CLIENT_ID}`;
        script.onload = createMap;
        document.head.appendChild(script);
    }, []);

    return <div ref={mapRef} style={{ width: "100%", height: "100vh" }} />;
    }
