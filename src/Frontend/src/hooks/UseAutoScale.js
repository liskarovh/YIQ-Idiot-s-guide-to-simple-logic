import { useEffect, useState } from "react";

/**
 * Spočítá scale podle velikosti viewportu.
 * - baseWidth/baseHeight: rozměr referenčního designu (např. 1920×1080)
 * - fit: 'contain' (vejde se celé) nebo 'cover' (vyplní, může se oříznout)
 * - minScale/maxScale: clamp, aby to nebylo moc malé/velké
 */
export default function useAutoScale(
    baseWidth = 1920,
    baseHeight = 1080,
    { fit = "contain", minScale = 0.5, maxScale = 1 } = {}
) {
    const [scale, setScale] = useState(1);

    useEffect(() => {
        function update() {
            const vw = window.innerWidth;
            const vh = window.innerHeight;
            const sw = vw / baseWidth;
            const sh = vh / baseHeight;
            let s = fit === "cover" ? Math.max(sw, sh) : Math.min(sw, sh);
            s = Math.min(maxScale, Math.max(minScale, s));
            setScale(s);
        }
        update();
        window.addEventListener("resize", update);
        return () => window.removeEventListener("resize", update);
    }, [baseWidth, baseHeight, minScale, maxScale, fit]);

    return scale;
}
