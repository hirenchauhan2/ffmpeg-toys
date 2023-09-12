<script lang="ts">
	import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';
	import { getMimeType } from '$lib/utils/mime-types';

	const ffmpeg = createFFmpeg({ log: true });

	let selectedVideoFile: File | null = null;
	let selectedBitrate = '320';
	let showAudio = false;
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
			selectedVideoFile = e.currentTarget.files[0];

			isDownloadReady = false;
			outputName = '';
		}
	}

	async function addAudioAndPlay() {
		if (!selectedVideoFile) {
			return;
		}
		try {
			isProcessing = true;

			if (!ffmpeg.isLoaded()) {
				await ffmpeg.load();
			}

			const videoFilename = selectedVideoFile.name;

			// append the audio to the video file name
			// outputName = `audio_${videoFilename}`;
			outputName = `${videoFilename.replace(/\.[^/.]+$/, '')}.mp3`;

			ffmpeg.FS('writeFile', videoFilename, await fetchFile(selectedVideoFile));
			// ffmpeg -i $INPUT -vn -ar 44100 -ac 2 -ab $BITRATE -f mp3 $OUTPUT.mp3
			let args: string[] = [
				'-i',
				videoFilename,
				'-vn',
				'-ar',
				'44100',
				'-ac',
				'2',
				'-ab',
				selectedBitrate,
				'-f',
				'mp3',
				outputName
			];

			await ffmpeg.run(...args);

			console.log('done with extracting audio, reading the generated content');
			const data = ffmpeg.FS('readFile', outputName);
			console.log('done with reading content');
			isProcessing = false;
			isDownloadReady = true;
			showAudio = true;
			clip = URL.createObjectURL(new Blob([data.buffer], { type: getMimeType('mp3') }));
			currentBlob = clip;
		} catch (error) {
			console.log('🚀 ~ file: +page.svelte:44 ~ addAudioAndPlay ~ error:', error);
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
	<title>Extract audio from a video</title>
</svelte:head>

<h1>Extract audio from a video</h1>

<section>
	<div>
		<label for="videoFile">Select a video file</label>
		<input type="file" id="videoFile" accept=".mp4,.avi" on:change={handleFileUpload} />
	</div>
	<div>
		<label for="width">Bit rate</label>
		<select name="width" id="width" bind:value={selectedBitrate}>
			<option value="96">96 Kbps</option>
			<option value="128">128 Kbps</option>
			<option value="128">128 Kbps</option>
			<option value="256">256 Kbps</option>
			<option value="320">320 Kbps</option>
		</select>
	</div>
	<button type="button" on:click={addAudioAndPlay}>Extract audio and play</button>

	{#if isDownloadReady}
		<button on:click={downloadResult}>Download the result</button>
	{/if}
</section>

<center>
	{#if isProcessing}
		Video processing in progress...
	{/if}

	{#if isError}
		{processingError || 'Something went wrong!'}
	{/if}
</center>

{#if showAudio}
	<!-- svelte-ignore a11y-media-has-caption -->
	<audio src={clip} controls />
{/if}
