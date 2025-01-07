<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import type {google} from 'google-maps';
	import { Map } from 'lucide-svelte';
	let {gmaps, center, zoom} : {gmaps:google.maps.Map, center:google.maps.LatLng, zoom:number} = $props()
</script>

<Button variant="outline" size="icon" class={"w-16 h-16 mx-2 my-[2px] text-lg "} onclick={()=>{
	gmaps.setCenter(center)
	gmaps.setZoom(zoom)
}}>
	<Map/>
</Button>