export function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer | null> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsArrayBuffer(file);
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result);
      }
    };
    reader.onerror = (error) => reject(error);
  });
}

export function readFileAsText(file: File): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      }
    };
    reader.onerror = (error) => reject(error);
  });
}
