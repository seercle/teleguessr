<script lang="ts">
	import { game, map } from '$lib/game/game';
	import Scoreboard from '$lib/game/scoreboard/Scoreboard.svelte';
	import Guess from '$lib/game/guess/Guess.svelte';
</script>

{#if $game?.round >= $map?.places.length}
	<Scoreboard round={$game?.round} />
{:else}
	<Guess />
{/if}
