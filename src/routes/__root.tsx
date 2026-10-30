import type {ReactNode} from "react";
import {useEffect, useState} from "react";
import {HeadContent, Outlet, Scripts, createRootRoute} from "@tanstack/react-router";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {Toaster} from "@/components/ui/toaster";
import {Toaster as Sonner} from "@/components/ui/sonner";
import {TooltipProvider} from "@/components/ui/tooltip";
import {LicenseProvider} from "@/contexts/LicenseContext";
import NotFound from "@/pages/NotFound";
import {initPwa} from "@/lib/pwa";
import {PLATFORM_META, PLATFORM_SCRIPTS} from "@/platform/scripts.gen";
import {HMR_CLIENT} from "@/platform/dev-hmr";
import appCss from "@/index.css?url";

const SITE_URL = "https://mine-emergency-map-editor.poehali.dev/";
const TITLE = "САУ — Схема аварийного участка | Программа для горноспасательной документации";
const DESCRIPTION =
    "Автоматизированная система оформления схем аварийного участка для горнодобывающих предприятий. Быстрое создание документов А4, экспорт PDF и Excel. Условные обозначения горноспасательной службы.";
const OG_TITLE = "САУ — Схема аварийного участка";
const OG_DESCRIPTION =
    "Автоматизированная система документации для горнодобывающих предприятий. Быстрое оформление схем аварийного участка, экспорт PDF и Excel.";
const OG_IMAGE =
    "https://cdn.poehali.dev/projects/9c8b2d5a-890f-4855-bc05-5374370e1c6d/files/9be0eeb3-c83f-451d-87e8-356f81c9986a.jpg";

const JSON_LD = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "САУ — Схема аварийного участка",
    description:
        "Автоматизированная система оформления схем аварийного участка для горнодобывающих предприятий. Быстрое создание документов А4, экспорт PDF и Excel.",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: SITE_URL,
    inLanguage: "ru",
    offers: {"@type": "Offer", price: "0", priceCurrency: "RUB"},
    author: {"@type": "Organization", name: "work_studio", email: "work_studio@internet.ru"},
    keywords: "схема аварийного участка, горноспасательная документация, программа для горнодобывающих предприятий",
};

const METRIKA = `(function (m, e, t, r, i, k, a) {
    m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments) };
    m[i].l = 1 * new Date();
    for (var j = 0; j < document.scripts.length; j++) { if (document.scripts[j].src === r) { return; } }
    k = e.createElement(t), a = e.getElementsByTagName(t)[0], k.async = 1, k.src = r, a.parentNode.insertBefore(k, a)
})(window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
ym(101026698, "init", { trustedDomains: ["poehali.dev"], clickmap: true, trackLinks: true, accurateTrackBounce: true, webvisor: true, trackHash: true });`;

export const Route = createRootRoute({
    head: () => ({
        meta: [
            {charSet: "utf-8"},
            {name: "viewport", content: "width=device-width, initial-scale=1.0, viewport-fit=cover"},
            {title: TITLE},
            {name: "description", content: DESCRIPTION},
            {
                name: "keywords",
                content:
                    "схема аварийного участка, горноспасательная документация, аварийная схема шахты, оформление горноспасательных схем, программа для горнодобывающих предприятий, САУ, схема выработки, аварийная документация, горноспасательная служба",
            },
            {name: "author", content: "work_studio@internet.ru"},
            {name: "robots", content: "index, follow"},
            {name: "language", content: "ru"},
            {name: "yandex-verification", content: "bb5d10ec644704f5"},
            {name: "theme-color", content: "#0d1520"},
            {name: "apple-mobile-web-app-capable", content: "yes"},
            {name: "apple-mobile-web-app-status-bar-style", content: "black-translucent"},
            {name: "apple-mobile-web-app-title", content: "САУ"},
            {name: "mobile-web-app-capable", content: "yes"},
            {name: "application-name", content: "САУ"},
            {property: "og:title", content: OG_TITLE},
            {property: "og:description", content: OG_DESCRIPTION},
            {property: "og:type", content: "website"},
            {property: "og:url", content: SITE_URL},
            {property: "og:locale", content: "ru_RU"},
            {property: "og:image", content: OG_IMAGE},
            {property: "og:image:width", content: "1024"},
            {property: "og:image:height", content: "1024"},
            {property: "og:image:alt", content: "САУ — Схема аварийного участка для горнодобывающих предприятий"},
            {property: "og:site_name", content: "САУ — Схема аварийного участка"},
            {name: "twitter:card", content: "summary"},
            {name: "twitter:title", content: OG_TITLE},
            {name: "twitter:description", content: "Автоматизированная система документации для горнодобывающих предприятий."},
            {name: "twitter:image", content: OG_IMAGE},
            ...PLATFORM_META,
        ],
        links: [
            {rel: "stylesheet", href: appCss},
            {rel: "canonical", href: SITE_URL},
            {rel: "preconnect", href: "https://fonts.googleapis.com"},
            {rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous"},
            {
                rel: "stylesheet",
                href: "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap",
            },
            {rel: "icon", type: "image/svg+xml", href: "/logo.svg"},
            {rel: "shortcut icon", href: "/logo.svg"},
            {rel: "manifest", href: "/manifest.webmanifest"},
            {rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png"},
        ],
        // IMPORTANT: DO NOT REMOVE PLATFORM SCRIPTS AND THE DEV HMR CLIENT!
        scripts: [
            ...(import.meta.env.DEV ? [{children: HMR_CLIENT}] : []),
            ...PLATFORM_SCRIPTS,
            {type: "application/ld+json", children: JSON.stringify(JSON_LD)},
            {children: METRIKA},
        ],
    }),
    component: RootComponent,
    notFoundComponent: NotFound,
});

function RootComponent() {
    const [queryClient] = useState(() => new QueryClient());

    useEffect(() => {
        initPwa();
    }, []);

    return (
        <RootDocument>
            <QueryClientProvider client={queryClient}>
                <LicenseProvider>
                    <TooltipProvider>
                        <Toaster/>
                        <Sonner/>
                        <Outlet/>
                    </TooltipProvider>
                </LicenseProvider>
            </QueryClientProvider>
        </RootDocument>
    );
}

function RootDocument({children}: { children: ReactNode }) {
    return (
        <html lang="ru">
        <head>
            <HeadContent/>
        </head>
        <body>
        {children}
        <noscript>
            <div><img src="https://mc.yandex.ru/watch/101026698" style={{position: "absolute", left: "-9999px"}} alt=""/></div>
        </noscript>
        <Scripts/>
        </body>
        </html>
    );
}
