import PropTypes from "prop-types";
import React from "react";

/**
 * Renders a product description as readable, semantic sections.
 *
 * Every description in this catalogue is one continuous run of plain text with
 * no line breaks at all -- the 1 Mukhi entry is 1,393 unbroken characters --
 * which the theme dumped into a single <p>. The copy does carry its own
 * structure though, as inline labels ("Spiritual benefit:", "Health benefit :",
 * "Benefits"), so those are promoted to headings and the text between them
 * becomes the section body.
 *
 * Only colon-punctuated labels count, and text without one is simply broken
 * into paragraphs on sentence boundaries. Nothing is invented, reordered or
 * dropped -- every character of the source text is rendered.
 */

// Only labels the source actually punctuates as labels -- i.e. followed by a
// colon. That distinction matters: across the catalogue "benefits" is followed
// by a plain space 49 times ("benefits of wearing..."), and "benefit" appears
// inside "benefited". Treating those as headings split sentences mid-word and
// silently corrupted the copy, so a bare "Benefits" is deliberately NOT a
// label here -- only "Health benefits:" and friends are.
const SECTION_LABELS = [
  "Spiritual benefits",
  "Spiritual benefit",
  "Health benefits",
  "Health benefit",
  "Wearing method",
  "Recommended for",
  "The mantra",
  "Mantra"
];

const LABEL_PATTERN = new RegExp(
  "\\b(" + SECTION_LABELS.map(l => l.replace(/ /g, "\\s+")).join("|") + ")" +
    // the colon (or dash) is what makes it a label rather than prose
    "\\s*[:\\-\\u2013]\\s*",
  "gi"
);

// Long unbroken bodies are hard to read as a single block, so they are broken
// into paragraphs on sentence boundaries. This only inserts paragraph breaks --
// it never changes, reorders or drops any of the text.
const SENTENCES_PER_PARAGRAPH = 3;

const toParagraphs = body => {
  const sentences = body.match(/[^.!?]+(?:[.!?]+|$)/g);
  if (!sentences || sentences.length <= SENTENCES_PER_PARAGRAPH) return [body];
  const paras = [];
  for (let i = 0; i < sentences.length; i += SENTENCES_PER_PARAGRAPH) {
    paras.push(sentences.slice(i, i + SENTENCES_PER_PARAGRAPH).join("").trim());
  }
  return paras.filter(Boolean);
};

const splitIntoSections = text => {
  const sections = [];
  let lastIndex = 0;
  let pending = null;
  let match;

  LABEL_PATTERN.lastIndex = 0;
  while ((match = LABEL_PATTERN.exec(text)) !== null) {
    const body = text.slice(lastIndex, match.index).trim();
    if (pending) {
      if (body) sections.push({ heading: pending, body });
    } else if (body) {
      sections.push({ heading: null, body });
    }
    pending = match[1].replace(/\s+/g, " ").trim();
    lastIndex = LABEL_PATTERN.lastIndex;
  }

  const tail = text.slice(lastIndex).trim();
  if (pending) {
    if (tail) sections.push({ heading: pending, body: tail });
  } else if (tail) {
    sections.push({ heading: null, body: tail });
  }
  return sections;
};

// Title Case for headings, since the source writes them inconsistently
// ("Health benefit :" vs "Spiritual benefit:").
const tidyHeading = h =>
  h.charAt(0).toUpperCase() + h.slice(1).toLowerCase().replace(/\s+/g, " ");


// The one phrasing this appears in, on 40 of 83 products. Pulled out of the
// prose and shown as a badge -- it is the store's promise about the photo
// being the actual bead you receive, not part of the sentence that follows.
const WYSIWYG_PATTERN = /What you see is what you get\s*\(WYSIWYG\)/i;

const extractWysiwyg = body => {
  const match = body.match(WYSIWYG_PATTERN);
  if (!match) return { badge: null, rest: body };
  return {
    badge: match[0].replace(/\s+/g, " "),
    rest: body.replace(WYSIWYG_PATTERN, "").trim()
  };
};

// Health-benefit copy is written as a list, but punctuated two different ways:
// some entries use an om character as a bullet, the rest are comma-separated.
// Both are turned into real list items; nothing is dropped either way.
const OM_BULLET = /[\u0950\u1F549]|\uD83D\uDD49/;

const MAX_ITEM_LENGTH = 48;

// Splits a health-benefit body into { items, trailing }.
//
// The source punctuation is unreliable: the comma list frequently runs straight
// into the next sentence with no full stop ("...bone issues The one Mukhi
// Rudraksha is blessed by..."), so splitting on commas alone produced a bullet
// containing an entire paragraph. An item that is over-long or carries a
// sentence break is therefore cut at the point where a capitalised word follows
// a lower-case one -- the missing full stop -- and everything from there on is
// returned as prose instead of being forced into the list.
const toListItems = body => {
  if (OM_BULLET.test(body)) {
    const items = body
      .split(/\s*(?:\uD83D\uDD49\uFE0F?|\u0950)\s*/)
      .map(x => x.trim())
      .filter(Boolean);
    return { items, trailing: "" };
  }

  const parts = body.split(/\s*,\s*/).map(x => x.trim()).filter(Boolean);
  if (parts.length < 2) return { items: [], trailing: body };

  const items = [];
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const runsOn = part.length > MAX_ITEM_LENGTH || /[.!?]/.test(part);
    if (!runsOn) {
      items.push(part);
      continue;
    }
    // cut at the missing sentence break, keeping the short lead as the last item
    const cut = part.match(/^(.*?[a-z0-9])\s+([A-Z].*)$/s);
    const rest = parts.slice(i + 1).join(", ");
    if (cut && cut[1].length <= MAX_ITEM_LENGTH) {
      items.push(cut[1].trim());
      return { items, trailing: [cut[2].trim(), rest].filter(Boolean).join(", ") };
    }
    return { items, trailing: [part, rest].filter(Boolean).join(", ") };
  }
  return { items, trailing: "" };
};

const isListSection = heading =>
  !!heading && /health\s+benefit/i.test(heading);

// Same promise, same orange badge, for copy that arrives as markup. The phrase
// is wrapped where it stands, so it keeps its place in the authored text.
//
// Matching is done outside of tags: the HTML is split on tags and only the text
// between them is rewritten, so a phrase that happens to sit inside an
// attribute is left alone. A phrase broken across tags (e.g. half of it inside
// a <strong>) is not matched -- it is still shown, just without the badge.
const badgeWysiwygInHtml = html =>
  html
    .split(/(<[^>]*>)/)
    .map(chunk =>
      chunk.startsWith("<")
        ? chunk
        : chunk.replace(
            new RegExp(WYSIWYG_PATTERN.source, "gi"),
            match =>
              '<span class="product-description__wysiwyg-badge">' +
              match.replace(/\s+/g, " ") +
              "</span>"
          )
    )
    .join("");

const ProductDescription = ({ text }) => {
  if (!text || !text.trim()) return null;

  // Rich-text copy (the Highlight field, and any description authored in the
  // admin editor) is passed through rather than run through the plain-text
  // parser -- but the WYSIWYG promise still gets its orange badge, the same
  // one the parsed branch builds below.
  if (/<[a-z/][^>]*>/i.test(text)) {
    return (
      <div
        className="product-description product-description--html"
        dangerouslySetInnerHTML={{ __html: badgeWysiwygInHtml(text) }}
      />
    );
  }

  const normalised = text.replace(/\s+/g, " ").trim();
  const sections = splitIntoSections(normalised);

  return (
    <div className="product-description">
      {sections.map((section, i) => {
        const { badge, rest } = extractWysiwyg(section.body);
        return (
          <section className="product-description__section" key={i}>
            {badge && (
              <p className="product-description__wysiwyg">
                <span className="product-description__wysiwyg-badge">{badge}</span>
              </p>
            )}
            {section.heading && (
              <h2 className="product-description__heading">
                {tidyHeading(section.heading)}
              </h2>
            )}
            {isListSection(section.heading) ? (
              (() => {
                const { items, trailing } = toListItems(rest);
                return (
                  <>
                    {items.length > 0 && (
                      <ul className="product-description__list">
                        {items.map((item, j) => (
                          <li key={j}>{item}</li>
                        ))}
                      </ul>
                    )}
                    {trailing &&
                      toParagraphs(trailing).map((para, j) => (
                        <p className="product-description__body" key={j}>
                          {para}
                        </p>
                      ))}
                  </>
                );
              })()
            ) : (
              toParagraphs(rest).map((para, j) => (
                <p className="product-description__body" key={j}>
                  {para}
                </p>
              ))
            )}
          </section>
        );
      })}
    </div>
  );
};

ProductDescription.propTypes = {
  text: PropTypes.string
};

export default ProductDescription;
