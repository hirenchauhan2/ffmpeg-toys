export function getMimeType(ext:string) {
  if (!ext) {
    throw new Error('Provide an extension');
  }

  switch (ext) {
    case 'mp4':
      return 'video/mp4';
    case 'avi':
      return 'video/x-msvideo';
    case 'webm':
      return 'video/webm';
    case 'mp3':
      return 'audio/mpeg';
    default:
      return 'unknown';
  }
}
