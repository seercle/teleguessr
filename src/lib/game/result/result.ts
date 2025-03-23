import { map } from '$lib/game/game';
import type { RecordModel } from 'pocketbase';
import { get } from 'svelte/store';

export function haversine(
	lat1: number,
	lon1: number,
	height1: number,
	lat2: number,
	lon2: number,
	height2: number
): number {
	const R = 6378 * 1000; // Radius of the Earth in meters
	const rlat1 = lat1 * (Math.PI / 180); // Convert degrees to radians
	const rlat2 = lat2 * (Math.PI / 180); // Convert degrees to radians
	const difflat = rlat2 - rlat1; // Radian difference (latitudes)
	const difflon = (lon2 - lon1) * (Math.PI / 180); // Radian difference (longitudes)
	return (
		/*height2 -
		height1 +*/
		2 *
		R *
		Math.asin(
			Math.sqrt(
				Math.sin(difflat / 2) * Math.sin(difflat / 2) +
					Math.cos(rlat1) * Math.cos(rlat2) * Math.sin(difflon / 2) * Math.sin(difflon / 2)
			)
		)
	);
}

export function score(
	ulat: number,
	ulong: number,
	uheight: number,
	plat: number,
	plong: number,
	pheight: number,
	guessed: boolean
): number {
	if (!guessed) return 0;
	const distance = haversine(ulat, ulong, uheight, plat, plong, pheight);
	const distance_score = Math.max(
		0,
		((get(map)!.minDfistanceMeter - distance) / get(map)!.minDistanceMeter) * 5000
	);

	//if pheight is not defined, return distance_score without taking the height into account
	if (pheight < 0) {
		return Math.round(distance_score);
	}

	const height_distance = Math.abs(uheight - pheight);
	return Math.round(distance_score / (1 + height_distance / 2));
}

export function computeTotalScore(user: RecordModel): number {
	let sum = 0;
	for (const value of Object.values(user.score)) {
		sum += Number(value);
	}
	return sum;
}
