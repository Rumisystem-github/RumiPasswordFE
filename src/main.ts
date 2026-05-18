import { check_vault, get_private_key, passcode_login, regist_private_key } from "./vault";
import { check_service, get_self, get_token, login, regist_service } from "./login";
import { page_close, ui_refresh_site_list } from "./ui";
import { close_loading, loading_print, loading_wait, loading_wait_stop, LoadingType, set_loading_display } from "./Lib/loading";
import { RSPA } from "./Lib/spa";
import type { Dir, Site } from "./Type/item";
import { create_site, get_dir_list, get_site_list } from "./api";
import { show_custom_dialog, show_input } from "./Lib/dialog";
import { open_site_page } from "./Page/site_page";

let key_list:CryptoKey[] = [];
export let spa = new RSPA();
export let site_list:Site[] = [];
export let dir_list:Dir[] = [];
export let mel = {
	loading: document.getElementById("LOADING")! as HTMLDivElement,
	welcome_screen: {
		parent: document.getElementById("WELCOME_SCREEN")! as HTMLDivElement,
		setup_button: document.getElementById("SETUP_BUTTON")! as HTMLButtonElement
	},
	side: {
		site_add: document.getElementById("SIDE_SITE_ADD") as HTMLButtonElement,
		site_list: document.getElementById("SITE_LIST")! as HTMLDivElement
	},
	contents: {
		paret: document.getElementById("CONTENTS")! as HTMLDivElement,
		site: {
			parent: document.getElementById("SITE_PAGE")! as HTMLDivElement,
			name: document.getElementById("SITE_PAGE_NAME")! as HTMLHeadingElement,
			host: document.getElementById("SITE_PAGE_HOST")! as HTMLAnchorElement,
			edit: document.getElementById("SITE_PAGE_EDIT")! as HTMLButtonElement,
			add: document.getElementById("SITE_PAGE_ADD")! as HTMLButtonElement,
			data_list: document.getElementById("SITE_PAGE_DATA_LIST")! as HTMLDivElement
		}
	}
};

export type EncryptedData = {
	key_id: number,
	cipher: Uint8Array,
	iv: Uint8Array,
	tag: Uint8Array
};

window.addEventListener("load", async function() {
	set_loading_display(mel.loading);
	loading_print(LoadingType.Ok, "ﾍﾟｰｼﾞを読み込みました。");


	let l:string;

	try {
		//ログイン
		l = loading_wait("ﾛｸﾞｲﾝ中...");
		await login("password");
		loading_wait_stop(l!, true);

		//金庫システムのチェック
		l = loading_wait("金庫をﾁｪｯｸ中...");
		if (!await check_vault(get_token())) {
			window.location.href = "https://encrypt.rumiserver.com/?R=" + encodeURIComponent("https://pass.rumiserver.com/");
			return;
		}
		loading_wait_stop(l!, true);

		//パスコード要求
		const passcode = await show_input("設定したパスコードを入力してください");
		if (passcode == null || passcode == "") return;

		//金庫の鍵を生成
		l = loading_wait("金庫を開けています...");
		await passcode_login(get_token(), passcode, get_self().ID, get_self().REGIST_DATE);
		loading_wait_stop(l!, true);

		//使ったことがないなら初期設定画面を出す
		if (!await check_service("PASSWORD")) {
			close_loading();

			mel.welcome_screen.parent.style.display = "block";
			mel.welcome_screen.setup_button.onclick = async function() {
				mel.welcome_screen.parent.replaceChildren();

				for (let i = 0; i < 10; i++) {
					mel.welcome_screen.parent.innerText = `鍵を作成し、金庫に入れています！${i+1}個目`;

					const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
					await regist_private_key(`RUMIPASS_${i}`, get_token(), new Uint8Array(await crypto.subtle.exportKey("raw", key)));
				}

				await regist_service("PASSWORD");
				window.location.reload();
			}
			return;
		}

		//鍵をロード
		for (let i = 0; i < 10; i++) {
			l = loading_wait("鍵" + i + "を読み込んでいます...");
			const aes_key = await get_private_key(`RUMIPASS_${i}`, get_token());
			const imported_key = await crypto.subtle.importKey("raw", new Uint8Array(aes_key), { name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
			key_list[i] = imported_key;
			loading_wait_stop(l!, true);
		}

		l = loading_wait("取得しています...");
		await refresh_site_list();
		await refresh_dir_list();
		loading_wait_stop(l!, true);

		//UI初期化
		l = loading_wait("初期化中...");
		await ui_refresh_site_list();
		loading_wait_stop(l!, true);

		mel.side.site_add.onclick = function() {
			let contents = document.createElement("DIV") as HTMLDivElement;

			let name_input = document.createElement("INPUT") as HTMLInputElement;
			name_input.placeholder = "サイト名";
			contents.append(name_input);

			let host_list_el = document.createElement("DIV") as HTMLDivElement;
			contents.append(host_list_el);

			let host_add = document.createElement("BUTTON") as HTMLButtonElement;
			host_add.innerText = "+";
			contents.append(host_add);

			let cancel_button = document.createElement("BUTTON") as HTMLButtonElement;
			cancel_button.innerText = "やめた";
			contents.append(cancel_button);

			let ok_button = document.createElement("BUTTON") as HTMLButtonElement;
			ok_button.innerText = "OK";
			contents.append(ok_button);

			const dialog = show_custom_dialog(contents);

			host_add.onclick = async function() {
				const input = await show_input("URLかホスト名");
				if (input == null) return;

				let host:string = "";
				if (input.startsWith("http://") || input.startsWith("https://")) {
					host = new URL(input).host;
				} else {
					host = input;
				}

				let host_item = document.createElement("DIV") as HTMLDivElement;
				host_item.dataset.host = host;
				host_item.innerText = host;
				host_list_el.append(host_item);
			}

			cancel_button.onclick = function() {
				dialog.close();
			}

			ok_button.onclick = async function() {
				const name = name_input.value;
				let host_list = [];

				for (const el of host_list_el.children) {
					const item = el as HTMLElement;
					host_list.push(item.dataset.host!);
				}

				if (name === "") return;
				if (host_list.length === 0) return;

				await create_site(name, host_list);
				await refresh_dir_list();
				await ui_refresh_site_list();

				dialog.close();
			}
		}

		//SPA初期化
		spa.set_404_page(function () {
			page_close();

			console.log("404");
		});

		spa.set_route("/", false, function() {
			page_close();
		});

		spa.set_route("/site/", true, function() {
			page_close();
			open_site_page();
		});

		close_loading();

		spa.start();
	} catch (ex) {
		loading_wait_stop(l!, false);
		console.error(ex);
	}
});

export async function refresh_site_list() {
	site_list = await get_site_list();
}

export async function refresh_dir_list() {
	dir_list = await get_dir_list();
}

function pick_key(): number {
	const length = key_list.length;
	const max = Math.floor(0x100000000 / length) * length;
	const buffer = new Uint32Array(1);
	let n: number;
	do {
		crypto.getRandomValues(buffer);
		n = buffer[0];
	} while (n >= max);

	return n % length;
}

export async function encrypt(data: Uint8Array): Promise<EncryptedData> {
	const key_id = pick_key();
	const key = key_list[key_id];
	const iv = crypto.getRandomValues(new Uint8Array(12));
	const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv:iv }, key, new Uint8Array(data));
	const buffer = new Uint8Array(encrypted);

	const cipher = buffer.slice(0, buffer.length - 16);
	const tag = buffer.slice(buffer.length - 16);
	return {
		key_id: key_id,
		cipher: cipher,
		iv: iv,
		tag: tag
	};
}

export async function decrypt(encrypted: EncryptedData): Promise<Uint8Array> {
	const combined = new Uint8Array(encrypted.cipher.length + encrypted.tag.length);
	combined.set(encrypted.cipher);
	combined.set(encrypted.tag, encrypted.cipher.length);

	const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv: new Uint8Array(encrypted.iv) }, key_list[encrypted.key_id], combined);
	return new Uint8Array(decrypted);
}

export function base64_encode(data: Uint8Array): string {
	let b64 = "";
	for (let i = 0; i < data.length; i++) {
		b64 += String.fromCharCode(data[i]);
	}
	return btoa(b64);
}

export function base64_decode(base64: string): Uint8Array {
	const binary_string = atob(base64);
	const binary = new Uint8Array(binary_string.length);
	for (let i = 0; i < binary_string.length; i++) {
		binary[i] = binary_string.charCodeAt(i);
	}
	return binary;
}
