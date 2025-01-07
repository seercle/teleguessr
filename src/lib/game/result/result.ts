import { map } from '$lib/game/game';
import { get } from 'svelte/store';

export function haversine(lat1:number, lon1:number, lat2:number, lon2:number):number {
	const R = 6378*1000; // Radius of the Earth in meters
	const rlat1 = lat1 * (Math.PI/180); // Convert degrees to radians
	const rlat2 = lat2 * (Math.PI/180); // Convert degrees to radians
	const difflat = rlat2-rlat1; // Radian difference (latitudes)
	const difflon = (lon2-lon1) * (Math.PI/180); // Radian difference (longitudes)
	return 2 * R * Math.asin(Math.sqrt(Math.sin(difflat/2)*Math.sin(difflat/2)+Math.cos(rlat1)*Math.cos(rlat2)*Math.sin(difflon/2)*Math.sin(difflon/2)));
}

export function score(ulat:number, ulong:number, plat:number, plong:number, guessed:boolean): number{
	if(!guessed) return 0
	const distance = haversine(ulat, ulong, plat, plong)
	return Math.max(0, Math.round(((get(map)!.minDistanceMeter - distance) / get(map)!.minDistanceMeter) * 5000))
}