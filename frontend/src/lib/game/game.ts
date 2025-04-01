import { writable, type Writable } from 'svelte/store';
import type { RecordModel } from 'pocketbase';
import { pb } from '$lib/pocketbase';
import { user } from '$lib/auth/auth';
import { get } from 'svelte/store';
import { score } from './result/result';
export const game: Writable<RecordModel | undefined> = writable();
export const map: Writable<RecordModel | undefined> = writable();

let unsubscribeGame: () => void;

export async function subscribeGame(id: string) {
	//unsubscribe from the previous game
	if (typeof unsubscribeGame == 'function') {
		unsubscribeGame();
	}
	//subscribe to the new game
	unsubscribeGame = await pb.collection('game').subscribe(
		id,
		(e) => {
			game.set(e.record);
			map.set(e.record.expand!.map);
			//console.log('game changed');
		},
		{
			expand: 'map'
		}
	);
	//initial update
	const g = await pb.collection('game').getOne(id, {
		expand: 'map'
	});
	game.set(g);
	map.set(g.expand!.map);

	//trigger an update for the other client's lobbies to refresh
	await pb.collection('game').update(id, {});
}

//if the user was already in a game, subscribe to it
if (get(user) != null && get(user)!.game !== '') {
	await subscribeGame(get(user)?.game);
}

//if the user joined/left a game, subscribe/unsubscribe to it
user.subscribe(async (uuser) => {
	//console.log('user changed');
	if (uuser == null) {
		return;
	}
	//user left the game
	if (uuser.game === '' && get(game) != null) {
		unsubscribeGame();
		//trigger an update for the other client's lobbies to refresh
		await pb.collection('game').update(get(game)!.id, {
			refresh: true
		});
		game.set(undefined);
		return;
	}
	//user joined a game
	if (uuser.game !== '' && uuser.game != get(game)?.id) {
		await subscribeGame(uuser.game);
	}
});

export async function resetUsers() {
	const users = await pb.collection('user').getFullList({ filter: `game="${get(game)!.id}"` });
	for (const user of users) {
		await pb.collection('user').update(user.id, {
			guessed: false,
			score: {}
		});
	}
}

export async function prepareUsersForRound() {
	const round = get(game)!.round;
	const place = await pb.collection('panorama').getOne(get(map)!.places[round], {
		fields: 'latitude,longitude,height'
	});
	const users = await pb.collection('user').getFullList({ filter: `game="${get(game)!.id}"` });
	for (const user of users) {
		//console.log(user);
		user.score[round] = score(
			user.selectedLatitude,
			user.selectedLongitude,
			user.selectedHeight,
			place.latitude,
			place.longitude,
			place.height,
			user.guessed
		);
		await pb.collection('user').update(user.id, {
			guessed: false,
			score: user.score
		});
	}
}
