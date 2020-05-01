<script>
  import Window from './Components/Window.svelte';
  import Header from './Components/Header.svelte';
  import Body from './Components/Body.svelte';
  import Footer from './Components/Footer.svelte';
  import CircleSpinner from './Components/CirlceSpinner.svelte';
  import Camera from './Components/Icons/Camera.svelte';

  import { onMount } from 'svelte';

  import {
    CurrentPrinterProfile,
    VersionInformation,
    WebCamUrl,
    ConnectionSettings,
    CurrentJob,
  } from './stores/octoprint';

  import { Active } from './stores/view';

  let timeRemaining = '';
  let timeElapsed = '';

  function formatTime(t, withSeconds = false) {
    const seconds = Math.floor((t % 60) % 60);
    const minutes = Math.floor((t / 60) % 60);
    const hours = Math.floor(t / 60 / 60);

    if (withSeconds) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else {
      return `${hours}h ${minutes}m`;
    }
  }

  $: {
    if ($CurrentJob.ready) {
      timeElapsed = formatTime($CurrentJob.data.progress.printTime);
    }
  }

  $: {
    if ($CurrentJob.ready) {
      timeRemaining = formatTime($CurrentJob.data.progress.printTimeLeft);
    }
  }

  $: {
    console.log($Active);
  }
</script>

<style>
  .camera {
    width: 32rem;
    height: 100%;
    background: var(--dashboard-camera-background);
    overflow: hidden;
    position: relative;
  }

  .camera .stream {
    width: 100%;
    height: 100%;
    background-size: cover;
    position: absolute;
    top: 0;
    left: 0;
  }

  .camera .stream:not(.active) {
    visibility: hidden;
  }

  .camera :global(.icon) {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }

  .side-by-side {
    display: flex;
    flex-direction: row;
    justify-content: left;
    align-items: center;
    height: 100%;
  }

  .side-by-side .left {
    flex-shrink: 1;
    height: 100%;
  }

  .side-by-side .right {
    height: 100%;
    flex-grow: 1;
    padding: 2rem 2rem;
  }

  .printer-name {
    font-size: 2rem;
    color: var(--text-secondary-color);
    font-weight: bold;
    margin: 0 0 1.3rem 0;
  }

  .printer-state {
    font-size: 2.4rem;
    color: var(--text-primary-color);
    font-weight: bold;
  }

  .progress-percentage {
    width: 100%;
    text-align: right;
    font-size: 2rem;
  }

  .progress-bar {
    height: 20px;
    position: relative;
    background: var(--accent-background-color);
    border-radius: 5px;
    overflow: hidden;
  }

  .progress-bar > span {
    display: block;
    height: 100%;
    background-color: var(--accent-color);
    transition: width 0.4s ease-in-out;
  }

  .progress-time {
    width: 100%;
    font-size: 2rem;
    margin: 0 0 1.3rem 0;
  }

  .time-remaining {
    float: right;
  }

  .filename {
    width: 100%;
    font-size: 2rem;
    font-weight: bold;
    overflow: hidden;
  }
</style>

<Window>
  <div class="side-by-side">
    <div class="left">
      <div class="camera">
        <Camera />
        {#if $WebCamUrl.ready && $WebCamUrl.data !== ''}
        <!-- Hack to ensure that the mjpeg stream is canceled if not active. Otherwise the stream stays active even if it is not displayed.-->
          <img src={$Active ? $WebCamUrl.data : '#'} alt="Webcam" class="stream" class:active={$Active} />
        {/if}
      </div>
    </div>
    <div class="right">
      {#if $CurrentPrinterProfile.ready}
        <div class="printer-name">{$CurrentPrinterProfile.data.name} - {$CurrentPrinterProfile.data.model}</div>
      {/if}
      {#if $CurrentJob.ready}
        <div class="printer-state">{$CurrentJob.data.state}</div>
      {/if}
      {#if $CurrentJob.ready && $CurrentJob.data.state === 'Printing'}
        <div class="progress-percentage">{Math.round($CurrentJob.data.progress.completion)}%</div>
        <div class="progress-bar">
          <span style="width: {Math.round($CurrentJob.data.progress.completion)}%" />
        </div>
        <div class="progress-time">
          <span class="time-elapsed">{timeElapsed}</span>
          <span class="time-remaining">{timeRemaining}</span>
        </div>
        <marquee class="filename">{$CurrentJob.data.job.file.name}</marquee>
      {/if}
    </div>
  </div>
</Window>
