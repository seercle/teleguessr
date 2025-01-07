<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import { Label } from "$lib/components/ui/label";
	import * as Card from "$lib/components/ui/card";
	import { pb } from "$lib/pocketbase";

	let username:string;
	let password:string;
	let failed = false;
</script>

<Card.Root class="w-full">
	<Card.Header>
		<Card.Title>Authentification</Card.Title>
		<Card.Description>Veuillez vous connecter avec les identifiants qui vous ont été fournis</Card.Description>
	</Card.Header>
	<Card.Content>
		<form>
			<div class="grid w-full items-center gap-4">
				<div class="flex flex-col space-y-1.5">
					<Label for="name">Username</Label>
					<Input id="name" bind:value={username} placeholder="Votre identifiant" />
				</div>
				<div class="flex flex-col space-y-1.5">
					<Label for="name">Password</Label>
					<Input id="name" bind:value={password} placeholder="Votre mot de passe" />
				</div>
			</div>
		</form>
	</Card.Content>
	<Card.Footer class="flex flex-row">

		<Button onclick={async () => {
			await pb.collection('user').authWithPassword(username, password).catch(() => {
				failed = true;
		})}
		}>Connection</Button>

		{#if failed}
			<div class="text-red-700 h1 px-4">Echec lors de la connection</div>
		{/if}
	</Card.Footer>
</Card.Root>