<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import type {google} from 'google-maps';
	import { Flag } from 'lucide-svelte';
	let {streetView, origin} : {streetView:google.maps.StreetViewPanorama, origin:string} = $props()
</script>

<Button variant="outline" size="icon" class={"w-16 h-16 mx-2 my-[2px] text-lg "} onclick={()=>{
	streetView.setPano(origin)
	streetView.setZoom(0)
}}>
	<Flag/>
</Button>