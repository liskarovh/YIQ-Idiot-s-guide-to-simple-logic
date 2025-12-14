/**
 * @file UseMediaQuery.js
 * @brief A custom React hook for handling media queries.
 *
 * @author Jan Kalina \<xkalinj00>
 */

import {useEffect, useState} from "react";

export function useMediaQuery(query) {
    const [matches, setMatches] = useState(() => window.matchMedia(query).matches);

    useEffect(() => {
        const media = window.matchMedia(query);
        const onChange = () => setMatches(media.matches);
        media.addEventListener?.("change", onChange) ?? media.addListener(onChange);
        return () => media.removeEventListener?.("change", onChange) ?? media.removeListener(onChange);
    }, [query]);

    return matches;
}
