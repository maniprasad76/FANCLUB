import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';

/**
 * SanitizePipe — Global input sanitization for XSS prevention.
 *
 * Strips HTML tags and dangerous patterns from ALL incoming string fields.
 * Applied globally so every controller benefits without opt-in.
 *
 * This is a defense-in-depth measure — even if the frontend escapes output,
 * we never store raw HTML in the database.
 */
@Injectable()
export class SanitizePipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata): any {
    // Only sanitize body payloads (not params, query, or custom)
    if (metadata.type !== 'body') return value;

    return this.sanitize(value);
  }

  private sanitize(value: any): any {
    if (typeof value === 'string') {
      return this.stripHtml(value);
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.sanitize(item));
    }

    if (value !== null && typeof value === 'object') {
      const sanitized: Record<string, any> = {};
      for (const [key, val] of Object.entries(value)) {
        sanitized[key] = this.sanitize(val);
      }
      return sanitized;
    }

    return value;
  }

  /**
   * Strip HTML tags and dangerous patterns from a string.
   * Preserves normal text content, removes:
   *   - All HTML/XML tags (<script>, <img onerror=...>, etc.)
   *   - javascript: protocol URIs
   *   - on* event handlers in attributes
   */
  private stripHtml(input: string): string {
    return input
      .replace(/<[^>]*>/g, '') // Remove all HTML tags
      .replace(/javascript\s*:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '') // Remove inline event handlers
      .trim();
  }
}
