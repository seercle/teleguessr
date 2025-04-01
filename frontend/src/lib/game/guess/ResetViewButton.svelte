<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import type { google } from 'google-maps';
	let {
		streetView,
		origin,
		class: className
	}: { streetView: google.maps.StreetViewPanorama; origin: string; class: string } = $props();
</script>

<Button
	variant="outline"
	class={className}
	onclick={() => {
		streetView.setPano(origin);
		streetView.setZoom(1);
		streetView.setPov({ heading: 0, pitch: 0 });
	}}
></Button>
