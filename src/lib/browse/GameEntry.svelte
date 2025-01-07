<script lang="ts">
	import Earth from "lucide-svelte/icons/earth";
	import * as Card from "$lib/components/ui/card";
	import Check from "lucide-svelte/icons/check";
	import { Button } from "$lib/components/ui/button/index.js";
	import { user } from '$lib/auth/auth';
	import { pb } from '$lib/pocketbase';

	let {id, name, mapName, visible, running} = $props();

</script>

<Card.Root class="w-[380px]">
	<Card.Header>
		<Card.Title>Teleguessr</Card.Title>
	</Card.Header>
	<Card.Content class="grid gap-4">
		<div class=" flex items-center space-x-4 rounded-md border p-4">
			<Earth />
			<div class="flex-1 space-y-1">
				<p class="text-sm font-medium leading-none">{name}</p>
				<p class="text-muted-foreground text-sm">
					{mapName}
				</p>
			</div>
		</div>
		{#if $user?.isAdmin}
			<div class="mb-4 grid grid-cols-[25px_1fr] items-start pb-4 last:mb-0 last:pb-0">
				<span class="flex h-2 w-2 translate-y-1 rounded-full bg-sky-500"></span>
				<div class="space-y-1">
					Visible:
					<span class="text-muted-foreground text-sm font-medium leading-none">
						{visible}
					</span>
					<p></p>
					Running:
					<span class="text-muted-foreground font-medium leading-none text-sm">
						{running}
					</span>
				</div>
			</div>
		{/if}
	</Card.Content>
	<Card.Footer>
		<Button onclick={() => {
			pb.collection('user').update($user? $user.id : '', {game: id})
		}} class="w-full">
			<Check class="mr-2 h-4 w-4" /> Rejoindre
		</Button>
	</Card.Footer>
</Card.Root>