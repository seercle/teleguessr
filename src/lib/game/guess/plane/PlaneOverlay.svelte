<script lang="ts">
	import { onMount } from 'svelte';
	import type { RecordModel } from 'pocketbase'
	import type { google } from 'google-maps';
	import { Button } from "$lib/components/ui/button";
	import ChevronRight from "lucide-svelte/icons/chevron-right";
	import {PUBLIC_PB_URL} from '$env/static/public'

	class Overlay extends google.maps.OverlayView {
		public plane:RecordModel;
		private div?: HTMLElement;
		//private p:Plane;

		constructor(plane:RecordModel) {
			super();
			this.plane = plane;
			this.hide();
		}
		onAdd() {

			this.div = document.createElement("div");
			this.div.style.borderStyle = "none";
			this.div.style.borderWidth = "0px";
			this.div.style.position = "absolute";
			const img = document.createElement("img");
			img.src = PUBLIC_PB_URL+"/api/files/plane/"+this.plane.id+"/"+this.plane.image
			img.style.width = "100%";
			img.style.height = "100%";
			img.style.position = "absolute";
			this.div.appendChild(img);

			const panes = this.getPanes()!;
			panes.overlayLayer.appendChild(this.div);

			/*this.p = mount(Plane, {
				target: panes.overlayLayer,
				props: {
					src: "http://127.0.0.1:8090/api/files/plane/"+this.plane.id+"/"+this.plane.image,
					clazz: "w-full h-full absolute",
					alt: this.plane.image,
					hidden: false,
				},

			})*/
			if(defaultOverlay) {
				show();
			} else {
				hide();
			}
		}
		draw() {
			const overlayProjection = this.getProjection();
			const sw = overlayProjection.fromLatLngToDivPixel(
				new google.maps.LatLng(this.plane.minLatitude,this.plane.minLongitude)
			)!;
			const nw = overlayProjection.fromLatLngToDivPixel(
				new google.maps.LatLng(this.plane.minLatitude + this.plane.deltaLatitude, this.plane.minLongitude)
			)!;
			const se = overlayProjection.fromLatLngToDivPixel(
				new google.maps.LatLng(this.plane.minLatitude, this.plane.minLongitude + this.plane.deltaLongitude)
			)!;
			if (this.div) {
				this.div.style.left = sw.x + "px";
				this.div.style.top = nw.y + "px";
				this.div.style.width = se.x - sw.x + "px";
				this.div.style.height = sw.y - nw.y + "px";
				this.div.style.transform = 'rotate('+this.plane.rotateDeg+'deg)'
				this.div.style.transformOrigin = 'bottom left'
			}
		}
		onRemove() {
			if (this.div) {
				(this.div.parentNode as HTMLElement).removeChild(this.div);
				delete this.div;
			}
		}
		hide() {
			if (this.div) {
				this.div.style.visibility = "hidden";
			}
			//if(this.p)this.p.hide()

		}
		show() {
			if (this.div) {
				this.div.style.visibility = "visible";
			}
			//if(this.p)this.p.show()
		}
	}

	let {name, map, model, defaultOverlay, selectOverlay} : {name:string, map:google.maps.Map, model:RecordModel, defaultOverlay:boolean, selectOverlay:()=>void} = $props();
	export function getModel() {
		return model
	}

	let overlay : Overlay;
	let shown:boolean = $state(false)
	let selected:boolean = $state(false);

	onMount(() => {
		overlay = new Overlay(model)
		overlay.setMap(map)
	})
	export function hide() {
		overlay.hide();
		shown = false;
	}
	export function show() {
		overlay.show();
		shown = true;
	}

	export function select() {
		selected = true
	}
	export function deselect() {
		selected = false
	}
</script>

<Button variant="outline" size="icon" class={"w-16 h-16 mx-2 my-[2px] text-lg " + (shown? 'bg-orange-500 hover:bg-orange-500':'bg-white hover:bg-white')} onclick={()=>selectOverlay()}>
	{#if selected}
		<ChevronRight/>
	{/if}
	{name}
</Button>
