/**
 * FilePath - Value object for file paths
 */

import { ValueObject } from '../../infrastructure/mocks/c3-shared.js';

interface FilePathProps {
  path: string;
}

export class FilePath extends ValueObject<FilePathProps> {
  private constructor(props: FilePathProps) {
    super(props);
  }

  static create(path: string): FilePath {
    // Normalize path
    const normalized = path.replace(/\\/g, '/');
    return new FilePath({ path: normalized });
  }

  get value(): string {
    return this.props.path;
  }

  /**
   * Get file extension
   */
  getExtension(): string {
    const parts = this.props.path.split('.');
    return parts.length > 1 ? `.${parts.pop()}` : '';
  }

  /**
   * Get file name
   */
  getFileName(): string {
    return this.props.path.split('/').pop() || '';
  }

  /**
   * Get directory
   */
  getDirectory(): string {
    const parts = this.props.path.split('/');
    parts.pop();
    return parts.join('/');
  }

  /**
   * Check if absolute path
   */
  isAbsolute(): boolean {
    return this.props.path.startsWith('/') || this.props.path.match(/^[A-Za-z]:/) !== null;
  }

  /**
   * Join with another path segment
   */
  join(segment: string): FilePath {
    const joined = `${this.props.path}/${segment}`.replace(/\/+/g, '/');
    return FilePath.create(joined);
  }
}
