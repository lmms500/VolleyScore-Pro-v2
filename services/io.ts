
/**
 * I/O Service
 * Handles file system interactions for importing and exporting application data.
 * Pure utility functions, no state or store dependencies.
 */

/**
 * Triggers a browser download of the provided data object as a JSON file.
 * Creates a temporary blob URL and simulates a click to trigger the download.
 *
 * @param filename - The name of the file to be downloaded (e.g., 'backup.json').
 * @param data - The JavaScript object or array to serialize and download.
 */
export const downloadJSON = (filename: string, data: any): void => {
  try {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    
    // Ensure extension exists
    link.download = filename.endsWith('.json') ? filename : `${filename}.json`;
    
    // Append to body is required for Firefox to trigger click properly
    document.body.appendChild(link);
    link.click();
    
    // Cleanup resources
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to download JSON:', error);
  }
};

/**
 * Reads a File object (from an input[type="file"]) and parses its content as JSON.
 * Wraps FileReader in a Promise for cleaner async/await usage.
 *
 * @param file - The File object provided by the DOM event.
 * @returns A Promise that resolves with the parsed JSON object or rejects with an error.
 */
export const parseJSONFile = (file: File): Promise<any> => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No file provided'));
      return;
    }

    // Optional Check: Warn if not JSON mime type (though some OSs/Browsers might fail this check correctly)
    if (file.type && file.type !== 'application/json' && !file.name.endsWith('.json')) {
      console.warn('File type warning: File does not appear to be JSON.', file.type);
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const result = event.target?.result;
        if (typeof result !== 'string') {
          throw new Error('File content is empty or invalid.');
        }
        
        const parsed = JSON.parse(result);
        resolve(parsed);
      } catch (error) {
        reject(new Error('Invalid JSON format. The file might be corrupted or not a valid JSON file.'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file from disk.'));
    };

    reader.readAsText(file);
  });
};
