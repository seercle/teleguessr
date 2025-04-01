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

<Card.Root class="mx-auto max-w-sm mt-[25%]">
	<Card.Header>
		<Card.Title class="text-2xl">Authentification</Card.Title>
		<Card.Description>Veuillez vous connecter avec les identifiants qui vous ont été fournis</Card.Description>
	</Card.Header>
	<Card.Content>
		<div class="grid gap-4">
			<div class="grid gap-2">
				<Label for="username">Identifiant</Label>
				<Input id="username" type="text" bind:value={username} required />
			</div>
			<div class="grid gap-2">
				<div class="flex items-center">
					<Label for="password">Mot de passe</Label>
				</div>
				<Input id="password" bind:value={password} type="password" required />
			</div>
			<Button type="submit" class="w-full" onclick={async () => {
			await pb.collection('user').authWithPassword(username, password).catch(() => {
				failed = true;
		})}
		}>Connexion</Button>
		</div>
			{#if failed}
				<div class="mt-4 text-center text-sm text-red-400">
					Echec lors de la connexion, veuillez vérifier vos identifiants
				</div>
			{/if}
	</Card.Content>
</Card.Root>