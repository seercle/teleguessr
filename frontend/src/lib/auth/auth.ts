import { writable } from 'svelte/store';
import { pb } from '$lib/pocketbase';

if (pb.authStore.isValid) {
	await pb.collection('user').authRefresh();
}

//load user
export const user = writable(pb.authStore.record);
let unsubscribeUser: (() => void) | undefined;
pb.authStore.onChange(async () => {
	if(pb.authStore.record && !unsubscribeUser) {
		unsubscribeUser = await pb.collection('user').subscribe(pb.authStore.record!.id, (e) => {
			user.set(e.record);
		});
		user.set(pb.authStore.record);
	}
	if(!pb.authStore.record && unsubscribeUser) {
		unsubscribeUser();
		unsubscribeUser = undefined;
	}
},true);
