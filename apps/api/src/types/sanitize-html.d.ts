declare module 'sanitize-html' {
  interface IOptions {
    allowedTags?: string[];
    allowedAttributes?: Record<string, string[]>;
    allowedSchemes?: string[];
    allowedSchemesByTag?: Record<string, string[]>;
    allowedSchemesAppliedToAttributes?: string[];
    allowProtocolRelative?: boolean;
    enforceHtmlBoundary?: boolean;
    allowedStyles?: Record<string, Record<string, RegExp[]>>;
    allowedClasses?: Record<string, string[]>;
    allowedIframeHostnames?: string[];
    allowedIframeDomains?: string[];
    allowedScriptDomains?: string[];
    allowedScriptHostnames?: string[];
    disallowedTagsMode?: 'discard' | 'escape' | 'recursiveEscape';
    allowedNamespaces?: string[];
    textFilter?: (text: string) => string;
    transformTags?: Record<string, string | ((tagName: string, attribs: Record<string, string>) => { tagName: string; attribs: Record<string, string> })>;
    exclusiveFilter?: (frame: any) => boolean;
    nestingLimit?: number;
    parseStyleAttributes?: boolean;
    allowVulnerableTags?: boolean;
  }

  function sanitizeHtml(dirty: string, options?: IOptions): string;
  export = sanitizeHtml;
}
