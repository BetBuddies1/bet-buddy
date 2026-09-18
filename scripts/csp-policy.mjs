import { JSDOM } from 'jsdom';

// Exact production policy: new directives or sources require an explicit review.
const expectedDirectives = new Map([
  ['default-src', "'none'"],
  ['script-src', "'self'"],
  ['style-src', "'self'"],
  ['img-src', "'self'"],
  ['media-src', "'self'"],
  ['font-src', "'self'"],
  ['manifest-src', "'self'"],
  ['worker-src', "'self'"],
  ['connect-src', "'self'"],
  ['object-src', "'none'"],
  ['base-uri', "'self'"],
  ['form-action', "'none'"],
]);

export function validateCsp(html) {
  // Parse without executing scripts or loading resources. Comments and template
  // contents cannot masquerade as an active policy.
  const dom = new JSDOM(html);
  try {
    const { document, Node } = dom.window;
    const policies = [...document.querySelectorAll('meta[http-equiv]')].filter(
      (meta) => meta.getAttribute('http-equiv').toLowerCase() === 'content-security-policy',
    );
    if (policies.length !== 1 || policies[0].parentElement !== document.head) {
      throw new Error('Expected exactly one CSP meta element in the document head.');
    }

    const policy = policies[0];
    for (const resource of document.querySelectorAll('script, style, link')) {
      if (resource.compareDocumentPosition(policy) & Node.DOCUMENT_POSITION_FOLLOWING) {
        throw new Error('CSP must precede scripts, styles and linked resources.');
      }
    }

    const actualDirectives = new Map();
    for (const directive of (policy.getAttribute('content') ?? '').split(';')) {
      const tokens = directive.trim().split(/\s+/);
      if (!tokens[0]) continue;
      const name = tokens.shift().toLowerCase();
      if (actualDirectives.has(name)) {
        throw new Error(`Duplicate directive: ${name}`);
      }
      actualDirectives.set(name, tokens);
      if (!expectedDirectives.has(name)) {
        throw new Error(`Unexpected directive: ${name}`);
      }
    }

    for (const [name, source] of expectedDirectives) {
      const tokens = actualDirectives.get(name);
      if (!tokens || tokens.length !== 1 || tokens[0] !== source) {
        throw new Error(`Expected exactly ${name} ${source}`);
      }
    }
  } finally {
    dom.window.close();
  }
}
