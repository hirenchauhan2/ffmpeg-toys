<header>
	<h1>FFmpeg Toys</h1>

	<nav>
		<a href="/transcode">Transcode video</a>
		<a href="/add-audio">Add audio to a video</a>
		<a href="/extract-audio">Extract audio from video</a>
		<a href="/merge-videos">Merge videos</a>
		<a href="/slideshow">Create slideshow</a>
	</nav>
</header>

<slot />

<style>
	:global(body) {
		margin: 0;
		padding: 0;
	}

	header {
		display: flex;
		background-color: darkslategray;
		color: aliceblue;
		padding: 0 10px;
	}

	nav {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 1rem;
		margin-left: auto;
	}

	a,
	a:visited {
		text-decoration: none;
		color: aliceblue;
	}
</style>
