<script lang="ts">
	import { mount } from 'svelte';
	import { user } from '$lib/auth/auth';
	import { pb } from '$lib/pocketbase';
	import { game, map } from '$lib/game/game';
	import type { RecordModel } from 'pocketbase';
	import PlaneOverlay from '$lib/game/guess/plane/PlaneOverlay.svelte';
	import { Progress } from '$lib/components/ui/progress';
	import { Loader } from '@googlemaps/js-api-loader';
	import { get } from 'svelte/store';
	import type { google } from 'google-maps';
	import { score,haversine } from '$lib/game/result/result';
	import * as AlertDialog from "$lib/components/ui/alert-dialog/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import ResetViewButton from '$lib/game/guess/plane/ResetViewButton.svelte';
	import ResetMapButton from '$lib/game/guess/plane/ResetMapButton.svelte';
  import {PUBLIC_MAPS_API_KEY} from '$env/static/public'
	import {PUBLIC_PB_URL} from '$env/static/public'

	//used to track round changes
	let round:number = get(game)!.round;
	let startDate:Date = $derived(new Date($game!.roundStart));
	let gmaps:google.maps.Map;
	let streetView:google.maps.StreetViewPanorama;

	//used to track selected and current overlay
	let currentPlaneOverlay:PlaneOverlay;
	let selectedPlaneOverlay:PlaneOverlay|undefined;

	//used to track duration of the round
	let progress = $state(100)
	let truthMarker:google.maps.marker.AdvancedMarkerElement;

	//used for rendering the result at the end of the round
	let uscore:number = $state(0)
	let distance:number = $state(0)
	let placeName:string = $state("")
	const loader = new Loader({
		apiKey: MAPS_API_KEY,
		version: "weekly",
		libraries: ["marker"]
	});
	let placeLine:google.maps.Polyline;

	async function loadPanoramas() {
		let panoramaMap = new Map<string, google.maps.StreetViewPanoramaData>();
		const world = await pb.collection('world').getOne($map!.world, {
			expand: 'panoramas',
			fields: 'expand'
		});
		const panoramas:RecordModel[] = world.expand?.panoramas;

		//---- retrieve info for all panoramas ------
		for (let i=0 ; i < panoramas.length; i++) {
			const panorama = panoramas[i];
			//get panorama link
			const panoramaExpanded = await pb.collection('panorama').getOne(panorama.id, {
				expand: 'link_via_from,link_via_to',
				fields: 'expand'
			})
			//also using backward links for the current panorama
			let fromPanoramaLinks = panoramaExpanded.expand?.link_via_from
			if(!fromPanoramaLinks) fromPanoramaLinks = []
			let toPanoramaLinks = panoramaExpanded.expand?.link_via_to
			if(!toPanoramaLinks) toPanoramaLinks = []
			//if this is a backward link, rotate the heading and trick the rest of the program into thinking this is a normal link
			toPanoramaLinks.forEach((value:RecordModel) => {
				value.heading = value.heading + 180
				value.to = value.from
			})
			const panoramaLinks = fromPanoramaLinks.concat(toPanoramaLinks)
			//create google panorama links
			let links:google.maps.StreetViewLink[] = panoramaLinks.map((link:RecordModel) => {
				return {
					description: null,
					heading: link.heading,
					pano: link.to
				}
			});

			//set google panorama value
			panoramaMap.set(panorama.id, {
				location: {
					pano: panorama.id,
					latLng: new google.maps.LatLng(panorama.latitude,panorama.longitude)
				},
				links: links,
				tiles: {
					tileSize: new google.maps.Size(2, 1),
					worldSize: new google.maps.Size(2, 1),
					centerHeading: panorama.centerHeading,
					getTileUrl: () => {
						return PUBLIC_PB_URL+'/api/files/panorama/'+panorama.id+'/'+panorama.image
					}
				},
			})
		}
		return panoramaMap
	}

	async function loadOverlays(gmaps:google.maps.Map, marker:google.maps.marker.AdvancedMarkerElement) {
		const planeIds = (await pb.collection('world').getOne($map!.world)).planes
		const planes:RecordModel[] = [];
		for (const value of planeIds) {
			planes.push(await pb.collection('plane').getOne(value))
		}
		planes.sort((a,b) => {
			return b.height - a.height
		})
		//create an overlay for each plane
		const overlays:PlaneOverlay[] = [];
		for(let i=0 ; i < planes.length; i++) {
			const container = document.createElement("div");
			gmaps.controls[google.maps.ControlPosition.RIGHT_CENTER].push(container)
			const overlay = mount(PlaneOverlay,{
				target: container,
				props: {
					name: (planes.length-i-1).toString(),
					model: planes[i],
					map: gmaps,
					defaultOverlay: i==planes.length-1,
					selectOverlay: () => {
						currentPlaneOverlay.hide();
						overlay.show();
						currentPlaneOverlay = overlay;
						if(currentPlaneOverlay == selectedPlaneOverlay) {
							marker.map = gmaps
						} else {
							marker.map = null;
						}
					},
				},
			})
			overlays.push(overlay)
			if(i==planes.length-1) {
				currentPlaneOverlay = overlay;
			}
		}
		return overlays
	}

	async function updateUsers() {
		const place = await pb.collection('panorama').getOne($map!.places[$game!.round], {
			fields: 'latitude,longitude,height'
		});
		const users = await pb.collection('user').getFullList({ filter: `game="${$game!.id}"`})

		for (const user of users) {
			await pb.collection('user').update(user.id,
				{guessed:false, score: user.score + score(user.selectedLatitude, user.selectedLongitude, place.latitude, place.longitude, user.guessed)})
		}
	}

	function startTimer(gmaps:google.maps.Map) {
		const timer = setInterval(
			async () => {
				let remainingTime = $map!.durationSecondes * 1000 - (Date.now() - startDate.getTime());
				progress = Math.max(0, (remainingTime / ($map!.durationSecondes * 1000)) * 100)

				if (progress==0) {
					clearInterval(timer)
					const place = await pb.collection('panorama').getOne($map!.places[$game!.round], {
						fields: 'latitude,longitude,height,name'
					});

					if($user!.guessed) {
						placeLine.setMap(gmaps);
						placeLine.setPath([
							new google.maps.LatLng($user?.selectedLatitude, $user?.selectedLongitude),
							new google.maps.LatLng(place.latitude, place.longitude)
						])
					}

					uscore = score($user!.selectedLatitude, $user!.selectedLongitude, place.latitude, place.longitude, $user!.guessed)
					distance = haversine($user!.selectedLatitude, $user!.selectedLongitude,place.latitude, place.longitude)
					distance = Math.round(distance * 10) / 10

					truthMarker.map = gmaps
					truthMarker.position = new google.maps.LatLng(place.latitude, place.longitude)

					placeName = place.name
					gmaps.setCenter({ lat: place.latitude, lng: place.longitude })
					gmaps.setZoom(17)
				}},
			250);
	}

	loader.importLibrary('maps').then(async ({ Map }) => {
		gmaps = new Map(document.getElementById("google-maps") as HTMLElement,
			{
				draggableCursor: 'crosshair',
				mapId: "d75ec101aa1be1aa",
				center: { lat: 48.71234764550873, lng: 2.2007204982759454 },
				zoom: 15,
				disableDefaultUI: true,
				zoomControl: true,
				maxZoom: 19,
				clickableIcons: false
			})

		let marker: google.maps.marker.AdvancedMarkerElement = new google.maps.marker.AdvancedMarkerElement({
			position: new google.maps.LatLng($user!.selectedLatitude, $user!.selectedLongitude),
			content: new google.maps.marker.PinElement({
				background: '#FBBC04',
				scale: 0.85,
			}).element
		})

		gmaps.addListener("click", ({ latLng }) => {
			if (progress <= 0) {
				return
			}
			if (typeof selectedPlaneOverlay != 'undefined') {
				selectedPlaneOverlay.deselect();
			}
			currentPlaneOverlay.select();
			selectedPlaneOverlay = currentPlaneOverlay;
			marker.map = gmaps;
			marker.position = new google.maps.LatLng(latLng.lat(), latLng.lng())
			pb.collection('user').update($user!.id,
				{
					selectedLatitude: latLng.lat(),
					selectedLongitude: latLng.lng(),
					selectedHeight: selectedPlaneOverlay.getModel().height,
					guessed: true,
				})
		})

		let panoramaMap = await loadPanoramas()

		streetView = new google.maps.StreetViewPanorama(
			document.getElementById("street-view") as HTMLElement,
			{ pano: $map!.places[round], visible: true, disableDefaultUI: true, linksControl: true }
		);

		//---- register pano provider ------
		streetView.registerPanoProvider((panoramaId: string) => {
			return panoramaMap.get(panoramaId)
		});

		const overlays = await loadOverlays(gmaps, marker)

		game.subscribe(async (ugame) => {
			if(ugame==null) return;
			if(ugame.round == round) return
			//on round change
			round = ugame.round
			streetView.setPano($map!.places[round])
			gmaps.setZoom(15)
			gmaps.setCenter({ lat: 48.71234764550873, lng: 2.2007204982759454 })
			marker.map = null
			selectedPlaneOverlay?.deselect()
			selectedPlaneOverlay = undefined
			truthMarker.map = null
			placeLine.setMap(null)
			progress = 100
			startTimer(gmaps)
		})

		//if the selected location is a valid one, it means that the user has already selected a location during this round
		if(Math.abs($user!.selectedLatitude) <= 90 && Math.abs($user!.selectedLongitude) <= 180) {
			const overlay = overlays.filter((overlay) => {
				return overlay.getModel().height == $user!.selectedHeight
			})[0]
			selectedPlaneOverlay = overlay
			selectedPlaneOverlay.select()
			if(overlay==currentPlaneOverlay) {
				marker.map = gmaps
			}
		}

		truthMarker = new google.maps.marker.AdvancedMarkerElement({
			map: null,
			content: new google.maps.marker.PinElement({
				background: '#7cff07',
				scale: 0.85,
			}).element})

		placeLine = new google.maps.Polyline({
			strokeColor: "#f85a5a",
			strokeOpacity: 1.0,
			strokeWeight: 5,
			geodesic: true,
		});

		let container = document.createElement("div");
		gmaps.controls[google.maps.ControlPosition.RIGHT_CENTER].push(container)
		mount(ResetMapButton,{
			target: container,
			props: {
				gmaps,
				center: new google.maps.LatLng(48.71234764550873, 2.2007204982759454),
				zoom: 17
			},
		})

		container = document.createElement("div");
		gmaps.controls[google.maps.ControlPosition.RIGHT_CENTER].push(container)
		mount(ResetViewButton,{
			target: container,
			props: {
				streetView,
				origin: $map!.places[round]
			},
		})
		startTimer(gmaps)
	});

</script>

{#if progress > 0}
	<Progress value={progress} max={100} class="right-[20%] mt-[2%] w-[60%] top-0 absolute z-10"/>
{:else}
	<AlertDialog.Root open={true}>
		<AlertDialog.Trigger class="absolute z-10 left-[50%] translate-x-[-50%] top-0">
			<Button variant="outline">Voir les résultats</Button>
		</AlertDialog.Trigger>
		<AlertDialog.Content>
			<AlertDialog.Header>
				<AlertDialog.Title>Il fallait trouver :</AlertDialog.Title>
				<AlertDialog.Description>
					{placeName}
				</AlertDialog.Description>
				<AlertDialog.Title>Distance :</AlertDialog.Title>
				<AlertDialog.Description>
					{#if $user?.guessed}
						{distance}m
					{:else}
						Vous n'avez pas répondu
					{/if}
				</AlertDialog.Description>
				<AlertDialog.Title>Score :</AlertDialog.Title>
				<AlertDialog.Description>
					Ce round: {uscore} / 5000 pts
				</AlertDialog.Description>
				<AlertDialog.Description>
					Total: {$user?.score + uscore}pts
				</AlertDialog.Description>
			</AlertDialog.Header>
			<AlertDialog.Footer>
				<AlertDialog.Cancel>Voir la carte</AlertDialog.Cancel>
				{#if $user?.isAdmin}
					<AlertDialog.Action onclick={async () => {
									await updateUsers()
									await pb.collection('game').update($game? $game?.id : '', {round: $game?.round + 1, roundStart: (new Date()).toJSON()})
					}}>Round suivant</AlertDialog.Action>
				{/if}
			</AlertDialog.Footer>
		</AlertDialog.Content>
	</AlertDialog.Root>
{/if}
<div id="street-view" class="w-full h-full"></div>
<div id="google-maps" class={"absolute bottom-[5%] right-[2%] transition-all z-10 rounded-lg border-black border-4 w-[25%] " + /*(progress > 0?*/"h-[40%] hover:w-[50%] hover:h-[70%] opacity-40 hover:opacity-100" /*: "w-[95%] h-[90%]")*/}></div>

