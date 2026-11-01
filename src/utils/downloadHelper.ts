import { Track } from '../types';

export function downloadTrack(track: Track): { success: boolean; message: string } {
  const streamUrl = track.streamUrl || track.previewUrl || '';
  const rawFilename = `${track.artist} - ${track.title}.mp3`;
  const safeFilename = rawFilename.replace(/[/\\?%*:|"<>]/g, '_').trim();

  const queryParams = new URLSearchParams({
    url: streamUrl,
    title: track.title || '',
    artist: track.artist || '',
    videoId: track.videoId || '',
    filename: safeFilename,
  });

  const downloadUrl = `/api/download?${queryParams.toString()}`;

  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = safeFilename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
  }, 1000);

  return { success: true, message: `Downloading "${track.title}" MP3 to your device...` };
}
