import sanitizeHtml from "sanitize-html";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function looksLikeHtml(content: string) {
  return /<\/?[a-z][\s\S]*>/i.test(content);
}

export function convertLegacyRichTextToHtml(content: string) {
  const trimmed = content.trim();
  if (!trimmed) {
    return "<p></p>";
  }

  if (looksLikeHtml(trimmed)) {
    return trimmed;
  }

  return trimmed
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      if (/^###\s+/.test(block)) {
        return `<h3>${escapeHtml(block.replace(/^###\s+/, ""))}</h3>`;
      }

      if (/^##\s+/.test(block)) {
        return `<h2>${escapeHtml(block.replace(/^##\s+/, ""))}</h2>`;
      }

      if (/^#\s+/.test(block)) {
        return `<h1>${escapeHtml(block.replace(/^#\s+/, ""))}</h1>`;
      }

      const lines = block
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

      if (lines.every((line) => /^[-*]\s+/.test(line))) {
        return `<ul>${lines
          .map((line) => `<li>${escapeHtml(line.replace(/^[-*]\s+/, ""))}</li>`)
          .join("")}</ul>`;
      }

      if (lines.every((line) => /^\d+\.\s+/.test(line))) {
        return `<ol>${lines
          .map((line) => `<li>${escapeHtml(line.replace(/^\d+\.\s+/, ""))}</li>`)
          .join("")}</ol>`;
      }

      return `<p>${escapeHtml(lines.join(" "))}</p>`;
    })
    .join("");
}

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    ...sanitizeHtml.defaults.allowedTags,
    "img",
    "h1",
    "h2",
    "h3",
    "figure",
    "figcaption",
  ],
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    a: ["href", "name", "target", "rel"],
    img: ["src", "alt", "title", "width", "height"],
  },
  allowedSchemes: ["http", "https", "mailto"],
  allowedSchemesByTag: {
    img: ["http", "https", "data"],
  },
};

export function sanitizeRichHtml(content: string) {
  return sanitizeHtml(content, SANITIZE_OPTIONS);
}

export function normalizeRichTextHtml(content: string) {
  return sanitizeRichHtml(convertLegacyRichTextToHtml(content));
}

export function stripHtml(content: string) {
  return content
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function getExcerptFromRichText(content: string, maxLength = 160) {
  const plainText = stripHtml(convertLegacyRichTextToHtml(content));
  if (plainText.length <= maxLength) {
    return plainText;
  }

  return `${plainText.slice(0, Math.max(0, maxLength - 1)).trimEnd()}...`;
}
