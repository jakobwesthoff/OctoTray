<style>
  .spinner {
    margin: auto;
    width: 4rem;
    height: 4rem;
    position: relative;
  }

  .cube1,
  .cube2 {
    background-color: var(--accent-color);
    width: 1.5rem;
    height: 1.5rem;
    position: absolute;
    top: 0;
    left: 0;

    -webkit-animation: sk-cubemove 1.8s infinite ease-in-out;
    animation: sk-cubemove 1.8s infinite ease-in-out;
  }

  .cube2 {
    -webkit-animation-delay: -0.9s;
    animation-delay: -0.9s;
  }

  @-webkit-keyframes sk-cubemove {
    25% {
      -webkit-transform: translateX(4.2rem) rotate(-90deg) scale(0.5);
    }
    50% {
      -webkit-transform: translateX(4.2rem) translateY(4.2rem) rotate(-180deg);
    }
    75% {
      -webkit-transform: translateX(0px) translateY(4.2rem) rotate(-270deg) scale(0.5);
    }
    100% {
      -webkit-transform: rotate(-360deg);
    }
  }

  @keyframes sk-cubemove {
    25% {
      transform: translateX(4.2rem) rotate(-90deg) scale(0.5);
      -webkit-transform: translateX(4.2rem) rotate(-90deg) scale(0.5);
    }
    50% {
      transform: translateX(4.2rem) translateY(4.2rem) rotate(-179deg);
      -webkit-transform: translateX(42px) translateY(4.2rem) rotate(-179deg);
    }
    50.1% {
      transform: translateX(4.2rem) translateY(4.2rem) rotate(-180deg);
      -webkit-transform: translateX(4.2rem) translateY(4.2rem) rotate(-180deg);
    }
    75% {
      transform: translateX(0rem) translateY(4.2rem) rotate(-270deg) scale(0.5);
      -webkit-transform: translateX(0rem) translateY(4.2rem) rotate(-270deg) scale(0.5);
    }
    100% {
      transform: rotate(-360deg);
      -webkit-transform: rotate(-360deg);
    }
  }
</style>

<!-- Spinner from Spinkit: https://tobiasahlin.com/spinkit/ -->

<div class="spinner">
  <div class="cube1" />
  <div class="cube2" />
</div>
