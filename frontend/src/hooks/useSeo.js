import { useEffect } from "react";

const SITE_NAME = "UM-Nexa";
const COMPANY_SITE = (import.meta.env.VITE_COMPANY_SITE_URL || "").replace(/\/+$/, "");

// URL of the same page on the company site, used as the canonical URL so search engines
// treat the company site as the main copy. `path` is the same on both sites (for example
// "/courses/123"). Without VITE_COMPANY_SITE_URL the page is its own canonical.
export const companyCanonical = (path) => `${COMPANY_SITE || window.location.origin}${path}`;

const truncate = (text, max = 155) => {
    const clean = String(text ?? "").replace(/\s+/g, " ").trim();
    return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean;
};

// Each helper creates or updates one tag and returns a function that puts it back as it was.
const setMeta = (attr, key, content) => {
    let el = document.head.querySelector(`meta[${attr}="${key}"]`);
    const created = !el;
    if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
    }
    const previous = el.getAttribute("content");
    el.setAttribute("content", content);
    return () => {
        if (created) el.remove();
        else if (previous === null) el.removeAttribute("content");
        else el.setAttribute("content", previous);
    };
};

const setCanonical = (href) => {
    let el = document.head.querySelector('link[rel="canonical"]');
    const created = !el;
    if (!el) {
        el = document.createElement("link");
        el.setAttribute("rel", "canonical");
        document.head.appendChild(el);
    }
    const previous = el.getAttribute("href");
    el.setAttribute("href", href);
    return () => {
        if (created) el.remove();
        else if (previous === null) el.removeAttribute("href");
        else el.setAttribute("href", previous);
    };
};

/**
 * Sets the page's SEO tags while the component is mounted and restores the previous ones on
 * unmount. Anything left out is not touched. Call it unconditionally (before early returns);
 * values can be undefined until the data has loaded.
 *
 *  title        "Page name"; " | UM-Nexa" is added
 *  description  plain text, shortened to about 155 characters
 *  image        absolute URL for link previews (og:image)
 *  canonical    absolute URL (see companyCanonical)
 *  noindex      true to ask search engines to skip the page
 */
export default function useSeo({ title, description, image, canonical, noindex = false } = {}) {
    useEffect(() => {
        const undo = [];
        const previousTitle = document.title;

        const fullTitle = title ? (title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`) : "";
        if (fullTitle) {
            document.title = fullTitle;
            undo.push(setMeta("property", "og:title", fullTitle));
            undo.push(setMeta("property", "og:type", "website"));
        }

        const desc = description ? truncate(description) : "";
        if (desc) {
            undo.push(setMeta("name", "description", desc));
            undo.push(setMeta("property", "og:description", desc));
        }

        if (image) {
            undo.push(setMeta("property", "og:image", image));
            undo.push(setMeta("name", "twitter:card", "summary_large_image"));
        }

        if (canonical) {
            undo.push(setCanonical(canonical));
            undo.push(setMeta("property", "og:url", canonical));
        }

        if (noindex) undo.push(setMeta("name", "robots", "noindex, nofollow"));

        return () => {
            document.title = previousTitle;
            undo.reverse().forEach((fn) => fn());
        };
    }, [title, description, image, canonical, noindex]);
}