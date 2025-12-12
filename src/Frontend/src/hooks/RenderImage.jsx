import React, {useMemo, isValidElement, cloneElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {getCachedImageUrl} from "./ImageUrlCache";

/**
 * Hook for rendering images from various formats.
 *
 * Supports:
 * - String URLs (returns <img> element)
 * - React elements (clones with merged styles)
 * - Function components (renders with provided styles)
 *
 * @param {string|React.Element|Function} image Image source (URL, React element, or component)
 * @param {string} alt Alternative text for the image (used only for string URLs)
 * @param {Object} style CSS styles to apply to the image
 * @returns {React.Element|null} Rendered image element or null if invalid format
 */
export function useRenderImage(image, alt = "", style = {}) {
    return useMemo(() => {
        // String URL
        if(typeof image === "string" && image) {
            return <img
                    src={image}
                    alt={alt}
                    style={style}
            />;
        }

        // React element --> clone and merge styles
        if(isValidElement(image)) {
            return cloneElement(image, {
                style: {
                    ...(image.props?.style || {}),
                    ...style
                }
            });
        }

        // Function component --> render with provided styles
        if(typeof image === "function") {
            const ImageComponent = image;
            return <ImageComponent style={style} />;
        }

        return null;
    }, [image, alt, style]);
} // useRenderImage()

/**
 * Converts various image formats to a URL string.
 *
 * Handles:
 * - String URLs (returns as-is)
 * - React elements with src prop (extracts src)
 * - Function components that render SVG (converts to data URL)
 *
 * @param {string|React.Element|Function} image Image to convert
 * @returns {string|null} URL string or null if conversion fails
 */
function convertImageToUrl(image) {
    // Already a string URL --> return immediately
    if(typeof image === "string") {
        return image;
    }

    // React element with src prop --> extract URL
    if(isValidElement(image) && image.props?.src) {
        return image.props.src;
    }

    // Function component --> render and convert
    if(typeof image === "function") {
        try {
            const rendered = image({});

            // Has src prop --> extract URL
            if(isValidElement(rendered) && rendered.props?.src) {
                return rendered.props.src;
            }

            // Is SVG element --> convert to data URL
            if(isValidElement(rendered) && rendered.type === "svg") {
                const svgString = renderToStaticMarkup(rendered);

                // Modern UTF-8 base64
                const utf8Bytes = new TextEncoder().encode(svgString);
                const base64Svg = btoa(String.fromCharCode(...utf8Bytes));

                return `data:image/svg+xml;base64,${base64Svg}`;
            }
        }
        catch(error) {
            return null;
        }
    }

    return null;
} // convertImageToUrl()

/**
 * Hook for getting a cached URL string from an image source.
 *
 * Converts images to URL strings and caches the result to avoid
 * redundant conversions. Ideal for use with CSS background-image
 * or when you need a URL string instead of a React element.
 *
 * @param {string|React.Element|Function} image Image source to convert
 * @returns {string|undefined} Cached URL string or undefined if conversion fails
 */
export function useImageUrl(image) {
    return useMemo(() => {
        return getCachedImageUrl(image, convertImageToUrl);
    }, [image]);
} // useImageUrl()
