<script lang="ts">
	import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';
	import { getMimeType } from '$lib/utils/mime-types';

	const ffmpeg = createFFmpeg({ log: true });

	let selectedVideoFiles: FileList | null = null;
	let withAudio = false;
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
			if (e.currentTarget.files.length < 2) {
				alert('Please select multiple files for this operation');
				return;
			}

			selectedVideoFiles = e.currentTarget.files;

			isDownloadReady = false;
			outputName = '';
		}
	}

	async function addVideoFilesToFS() {
		const fileNames: string[] = [];
		if (!selectedVideoFiles) {
			return fileNames;
		}

		const totalFiles = selectedVideoFiles.length;
		for (let i = 0; i < totalFiles; i++) {
			const file = selectedVideoFiles.item(i);
			if (file) {
				fileNames.push(file.name);
				ffmpeg.FS('writeFile', file.name, await fetchFile(file));
			}
		}

		return fileNames;
	}

	async function addAudioAndPlay() {
		if (!selectedVideoFiles || !selectedVideoFiles.length) {
			return;
		}

		if (selectedVideoFiles.length < 2) {
			throw new Error('Please select 2+ files to merge');
		}

		try {
			isProcessing = true;

			if (!ffmpeg.isLoaded()) {
				await ffmpeg.load();
			}

			const addedFiles = await addVideoFilesToFS();

			if (!addedFiles.length) {
				return;
			}

			outputName = `merged.mp4`;
			let args: string[];
			if (!withAudio) {
				// 	ffmpeg -i input1.mp4 -i input2.webm -i input3.mov \
				// -filter_complex "[0:v:0][0:a:0][1:v:0][1:a:0][2:v:0][2:a:0]concat=n=3:v=1:a=1[outv][outa]" \
				// -map "[outv]" -map "[outa]" output.mkv
				args = [
					...addedFiles.map((fileName) => ['-i', fileName]).flat(),
					'-filter_complex',
					`${addedFiles.map((_, i) => `[${i}:0]`).join('')}concat=n=${addedFiles.length}:v=1:a=0`, //[video][audio]
					// '-map',
					// `[video]`,
					// '-map',
					// '[audio]',
					'-framerate',
					'30',
					'-safe',
					'0',
					'-vsync',
					'2',
					'-report',
					outputName
				];
			} else {
				args = [
					...addedFiles.map((fileName) => ['-i', fileName]).flat(),
					'-filter_complex',
					`${addedFiles
						.map((_, i) => `[${i}:0]scale=640:352,setsar=1/1, setpts=PTS-STARTPTS[${i}:0]`)
						.join('')}concat=n=${addedFiles.length}:v=1:a=1[video][audio]`,
					'-map',
					`[video]`,
					'-map',
					'[audio]',
					'-framerate',
					'30',
					'-safe',
					'0',
					'-vsync',
					'2',
					outputName
				];
			}

			await ffmpeg.run(...args);

			console.log('done with merging videos, reading the generated content');
			const data = ffmpeg.FS('readFile', outputName);
			console.log('done with reading content');
			isProcessing = false;
			isDownloadReady = true;
			showVideo = true;
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
	<title>Merge videos</title>
</svelte:head>

<h1>Merge videos</h1>

<section>
	<div>
		<label for="videoFile">Select a video file</label>
		<input type="file" id="videoFile" multiple accept=".mp4,.avi" on:change={handleFileUpload} />
	</div>

	<div>
		<label for="withAudio">With audio?</label>
		<input type="checkbox" name="withAudio" id="withAudio" bind:checked={withAudio} />
	</div>

	<button type="button" on:click={addAudioAndPlay}>Merge and play</button>

	{#if isDownloadReady}
		<button on:click={downloadResult}>Download the result</button>
	{/if}
</section>

<center>
	{#if isProcessing}
		<span class="status">Video processing in progress...</span>
	{/if}

	{#if isError}
		<span class="status error">
			{processingError || 'Something went wrong!'}
		</span>
	{/if}
</center>

{#if showVideo}
	<!-- svelte-ignore a11y-media-has-caption -->
	<video src={clip} controls height="720" />
{/if}

<style>
	.status {
		font-size: 1.2rem;
		color: green;
	}

	.status.error {
		color: red;
	}
</style>
