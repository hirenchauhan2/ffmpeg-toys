<script lang="ts">
	import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';

	const ffmpeg = createFFmpeg({ log: true });

	let selectedVideoFile: File | null = null;
	let selectedAudioFile: File | null = null;

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
		},
		type: string
	) {
		if (e.currentTarget.files && e.currentTarget.files.length) {
			if (type === 'video') {
				selectedVideoFile = e.currentTarget.files[0];
			}
			if (type === 'audio') {
				selectedAudioFile = e.currentTarget.files[0];
			}
			isDownloadReady = false;
			outputName = '';
		}
	}

	async function addAudioAndPlay() {
		if (!selectedVideoFile || !selectedAudioFile) {
			return;
		}
		try {
			isProcessing = true;

			if (!ffmpeg.isLoaded()) {
				await ffmpeg.load();
			}

			const videoFilename = selectedVideoFile.name;
			const audioFilename = selectedAudioFile.name;

			// append the audio to the video file name
			outputName = `audio_${videoFilename}`;

			ffmpeg.FS('writeFile', videoFilename, await fetchFile(selectedVideoFile));
			ffmpeg.FS('writeFile', audioFilename, await fetchFile(selectedAudioFile));

			let args: string[] = [
				'-i',
				videoFilename,
				'-i',
				audioFilename,
				'-c:v',
				'copy',
				'-map',
				'0:v:0',
				'-map',
				'1:a:0',
				'-shortest',
				outputName
			];

			await ffmpeg.run(...args);

			console.log('done with transcoding, reading the generated content');
			const data = ffmpeg.FS('readFile', outputName);
			console.log('done with reading content');
			isProcessing = false;
			isDownloadReady = true;
			showVideo = true;
			clip = URL.createObjectURL(new Blob([data.buffer], { type: selectedVideoFile.type }));
			currentBlob = clip;
		} catch (error) {
			console.log('🚀 ~ file: +page.svelte:44 ~ addAudioAndPlay ~ error:', error);
			isProcessing = false;
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
	<title>Add audio to a video</title>
</svelte:head>

<h1>Add audio to the video</h1>

<section>
	<div>
		<label for="videoFile">Select a video file</label>
		<input
			type="file"
			id="videoFile"
			accept=".mp4,.avi"
			on:change={(e) => handleFileUpload(e, 'video')}
		/>
	</div>
	<div>
		<label for="audioFile">Select an audio file</label>
		<input
			type="file"
			id="audioFile"
			accept=".mp3"
			on:change={(e) => handleFileUpload(e, 'audio')}
		/>
	</div>
	<button type="button" on:click={addAudioAndPlay}>Add audio and play</button>

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

{#if showVideo}
	<!-- svelte-ignore a11y-media-has-caption -->
	<video src={clip} controls width="642" height="361" />
{/if}
