import sanitizeHtml from "sanitize-html";

/**
 * 어드민이 작성한 공지/이벤트 본문 HTML 새니타이즈 — 저장 콘텐츠를 렌더 직전에 정화(방어심화).
 * 서버 컴포넌트에서 dangerouslySetInnerHTML 에 넣기 전에 호출한다.
 * allow-list 기반이라 <script>/<iframe>/on*= 핸들러/javascript: 스킴 등은 전부 제거된다.
 */
export function cleanHtml(dirty: string | null | undefined): string {
    if (!dirty) return "";
    return sanitizeHtml(dirty, {
        allowedTags: [
            "p", "br", "hr", "span", "div", "blockquote", "pre",
            "strong", "b", "em", "i", "u", "s", "mark", "small", "sub", "sup",
            "ul", "ol", "li", "h1", "h2", "h3", "h4", "h5", "h6",
            "a", "img", "figure", "figcaption",
            "table", "thead", "tbody", "tr", "th", "td",
        ],
        allowedAttributes: {
            a: ["href", "title", "target", "rel"],
            img: ["src", "alt", "title", "width", "height"],
            "*": ["style"],
        },
        allowedSchemes: ["http", "https", "mailto", "tel"],
        allowedSchemesByTag: { img: ["http", "https", "data"] },
        // 외부 링크에 안전 rel 강제
        transformTags: {
            a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer nofollow" }),
        },
        // 인라인 style 은 안전한 속성/값만 통과 (url(javascript:)·expression 차단)
        allowedStyles: {
            "*": {
                "color": [/^#(0x)?[0-9a-f]+$/i, /^rgb\(/i, /^[a-z-]+$/i],
                "background-color": [/^#(0x)?[0-9a-f]+$/i, /^rgb\(/i, /^[a-z-]+$/i],
                "text-align": [/^(left|right|center|justify)$/],
                "font-weight": [/^(\d+|bold|normal)$/],
                "font-size": [/^\d+(?:px|em|rem|%)$/],
                "text-decoration": [/^[a-z- ]+$/i],
            },
        },
    });
}
