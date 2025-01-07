<script lang="ts">
	import { user } from "$lib/auth/auth";
	import { pb } from "$lib/pocketbase";
	import { onDestroy, onMount } from 'svelte';
	import GameEntry from '$lib/browse/GameEntry.svelte';
	import type { RecordModel } from 'pocketbase';

	async function getGames() {
		let filter = $user?.isAdmin ? "" : "visible=true && inProgress=false";
		return await pb.collection('game').getFullList({
			filter: filter,
			expand: 'map',
			fields: 'expand, id, name, inProgress, visible'
		});
	}
	let games:RecordModel[] = [];
	let unsubscribeGames: () => void;
	onMount(async () => {
		games = await getGames();
		unsubscribeGames = await pb.collection('game').subscribe('*', async () => {
			games = await getGames();
		})
	})
	onDestroy(() => {
		if(typeof unsubscribeGames === 'function')
			unsubscribeGames();
	})
</script>

{#each games as game}
	<GameEntry id={game.id} name={game.name} mapName={game.expand?.map.name} visible={game.visible} running={game.inProgress} />
{/each}