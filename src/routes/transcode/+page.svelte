<script lang="ts">
	import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';
	import { getMimeType } from '$lib/utils/mime-types';

	const ffmpeg = createFFmpeg({ log: true });

	let selectedExtension = 'mp4';
	let selectedFile: File | null = null;
	let selectedVideoWidth = '1280';

	let showVideo = false;
	let clip = '';
	let isProcessing = false;
	let isDownloadReady = false;
	let currentBlob = '';
	let outputName = '';
	let isError = false;
	let processingError = '';

	function handleFileUpload(
		e: Event & {
			currentTarget: EventTarget & HTMLInputElement;
		}
	) {
		if (e.currentTarget.files && e.currentTarget.files.length) {
			selectedFile = e.currentTarget.files[0];
			isDownloadReady = false;
			outputName = '';
		}
	}

	async function transcodeAndPlay() {
		if (!selectedFile) {
			return;
		}
		try {
			isProcessing = true;

			if (!ffmpeg.isLoaded()) {
				await ffmpeg.load();
			}

			const { name } = selectedFile;

			// remove original extension and add selected extension to it
			outputName = `${name.replace(/\.[^/.]+$/, '')}.${selectedExtension}`;

			ffmpeg.FS('writeFile', name, await fetchFile(selectedFile));

			let args: string[] = [];

			if (selectedExtension === 'mp4') {
				args = [
					'-i',
					name,
					'-vcodec',
					'libx264',
					'-acodec',
					'libfdk_aac',
					'-ac',
					'2',
					'-ar',
					'48000',
					'-b:a',
					'96k',
					'-vf',
					`scale=${selectedVideoWidth}:-1`,
					'-map',
					'0',
					outputName
				];
			}

			if (selectedExtension === 'webm') {
				// -c:v libvpx -qmin 0 -qmax 50 -crf 10 -b:v 2M  -c:a libvorbis -q:a 4 output.webm
				args = [
					'-i',
					name,
					'-c:v',
					'libvpx',
					'-c:a',
					'libvorbis',
					'-ac',
					'2',
					'-b:a',
					'96k',
					'-ar',
					'44100',
					'-vf',
					`scale=${selectedVideoWidth}:-2`,
					'-map',
					'0',
					'-qmin',
					'0',
					'-qmax',
					'50',
					'-crf',
					'10',
					'-b:v',
					'2M',
					'-q:a',
					'6',
					outputName
				];
			}

			await ffmpeg.run(...args);

			console.log('done with transcoding, reading the generated content');
			const data = ffmpeg.FS('readFile', outputName);
			console.log('done with reading content');
			isProcessing = false;
			isDownloadReady = true;
			showVideo = true;
			clip = URL.createObjectURL(new Blob([data.buffer], { type: getMimeType(selectedExtension) }));
			currentBlob = clip;
		} catch (error) {
			console.log('🚀 ~ file: +page.svelte:48 ~ transcodeAndPlay ~ error:', error);
			isProcessing = false;
			isError = true;
			isDownloadReady = false;
			if (error instanceof Error) {
				processingError = error.message;
			}
		}
	}

	function downloadResult() {
		if (currentBlob.length) {
			const a = document.createElement('a');
			a.href = currentBlob;
			a.download = outputName;
			a.click();
		}
	}
</script>

<svelte:head>
	<title>Transcode videos</title>
</svelte:head>

<h1>Transcode Videos</h1>

<section>
	<div>
		<label for="inputfile">Select a video file</label>
		<input type="file" id="inputfile" accept=".mp4,.avi" on:change={handleFileUpload} />
	</div>
	<div>
		<label for="extension">Extension</label>
		<select name="extension" id="extension" bind:value={selectedExtension}>
			<option value="mp4">MP4</option>
			<option value="webm">Webm</option>
		</select>
	</div>
	<div>
		<label for="width">Video width</label>
		<select name="width" id="width" bind:value={selectedVideoWidth}>
			<option value="1280">1280px</option>
			<option value="1920">1920px</option>
			<option value="2560">2560px</option>
		</select>
	</div>
	<button type="button" on:click={transcodeAndPlay}>Convert to {selectedExtension} and Play</button>
</section>

{#if isDownloadReady}
	<button on:click={downloadResult}>Download the result</button>
{/if}

<center>
	{#if isProcessing}
		Video processing in progress...
	{/if}

	{#if isError}
		{processingError || 'Something went wrong!'}
	{/if}
</center>

{#if showVideo}
	<!-- svelte-ignore a11y-media-has-caption -->
	<video src={clip} controls width="642" height="361" />
{/if}
