import { useEffect, useState } from "react";

export function useMediaQuery(query) {
    const [matches, setMatches] = useState(() => window.matchMedia(query).matches);

    useEffect(() => {
        const m = window.matchMedia(query);
        const onChange = () => setMatches(m.matches);
        m.addEventListener?.("change", onChange) ?? m.addListener(onChange);
        return () => m.removeEventListener?.("change", onChange) ?? m.removeListener(onChange);
    }, [query]);

    return matches;
}
