export const normalizeFileName = (fileName: string): string => {
    // 1. Remove the first path segment (e.g., "/aufzugsperipherie")
    const parts = fileName.split('/');
    let normalized = parts.slice(1).join('/');
  
    // 2. Replace the remaining slashes with a space
    normalized = normalized.replace(/\//g, ' ');
  
    // 3. Convert to lowercase
    normalized = normalized.toLowerCase();
  
    // 4. PRE-CLEANUP: Insert a space before the file extension period.
    // This looks for a dot followed by 3-4 letters/digits at the end of the string.
    // The captured group ($1) puts the extension back with a space before it.
    normalized = normalized.replace(/(\.[a-z0-9]{3,4})$/g, ' $1');
  
    // 5. Final cleanup: Remove all characters that are NOT a lowercase letter, digit, space, or a period.
    // We keep the period here temporarily to ensure the extension is preserved.
    normalized = normalized.replace(/[^a-z0-9\. ]/g, '');
  
    // 6. Final step: Replace any space/dot/space pattern with just a space
    // and trim excess spaces. This handles the space inserted in step 4.
    // The regex /\s*\.\s*/g finds any combination of space-dot-space and replaces it with a single space.
    normalized = normalized.replace(/\s*\.\s*/g, ' ');
  
    // 7. Clean up multiple spaces and leading/trailing spaces
    normalized = normalized.replace(/ +/g, ' ').trim();
  
    return normalized;
  };
  
  export const normalizeText = (text: string): string => {
    return text.toLowerCase().replace(/[^a-z0-9]/g, "");
  }
  
  export const s3PathInfo = (path: string): {
    bucket: string,
    object: string,
    ext: string,
    generation?: string
  } | undefined => {
    // 1. ([^/]+)       -> Bucket (everything until first Slash)
    // 2. (.+)          -> Object name / path (greedy, until file extension dot)
    // 3. ([^./]+)      -> Extension (no dots, no slashes)
    // 4. (?:[\/](.+))? -> optional: Generation (recognizing starts with slash, but caught without the slash)
    const match = path.match(/^([^/]+)\/(.+)\.([^./]+)(?:\/(.+))?$/);
  
    if (!match) {
      console.error("Invalid ID format");
      return undefined;
    }
  
    const [, bucket, object, ext, generation] = match;
  
    if (!bucket || !object || !ext) {
      console.error("Missing S3 file id parts");
      return undefined;
    }
  
    return {
      bucket,
      object,
      ext,
      generation
    };
  }