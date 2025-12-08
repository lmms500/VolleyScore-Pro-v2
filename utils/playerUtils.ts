/**
 * Player Utilities - Batch Import & Parsing
 * Handles CSV/newline-delimited player lists with deduplication and validation
 */

/**
 * parsePlayerCSV: Parse a string of player names into a deduplicated array
 * Supports multiple delimiters: commas, newlines, pipes, semicolons
 * 
 * @param input - Raw input string (e.g., "João, Maria\nPedro;Ana")
 * @returns Array of cleaned, unique player names
 * 
 * @example
 * parsePlayerCSV("João, Maria\nPedro") 
 * // → ["João", "Maria", "Pedro"]
 * 
 * parsePlayerCSV("João,João,Maria")
 * // → ["João", "Maria"] (deduplicates)
 */
export const parsePlayerCSV = (input: string): string[] => {
  if (!input || typeof input !== 'string') return [];

  // Split by common delimiters: comma, newline, pipe, semicolon
  const delimiters = /[,\n|;]/;
  const rawNames = input.split(delimiters);

  // Clean each name: trim whitespace, filter empty
  const cleaned = rawNames
    .map(name => name.trim())
    .filter(name => name.length > 0);

  // Remove duplicates (case-insensitive)
  const uniqueNames = Array.from(
    new Map(
      cleaned.map(name => [name.toLowerCase(), name])
    ).values()
  );

  return uniqueNames;
};

/**
 * validatePlayerNames: Validate a list of player names
 * Returns validation errors if any constraints are violated
 * 
 * @param names - Array of player names
 * @param options - Validation options
 * @returns { valid: boolean, errors: string[], cleanedNames: string[] }
 */
export interface ValidatePlayerNamesOptions {
  maxNameLength?: number;
  maxPlayers?: number;
  allowSpecialChars?: boolean;
}

export const validatePlayerNames = (
  names: string[],
  options: ValidatePlayerNamesOptions = {}
): { valid: boolean; errors: string[]; cleanedNames: string[] } => {
  const {
    maxNameLength = 50,
    maxPlayers = 50,
    allowSpecialChars = true
  } = options;

  const errors: string[] = [];
  const cleaned = parsePlayerCSV(names.join(','));

  if (cleaned.length === 0) {
    errors.push('No valid player names provided');
  }

  if (cleaned.length > maxPlayers) {
    errors.push(`Too many players (max: ${maxPlayers}, got: ${cleaned.length})`);
  }

  cleaned.forEach((name, idx) => {
    if (name.length > maxNameLength) {
      errors.push(`Player ${idx + 1} name too long (max: ${maxNameLength} chars)`);
    }

    if (!allowSpecialChars && !/^[a-zA-Z0-9\s\-'áéíóúàâêôãõç]+$/i.test(name)) {
      errors.push(`Player "${name}" contains unsupported characters`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    cleanedNames: cleaned
  };
};

/**
 * formatPlayerListForDisplay: Format an array of names as a readable string
 * Useful for confirmation dialogs
 * 
 * @param names - Array of player names
 * @param maxDisplay - Max names to show before truncating
 * @returns Formatted string
 */
export const formatPlayerListForDisplay = (names: string[], maxDisplay: number = 5): string => {
  if (names.length === 0) return '(no players)';
  
  const displayed = names.slice(0, maxDisplay);
  const rest = names.length - maxDisplay;

  const formatted = displayed.join(', ');
  return rest > 0 ? `${formatted}, +${rest} more` : formatted;
};
