<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import type { google } from 'google-maps';
	import { RotateCcw } from 'lucide-svelte';
	let {
		gmaps,
		center,
		zoom
	}: { gmaps: google.maps.Map; center: google.maps.LatLng; zoom: number } = $props();
</script>

<Button
	variant="outline"
	size="icon"
	class={'mx-2 my-[2px] h-16 w-16 text-lg '}
	onclick={() => {
		gmaps.setCenter(center);
		gmaps.setZoom(zoom);
	}}
>
	<RotateCcw />
</Button>
