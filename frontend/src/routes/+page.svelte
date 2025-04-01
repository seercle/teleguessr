<script lang="ts">
	import Auth from '$lib/auth/Auth.svelte';
	import { user } from '$lib/auth/auth';
	import { game } from '$lib/game/game';
	import Lobby from '$lib/lobby/Lobby.svelte';
	import Browse from '$lib/browse/Browse.svelte';
	import Game from '$lib/game/Game.svelte';
</script>

{#if !$user}
	<Auth/>
{:else if $game}
	{#if $game.inProgress}
		<Game/>
	{:else}
		<Lobby/>
	{/if}
{:else}
	<Browse/>
{/if}